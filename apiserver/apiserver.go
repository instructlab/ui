package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/spf13/pflag"
	"go.uber.org/zap"
)

const (
	redisQueueGenerate = "generate"
	redisQueueArchive  = "archived"
)

const PreCheckEndpointURL = "https://merlinite-7b-vllm-openai.apps.fmaas-backend.fmaas.res.ibm.com/v1"

type ApiServer struct {
	router              *gin.Engine
	logger              *zap.SugaredLogger
	redis               *redis.Client
	ctx                 context.Context
	testMode            bool
	preCheckEndpointURL string
}

type JobData struct {
	JobID          string `json:"jobID"`
	Duration       string `json:"duration"`
	Status         string `json:"status"`
	S3URL          string `json:"s3URL"`
	ModelName      string `json:"modelName"`
	RepoOwner      string `json:"repoOwner"`
	Author         string `json:"author"`
	PrNumber       string `json:"prNumber"`
	PrSHA          string `json:"prSHA"`
	RequestTime    string `json:"requestTime"`
	Errors         string `json:"errors"`
	RepoName       string `json:"repoName"`
	JobType        string `json:"jobType"`
	InstallationID string `json:"installationID"`
	Cmd            string `json:"cmd"`
}

type ChatRequest struct {
	Question string `json:"question"`
	Context  string `json:"context"`
}

func (api *ApiServer) chatHandler(c *gin.Context) {

	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.logger.Error("Failed to bind JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	api.logger.Infof("Received chat request - question: %v context: %v", req.Question, req.Context)

	answer, err := api.runIlabChatCommand(req.Question, req.Context)
	if err != nil {
		api.logger.Error("Failed to execute chat command:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to execute command"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"answer": answer})
}

func (api *ApiServer) getAllJobs(c *gin.Context) {
	resultsJobIDs, err := api.redis.LRange(context.Background(), redisQueueGenerate, 0, -1).Result()
	if err != nil {
		api.logger.Error("Error retrieving results job IDs from Redis", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve results job IDs"})
		return
	}

	archiveJobIDs, err := api.redis.LRange(context.Background(), redisQueueArchive, 0, -1).Result()
	if err != nil {
		api.logger.Error("Error retrieving archive job IDs from Redis", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve archive job IDs"})
		return
	}

	jobIDs := append(archiveJobIDs, resultsJobIDs...)
	jobs := make([]JobData, 0)
	seenIDs := make(map[string]bool)
	for _, jobID := range jobIDs {
		if _, found := seenIDs[jobID]; !found {
			seenIDs[jobID] = true
			jobData, err := api.fetchJobData(jobID)
			if err != nil {
				api.logger.Error("Failed to fetch job data", zap.String("Job ID", jobID), zap.Error(err))
				continue
			}
			jobs = append(jobs, jobData)
		}
	}

	c.JSON(http.StatusOK, jobs)
}

func (api *ApiServer) fetchJobData(jobID string) (JobData, error) {
	var jobData JobData
	jobData.JobID = jobID
	jobData.Duration = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:duration", jobID)).Val()
	jobData.Status = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:status", jobID)).Val()
	jobData.S3URL = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:s3_url", jobID)).Val()
	jobData.ModelName = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:model_name", jobID)).Val()
	jobData.RepoOwner = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:repo_owner", jobID)).Val()
	jobData.Author = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:author", jobID)).Val()
	jobData.PrNumber = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:pr_number", jobID)).Val()
	jobData.PrSHA = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:pr_sha", jobID)).Val()
	jobData.RequestTime = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:request_time", jobID)).Val()
	jobData.Errors = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:errors", jobID)).Val()
	jobData.RepoName = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:repo_name", jobID)).Val()
	jobData.JobType = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:job_type", jobID)).Val()
	jobData.InstallationID = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:installation_id", jobID)).Val()
	jobData.Cmd = api.redis.Get(context.Background(), fmt.Sprintf("jobs:%s:cmd", jobID)).Val()

	return jobData, nil
}

func AuthRequired(username, password string) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, pass, hasAuth := c.Request.BasicAuth()
		if hasAuth && user == username && pass == password {
			c.Next()
			return
		}
		c.Header("WWW-Authenticate", "Basic realm=\"Authorization Required\"")
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
	}
}

func (api *ApiServer) setupRoutes(apiUser, apiPass string) {
	api.router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	authorized := api.router.Group("/")
	authorized.Use(AuthRequired(apiUser, apiPass))
	authorized.GET("/jobs", api.getAllJobs)
	authorized.POST("/chat", api.chatHandler)

	api.router.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "IL Redis Queue")
	})
}

