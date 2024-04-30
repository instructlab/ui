package main

import (
	"context"
	"fmt"
	"net/http"
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

var rdb *redis.Client
var ctx = context.Background()
var logger *zap.Logger

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
}

func getAllJobs(c *gin.Context) {
	// Retrieve job IDs from the "results" list
	resultsJobIDs, err := rdb.LRange(ctx, redisQueueGenerate, 0, -1).Result()
	if err != nil {
		logger.Error("Error retrieving results job IDs from Redis", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve results job IDs"})
		return
	}

	// Retrieve job IDs from the "archived" list
	archiveJobIDs, err := rdb.LRange(ctx, redisQueueArchive, 0, -1).Result()
	if err != nil {
		logger.Error("Error retrieving archive job IDs from Redis", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve archive job IDs"})
		return
	}

	// Combine both redis lists
	jobIDs := append(archiveJobIDs, resultsJobIDs...)

	// Fetch job data for all unique job IDs
	jobs := make([]JobData, 0)
	seenIDs := make(map[string]bool)
	for _, jobID := range jobIDs {
		if _, found := seenIDs[jobID]; !found {
			seenIDs[jobID] = true // Mark as seen
			jobData, err := fetchJobData(jobID)
			if err != nil {
				logger.Error("Failed to fetch job data", zap.String("Job ID", jobID), zap.Error(err))
				continue // Skip on error
			}
			jobs = append(jobs, jobData)
		}
	}

	c.JSON(http.StatusOK, jobs)
}

func fetchJobData(jobID string) (JobData, error) {
	var jobData JobData
	// Fetch data from Redis, initializing each field.
	jobData.JobID = jobID
	jobData.Duration = rdb.Get(ctx, fmt.Sprintf("jobs:%s:duration", jobID)).Val()
	jobData.Status = rdb.Get(ctx, fmt.Sprintf("jobs:%s:status", jobID)).Val()
	jobData.S3URL = rdb.Get(ctx, fmt.Sprintf("jobs:%s:s3_url", jobID)).Val()
	jobData.ModelName = rdb.Get(ctx, fmt.Sprintf("jobs:%s:model_name", jobID)).Val()
	jobData.RepoOwner = rdb.Get(ctx, fmt.Sprintf("jobs:%s:repo_owner", jobID)).Val()
	jobData.Author = rdb.Get(ctx, fmt.Sprintf("jobs:%s:author", jobID)).Val()
	jobData.PrNumber = rdb.Get(ctx, fmt.Sprintf("jobs:%s:pr_number", jobID)).Val()
	jobData.PrSHA = rdb.Get(ctx, fmt.Sprintf("jobs:%s:pr_sha", jobID)).Val()
	jobData.RequestTime = rdb.Get(ctx, fmt.Sprintf("jobs:%s:request_time", jobID)).Val()
	jobData.Errors = rdb.Get(ctx, fmt.Sprintf("jobs:%s:errors", jobID)).Val()
	jobData.RepoName = rdb.Get(ctx, fmt.Sprintf("jobs:%s:repo_name", jobID)).Val()
	jobData.JobType = rdb.Get(ctx, fmt.Sprintf("jobs:%s:job_type", jobID)).Val()
	jobData.InstallationID = rdb.Get(ctx, fmt.Sprintf("jobs:%s:installation_id", jobID)).Val()

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

func setupRoutes(router *gin.Engine, apiUser, apiPass string) {
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Setup the route with authentication required
	authorized := router.Group("/")
	authorized.Use(AuthRequired(apiUser, apiPass))
	authorized.GET("/jobs", getAllJobs)

	// jobs route
	router.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "IL Redis Queue")
	})
}

func setupLogger(debugMode bool) *zap.Logger {
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
	return logger
}

func main() {
	debugFlag := pflag.Bool("debug", false, "Enable debug mode")
	listenAddress := pflag.String("listen-address", "localhost:3000", "Address to listen on")
	redisAddress := pflag.String("redis-server", "localhost:6379", "Redis server address")
	apiUser := pflag.String("api-user", "", "API username")
	apiPass := pflag.String("api-pass", "", "API password")
	pflag.Parse()

	logger = setupLogger(*debugFlag)
	defer logger.Sync()

	if *apiUser == "" || *apiPass == "" {
		logger.Fatal("Username and password must be provided")
	}

	rdb = redis.NewClient(&redis.Options{
		Addr: *redisAddress,
	})

	router := gin.Default()
	setupRoutes(router, *apiUser, *apiPass)

	logger.Info("Server starting", zap.String("listen-address", *listenAddress))
	if err := router.Run(*listenAddress); err != nil {
		logger.Error("Server failed to start", zap.Error(err))
	}
}
