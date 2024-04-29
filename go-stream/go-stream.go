package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
	"github.com/spf13/pflag"
	"go.uber.org/zap"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

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

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logger.Error("Error upgrading WebSocket", zap.Error(err))
		return
	}
	defer ws.Close()
	logger.Debug("WebSocket connection successfully upgraded.")

	// Immediately send all jobs in the results queue
	sendAllJobs(ws)

	failedPings := 0
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Check if the WebSocket connection is closed
			if ws == nil || ws.CloseHandler() != nil {
				logger.Debug("WebSocket connection appears to be closed.")
				return
			}

			if err := ws.WriteMessage(websocket.PingMessage, nil); err != nil {
				failedPings++
				logger.Info("Ping failed", zap.Int("attempt", failedPings), zap.Error(err))
				if failedPings > 3 {
					logger.Info("Closing connection after multiple failed pings.")
					return
				}
			} else {
				// Reset failed pings count on successful ping
				failedPings = 0
			}
		}
	}
}

func sendAllJobs(ws *websocket.Conn) {
	jobIDs, err := rdb.LRange(ctx, "results", 0, -1).Result()
	if err != nil {
		logger.Error("Error retrieving job IDs from Redis", zap.Error(err))
		return
	}
	logger.Debug("Sending data for jobs.", zap.Int("count", len(jobIDs)))

	for _, jobID := range jobIDs {
		jobData := fetchJobData(jobID)
		jsonData, err := json.Marshal(jobData)
		if err != nil {
			logger.Error("Error marshalling job data to JSON", zap.Error(err))
			continue
		}
		if err := ws.WriteMessage(websocket.TextMessage, jsonData); err != nil {
			logger.Error("Error sending job data over WebSocket", zap.Error(err))
			continue
		}
		logger.Debug("Job data sent.", zap.String("Job ID", jobID))
	}
}

func fetchJobData(jobID string) JobData {
	var jobData JobData
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

	logger.Debug("Fetched data for job.", zap.String("Job ID", jobID), zap.Any("Data", jobData))
	return jobData
}

func setupRoutes() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Redis Queue Dashboard")
	})
	http.HandleFunc("/ws", handleConnections)
}

func setupLogger(debugMode bool) *zap.Logger {
	var logLevel zap.AtomicLevel
	if debugMode {
		logLevel = zap.NewAtomicLevelAt(zap.DebugLevel)
	} else {
		logLevel = zap.NewAtomicLevelAt(zap.InfoLevel)
	}

	loggerConfig := zap.Config{
		Level:            logLevel,
		Encoding:         "console",
		EncoderConfig:    zap.NewDevelopmentEncoderConfig(),
		OutputPaths:      []string{"stderr"},
		ErrorOutputPaths: []string{"stderr"},
	}
	logger, err := loggerConfig.Build()
	if err != nil {
		panic(fmt.Sprintf("Cannot build logger: %v", err))
	}
	return logger
}

func main() {
	debugFlag := pflag.Bool("debug", false, "Enable debug mode")
	listenAddress := pflag.String("listen-address", "localhost:3000", "Address to listen on")
	redisAddress := pflag.String("redis-server", "localhost:6379", "Redis server address")
	pflag.Parse()

	logger = setupLogger(*debugFlag)
	defer logger.Sync()
	zap.ReplaceGlobals(logger)

	rdb = redis.NewClient(&redis.Options{
		Addr: *redisAddress,
	})

	setupRoutes()

	logger.Info("Server starting", zap.String("listen-address", *listenAddress))
	err := http.ListenAndServe(*listenAddress, nil)
	if err != nil {
		logger.Error("ListenAndServe failed", zap.Error(err))
	}
}