func (api *ApiServer) runIlabChatCommand(question, context string) (string, error) {
	if question == "" {
		api.logger.Error("Question not found or not a string")
		return "", fmt.Errorf("invalid question")
	}

	// Append the context to the question if present
	if context != "" {
		question = fmt.Sprintf("%s Answer this based on the following context: %s.", question, context)
	}

	// Construct the command string with the formatted question
	commandStr := fmt.Sprintf("chat --quick-question '%s' --tls-insecure", question)

	// Determine the mode and adjust the command string accordingly
	var cmd *exec.Cmd
	if api.testMode {
		// the model name is a dummy example in test mode
		commandStr += fmt.Sprintf(" --endpoint-url %s --model %s", api.preCheckEndpointURL, "/shared_model_storage/transformers_cache/models--ibm--merlinite-7b/snapshots/233d12759d5bb9344231dafdb51310ec19d79c0e")
		cmdArgs := strings.Fields(commandStr)
		cmd = exec.Command("echo", cmdArgs...)
		api.logger.Infof("Running in test mode: %s", commandStr)
	} else {
		modelName, err := api.fetchModelName(true)
		if err != nil {
			api.logger.Errorf("Failed to fetch model name: %v", err)
			return "failed to retrieve the model name", err
		}
		commandStr += fmt.Sprintf(" --endpoint-url %s --model %s", api.preCheckEndpointURL, modelName)
		cmdArgs := strings.Fields(commandStr)
		cmd = exec.Command("ilab", cmdArgs...)
		api.logger.Infof("Running in production mode with model name %s: %s", modelName, commandStr)
	}

	// Set environment and buffers for capturing output
	cmd.Env = os.Environ()
	var out bytes.Buffer
	var errOut bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &errOut

	// Execute the command and check for errors
	err := cmd.Run()
	if err != nil {
		api.logger.Error("Command failed with error: ", zap.Error(err), zap.String("stderr", errOut.String()))
		return "", err
	}

	// Log successful execution and return the trimmed output
	api.logger.Infof("Command executed successfully, output: %s", out.String())
	return strings.TrimSpace(out.String()), nil
}

func setupLogger(debugMode bool) *zap.SugaredLogger {
	config := zap.NewDevelopmentConfig()
	if debugMode {
		config.Level = zap.NewAtomicLevelAt(zap.DebugLevel)
	} else {
		config.Level = zap.NewAtomicLevelAt(zap.InfoLevel)
	}
	logger, err := config.Build()
	if err != nil {
		panic(fmt.Sprintf("Cannot build logger: %v", err))
	}
	return logger.Sugar()
}

// fetchModelName hits the defined precheckEndpoint with "/models" appended to extract the model name.
// If fullName is true, it returns the entire ID value; if false, it returns the parsed out name after the double hyphens.
func (api *ApiServer) fetchModelName(fullName bool) (string, error) {
	// Ensure the endpoint URL ends with "/models"
	endpoint := api.preCheckEndpointURL
	if !strings.HasSuffix(endpoint, "/") {
		endpoint += "/"
	}
	endpoint += "models"

	http.DefaultTransport.(*http.Transport).TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	http.DefaultTransport.(*http.Transport).TLSHandshakeTimeout = 10 * time.Second
	http.DefaultTransport.(*http.Transport).ExpectContinueTimeout = 1 * time.Second

	req, err := http.NewRequestWithContext(api.ctx, "GET", endpoint, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to fetch model details: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	var responseData struct {
		Object string `json:"object"`
		Data   []struct {
			ID     string `json:"id"`
			Object string `json:"object"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &responseData); err != nil {
		return "", fmt.Errorf("failed to parse JSON response: %w", err)
	}

	if responseData.Object != "list" {
		return "", fmt.Errorf("expected object type 'list', got '%s'", responseData.Object)
	}

	// Extract the model name or the full ID based on the fullName flag
	for _, item := range responseData.Data {
		if item.Object == "model" {
			if !fullName {
				// Otherwise, parse and return the name after the last "--"
				parts := strings.Split(item.ID, "/")
				for _, part := range parts {
					if strings.Contains(part, "--") {
						nameParts := strings.Split(part, "--")
						if len(nameParts) > 1 {
							return nameParts[len(nameParts)-1], nil
						}
					}
				}
			}
			return item.ID, nil
		}
	}

	return "", fmt.Errorf("model name not found in response")
}

func main() {
	debugFlag := pflag.Bool("debug", false, "Enable debug mode")
	testMode := pflag.Bool("test-mode", false, "Don't run ilab commands, just echo back the ilab command to the chat response")
	listenAddress := pflag.String("listen-address", "localhost:3000", "Address to listen on")
	redisAddress := pflag.String("redis-server", "localhost:6379", "Redis server address")
	apiUser := pflag.String("api-user", "", "API username")
	apiPass := pflag.String("api-pass", "", "API password")
	preCheckEndpointURL := pflag.String("precheck-endpoint", PreCheckEndpointURL, "PreCheck endpoint URL")
	pflag.Parse()

	logger := setupLogger(*debugFlag)
	defer logger.Sync()

	if *apiUser == "" || *apiPass == "" {
		logger.Fatal("Username and password must be provided")
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: *redisAddress,
	})

	router := gin.Default()
	svr := ApiServer{
		router:              router,
		logger:              logger,
		redis:               rdb,
		ctx:                 context.Background(),
		testMode:            *testMode,
		preCheckEndpointURL: *preCheckEndpointURL,
	}
	svr.setupRoutes(*apiUser, *apiPass)

	svr.logger.Info("ApiServer starting", zap.String("listen-address", *listenAddress))
	if err := svr.router.Run(*listenAddress); err != nil {
		svr.logger.Error("ApiServer failed to start", zap.Error(err))
	}
}
