package main

import (
	"encoding/base64"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type AuthRequest struct {
	Username string `json:"username"`
	ApiKey   string `json:"apiKey"`
}

type AuthResponse struct {
	AccessToken string `json:"access_token"`
}

type TaskRequest struct {
	FileURL []string `json:"file_url"`
}

type TaskResponse struct {
	TaskID        string `json:"task_id"`
	TaskStatus    string `json:"task_status"`
	TransactionID string `json:"transaction_id"`
}

type Task struct {
	TaskID     string `json:"task_id"`
	TaskStatus string `json:"task_status"`
	Result     struct {
		TransactionID string `json:"transaction_id"`
	} `json:"result"`
}

type DocumentHash struct {
	DocumentHash string `json:"document_hash"`
}

type DocumentArtifacts struct {
	DocumentPDF  string `json:"document_pdf"`
	DocumentMD   string `json:"document_md"`
	DocumentJSON string `json:"document_json"`
	PageImages   []struct {
		PageNo int    `json:"page_no"`
		URL    string `json:"url"`
	} `json:"page_images"`
}

var token = "mock-token"
var taskID = "mock-task-id"
var transactionID = "mock-transaction-id"
var documentHash = "mock-document-hash"

func main() {
	router := gin.Default()

	router.POST("/api/cps/user/v1/user/token", authenticate)
	router.POST("/api/cps/public/v1/project/:projKey/data_indices/:indexKey/actions/ccs_convert_upload", launchConvert)
	router.GET("/api/cps/public/v2/project/:projKey/celery_tasks/:taskId", waitForTask)
	router.GET("/api/cps/public/v2/project/:projKey/data_indices/:indexKey/documents/transactions/:transactionId", getDocumentHashes)
	router.GET("/api/cps/public/v2/project/:projKey/data_indices/:indexKey/documents/:documentHash/artifacts", getDocumentArtifacts)

	router.Run(":8080")
}

func authenticate(c *gin.Context) {
	var authRequest AuthRequest
	authHeader := c.GetHeader("Authorization")
	if strings.HasPrefix(authHeader, "Basic ") {
		encoded := strings.TrimPrefix(authHeader, "Basic ")
		decoded, _ := base64.StdEncoding.DecodeString(encoded)
		parts := strings.Split(string(decoded), ":")
		authRequest.Username = parts[0]
		authRequest.ApiKey = parts[1]
	}

	authResponse := AuthResponse{AccessToken: token}
	c.JSON(http.StatusOK, authResponse)
}

func launchConvert(c *gin.Context) {
	var taskRequest TaskRequest

	if err := c.BindJSON(&taskRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(taskRequest.FileURL) > 0 {
		fileURL := taskRequest.FileURL[0]
		if strings.HasPrefix(fileURL, "data:application/pdf;base64,") {
			base64Data := strings.TrimPrefix(fileURL, "data:application/pdf;base64,")
			if len(base64Data) > 20 {
				log.Printf("Received base64 string (last 20 chars): %s", base64Data[len(base64Data)-20:])
			} else {
				log.Printf("Received base64 string: %s", base64Data)
			}
		} else {
			log.Printf("FileURL does not start with expected base64 prefix")
		}
	} else {
		log.Printf("No file URL received in request")
	}

	taskResponse := TaskResponse{
		TaskID:        taskID,
		TaskStatus:    "PENDING",
		TransactionID: transactionID,
	}

	log.Printf("taskRequest -> %v", c.Request)
	log.Printf("taskResponse -> %v", taskResponse)

	c.JSON(http.StatusOK, taskResponse)
}

func waitForTask(c *gin.Context) {
	taskID := c.Param("taskId")
	status := "PENDING"

	// Simulate task completion after a delay
	time.Sleep(15 * time.Second)
	status = "SUCCESS"

	task := Task{
		TaskID:     taskID,
		TaskStatus: status,
		Result: struct {
			TransactionID string `json:"transaction_id"`
		}{
			TransactionID: transactionID,
		},
	}

	c.JSON(http.StatusOK, task)
}

func getDocumentHashes(c *gin.Context) {
	documentHashes := []DocumentHash{{DocumentHash: documentHash}}
	c.JSON(http.StatusOK, gin.H{"documents": documentHashes})
}

func getDocumentArtifacts(c *gin.Context) {
	documentArtifacts := DocumentArtifacts{
		DocumentPDF:  "mock-document-pdf",
		DocumentMD:   "# This is a mock markdown content\n\nSample content for the markdown file.",
		DocumentJSON: "mock-document-json",
		PageImages: []struct {
			PageNo int    `json:"page_no"`
			URL    string `json:"url"`
		}{
			{PageNo: 1, URL: "mock-url-1"},
			{PageNo: 2, URL: "mock-url-2"},
		},
	}
	c.JSON(http.StatusOK, gin.H{"artifacts": documentArtifacts})
}
