package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/spf13/cobra"
)

type Model struct {
	Name         string `json:"name"`
	LastModified string `json:"last_modified"`
	Size         string `json:"size"`
}

type Data struct {
	Dataset   string `json:"dataset"`
	CreatedAt string `json:"created_at"`
	FileSize  string `json:"file_size"`
}

type Job struct {
	JobID     string     `json:"job_id"`
	Cmd       string     `json:"cmd"`
	Args      []string   `json:"args"`
	Status    string     `json:"status"` // "running", "finished", "failed"
	PID       int        `json:"pid"`
	LogFile   string     `json:"log_file"`
	StartTime time.Time  `json:"start_time"`
	EndTime   *time.Time `json:"end_time,omitempty"`
	Branch    string     `json:"branch"`
	Lock      sync.Mutex `json:"-"`
}

// ModelCache encapsulates the cached models and related metadata.
type ModelCache struct {
	Models []Model
	Time   time.Time
	Mutex  sync.Mutex
}

type QnaEvalRequest struct {
	ModelPath string `json:"model_path"`
	YamlFile  string `json:"yaml_file"`
}

type VllmContainerResponse struct {
	Containers []VllmContainer `json:"containers"`
}

type UnloadModelRequest struct {
	ModelName string `json:"model_name"` // Expected values: "pre-train" or "post-train"
}

var (
	baseDir            string
	taxonomyPath       string
	rhelai             bool
	ilabCmd            string
	isOSX              bool
	isCuda             bool
	useVllm            bool
	pipelineType       string
	jobs               = make(map[string]*Job)
	jobsLock           = sync.Mutex{}
	modelLock          = sync.Mutex{}
	modelProcessBase   *exec.Cmd // Process for base model
	modelProcessLatest *exec.Cmd // Process for latest model
	baseModel          = "instructlab/granite-7b-lab"
	servedModelJobIDs  = make(map[string]string) // Maps "pre-train"/"post-train" => jobID
	// Cache variables
	modelCache = ModelCache{}
)

const jobsFile = "jobs.json"

func main() {
	rootCmd := &cobra.Command{
		Use:   "ilab-server",
		Short: "ILab Server Application",
		Run:   runServer,
	}

	rootCmd.Flags().BoolVar(&rhelai, "rhelai", false, "Use ilab binary from PATH instead of Python virtual environment")
	rootCmd.Flags().StringVar(&baseDir, "base-dir", "", "Base directory for ilab operations (required if --rhelai is not set)")
	rootCmd.Flags().StringVar(&taxonomyPath, "taxonomy-path", "", "Path to the taxonomy repository for Git operations (required)")
	rootCmd.Flags().BoolVar(&isOSX, "osx", false, "Enable OSX-specific settings (default: false)")
	rootCmd.Flags().BoolVar(&isCuda, "cuda", false, "Enable Cuda (default: false)")
	rootCmd.Flags().BoolVar(&useVllm, "vllm", false, "Enable VLLM model serving using podman containers")
	rootCmd.Flags().StringVar(&pipelineType, "pipeline", "", "Pipeline type (simple, accelerated, full)")

	// Mark flags as required based on --rhelai
	rootCmd.PreRunE = func(cmd *cobra.Command, args []string) error {
		if !rhelai && baseDir == "" {
			return fmt.Errorf("--base-dir is required unless --rhelai is set")
		}
		if taxonomyPath == "" {
			return fmt.Errorf("--taxonomy-path is required")
		}

		// Validate or set pipelineType based on --rhelai
		if !rhelai {
			if pipelineType == "" {
				return fmt.Errorf("--pipeline is required unless --rhelai is set")
			}
			switch pipelineType {
			case "simple", "full", "accelerated":
				// Valid pipeline types
			default:
				return fmt.Errorf("--pipeline must be 'simple', 'accelerated' or 'full'; got '%s'", pipelineType)
			}
		} else {
			// When --rhelai is set and --pipeline is not provided, set a default pipelineType
			if pipelineType == "" {
				pipelineType = "accelerated" // Default pipeline when --rhelai is enabled
				log.Println("--rhelai is set; defaulting --pipeline to 'accelerated'")
			} else {
				// If pipelineType is provided, validate it
				switch pipelineType {
				case "simple", "full", "accelerated":
					// Valid pipeline types
				default:
					return fmt.Errorf("--pipeline must be 'simple', 'accelerated' or 'full'; got '%s'", pipelineType)
				}
			}
		}

		return nil
	}

	if err := rootCmd.Execute(); err != nil {
		log.Fatalf("Error executing command: %v", err)
	}
}

func runServer(cmd *cobra.Command, args []string) {
	// Determine ilab command path
	if rhelai {
		// Use ilab from PATH
		ilabPath, err := exec.LookPath("ilab")
		if err != nil {
			log.Fatalf("ilab binary not found in PATH. Please ensure ilab is installed and in your PATH.")
		}
		ilabCmd = ilabPath
	} else {
		// Use ilab from virtual environment
		ilabCmd = filepath.Join(baseDir, "venv", "bin", "ilab")
		if _, err := os.Stat(ilabCmd); os.IsNotExist(err) {
			log.Fatalf("ilab binary not found at %s. Please ensure the virtual environment is set up correctly.", ilabCmd)
		}
	}

	log.Printf("Using ilab command: %s", ilabCmd)

	// Validate mandatory arguments if not using rhelai
	if !rhelai {
		if _, err := os.Stat(baseDir); os.IsNotExist(err) {
			log.Fatalf("Base directory does not exist: %s", baseDir)
		}
	}

	if _, err := os.Stat(taxonomyPath); os.IsNotExist(err) {
		log.Fatalf("Taxonomy path does not exist: %s", taxonomyPath)
	}

	log.Printf("Running with baseDir=%s, taxonomyPath=%s, isOSX=%v, isCuda=%v, useVllm=%v, pipeline=%s",
		baseDir, taxonomyPath, isOSX, isCuda, useVllm, pipelineType)
	log.Printf("Current working directory: %s", mustGetCwd())

	// Load existing jobs from file
	loadJobs()

	// Check statuses of running jobs from previous sessions
	checkRunningJobs()

	// Initialize the model cache
	initializeModelCache()

	// Create the logs directory if it doesn't exist
	err := os.MkdirAll("logs", os.ModePerm)
	if err != nil {
		log.Fatalf("Failed to create logs directory: %v", err)
	}

	// Setup HTTP routes
	r := mux.NewRouter()
	r.HandleFunc("/models", getModels).Methods("GET")
	r.HandleFunc("/data", getData).Methods("GET")
	r.HandleFunc("/data/generate", generateData).Methods("POST")
	r.HandleFunc("/model/train", trainModel).Methods("POST")
	r.HandleFunc("/jobs/{job_id}/status", getJobStatus).Methods("GET")
	r.HandleFunc("/jobs/{job_id}/logs", getJobLogs).Methods("GET")
	r.HandleFunc("/jobs", listJobs).Methods("GET")
	r.HandleFunc("/pipeline/generate-train", generateTrainPipeline).Methods("POST")
	r.HandleFunc("/model/serve-latest", serveLatestCheckpoint).Methods("POST")
	r.HandleFunc("/model/serve-base", serveBaseModel).Methods("POST")
	r.HandleFunc("/qna-eval", runQnaEval).Methods("POST")
	r.HandleFunc("/checkpoints", listCheckpoints).Methods("GET")
	r.HandleFunc("/vllm-containers", listVllmContainersHandler).Methods("GET")
	r.HandleFunc("/vllm-unload", unloadVllmContainerHandler).Methods("POST")
	r.HandleFunc("/vllm-status", getVllmStatusHandler).Methods("GET")
	r.HandleFunc("/gpu-free", getGpuFreeHandler).Methods("GET")

	// Start the server with logging
	log.Printf("Server starting on port 8080... (Taxonomy path: %s)", taxonomyPath)
	if err := http.ListenAndServe("0.0.0.0:8080", r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

// sanitizeModelName checks if the modelName starts with "model/" and replaces it with "models/".
func sanitizeModelName(modelName string) string {
	if strings.HasPrefix(modelName, "model/") {
		return strings.Replace(modelName, "model/", "models/", 1)
	}
	return modelName
}

// mustGetCwd returns the current working directory or "unknown" if it fails.
func mustGetCwd() string {
	cwd, err := os.Getwd()
	if err != nil {
		return "unknown"
	}
	return cwd
}

// Load jobs from the jobs.json file
func loadJobs() {
	jobsLock.Lock()
	defer jobsLock.Unlock()

	if _, err := os.Stat(jobsFile); os.IsNotExist(err) {
		// No jobs file exists
		return
	}

	data, err := ioutil.ReadFile(jobsFile)
	if err != nil {
		log.Printf("Error reading jobs file: %v", err)
		return
	}

	err = json.Unmarshal(data, &jobs)
	if err != nil {
		log.Printf("Error unmarshalling jobs data: %v", err)
		return
	}

	log.Printf("Loaded %d jobs from %s", len(jobs), jobsFile)
}

// Save jobs to the jobs.json file
func saveJobs() {
	jobsLock.Lock()
	defer jobsLock.Unlock()

	data, err := json.MarshalIndent(jobs, "", "  ")
	if err != nil {
		log.Printf("Error marshalling jobs data: %v", err)
		return
	}

	err = ioutil.WriteFile(jobsFile, data, 0644)
	if err != nil {
		log.Printf("Error writing jobs file: %v", err)
	}
}

// Check the status of running jobs after server restart
func checkRunningJobs() {
	jobsLock.Lock()
	changed := false
	for _, job := range jobs {
		if job.Status == "running" {
			// Check if the process is still running
			processRunning := isProcessRunning(job.PID)
			if !processRunning {
				job.Status = "failed"
				changed = true
				log.Printf("Job %s marked as failed (process not running)", job.JobID)
			}
		}
	}
	jobsLock.Unlock()

	if changed {
		saveJobs()
	}
}

// Check if a process with the given PID is running
func isProcessRunning(pid int) bool {
	process, err := os.FindProcess(pid)
	if err != nil {
		return false
	}
	err = process.Signal(syscall.Signal(0))
	return err == nil
}

// getIlabCommand returns the ilab command based on the --rhelai flag
func getIlabCommand() string {
	return ilabCmd
}

// getBaseCacheDir returns the base cache directory path: ~/.cache/instructlab/
func getBaseCacheDir() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user home directory: %v", err)
	}
	return filepath.Join(homeDir, ".cache", "instructlab"), nil
}

// Helper function to get the latest dataset file
func getLatestDatasetFile() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user home directory: %v", err)
	}
	datasetDir := filepath.Join(homeDir, ".local", "share", "instructlab", "datasets")
	files, err := ioutil.ReadDir(datasetDir)
	if err != nil {
		return "", fmt.Errorf("failed to read dataset directory: %v", err)
	}

	var latestFile os.FileInfo
	for _, file := range files {
		if strings.HasPrefix(file.Name(), "knowledge_train_msgs_") && strings.HasSuffix(file.Name(), ".jsonl") {
			if latestFile == nil || file.ModTime().After(latestFile.ModTime()) {
				latestFile = file
			}
		}
	}

	if latestFile == nil {
		return "", fmt.Errorf("no dataset file found with the prefix 'knowledge_train_msgs_'")
	}
	return filepath.Join(datasetDir, latestFile.Name()), nil
}

// Initialize the model cache on server startup and start periodic refresh
func initializeModelCache() {
	// Initial cache refresh
	refreshModelCache()

	// Start a goroutine to refresh the cache every 20 minutes
	go func() {
		for {
			time.Sleep(20 * time.Minute)
			refreshModelCache()
		}
	}()
}

// Refresh the model cache if it's older than 20 minutes
// TODO: needs to be more realtime, ilab command delays on RHEL make it problematic so it needs to be cached
// until the delay is resolved in rhelai podman caching
func refreshModelCache() {
	modelCache.Mutex.Lock()
	defer modelCache.Mutex.Unlock()

	// Check if cache is valid
	if time.Since(modelCache.Time) < 20*time.Minute && len(modelCache.Models) > 0 {
		log.Println("Model cache is still valid; no refresh needed.")
		return
	}

	log.Println("Refreshing model cache...")
	output, err := runIlabCommand("model", "list")
	if err != nil {
		log.Printf("Error refreshing model cache: %v", err)
		return
	}

	models, err := parseModelList(output)
	if err != nil {
		log.Printf("Error parsing model list during cache refresh: %v", err)
		return
	}

	modelCache.Models = models
	modelCache.Time = time.Now()
	log.Printf("Model cache refreshed at %v with %d models.", modelCache.Time, len(modelCache.Models))
}

// GetModels is the HTTP handler for the /models endpoint.
// It serves cached model data, refreshing the cache if necessary.
func getModels(w http.ResponseWriter, r *http.Request) {
	log.Println("GET /models called")

	// Lock the cache for reading
	modelCache.Mutex.Lock()
	cachedTime := modelCache.Time
	cachedModels := make([]Model, len(modelCache.Models))
	copy(cachedModels, modelCache.Models)
	modelCache.Mutex.Unlock()

	// Check if cache is valid
	if len(cachedModels) > 0 && time.Since(cachedTime) < 20*time.Minute {
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(cachedModels); err != nil {
			log.Printf("Error encoding cached models: %v", err)
			http.Error(w, "Failed to encode models", http.StatusInternalServerError)
			return
		}
		log.Println("GET /models returned cached models.")
		return
	}

	// If cache is empty or stale, refresh the cache
	log.Println("Cache is empty or stale. Refreshing model cache, blocking until complete ~15s...")
	refreshModelCache()

	// After refresh, attempt to serve the cache
	modelCache.Mutex.Lock()
	cachedTime = modelCache.Time
	cachedModels = make([]Model, len(modelCache.Models))
	copy(cachedModels, modelCache.Models)
	modelCache.Mutex.Unlock()

	if len(cachedModels) > 0 {
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(cachedModels); err != nil {
			log.Printf("Error encoding refreshed models: %v", err)
			http.Error(w, "Failed to encode models", http.StatusInternalServerError)
			return
		}
		log.Println("GET /models returned refreshed models.")
	} else {
		http.Error(w, "Failed to retrieve models", http.StatusInternalServerError)
		log.Println("GET /models failed to retrieve models.")
	}
}

// runIlabCommand executes the ilab command with the provided arguments.
func runIlabCommand(args ...string) (string, error) {
	cmdPath := getIlabCommand()
	cmd := exec.Command(cmdPath, args...)
	if !rhelai {
		cmd.Dir = baseDir
	}
	out, err := cmd.CombinedOutput()
	return string(out), err
}

// parseModelList parses the output of the "ilab model list" command into a slice of Model structs.
func parseModelList(output string) ([]Model, error) {
	var models []Model
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "+") || strings.HasPrefix(line, "| Model Name") || line == "" {
			continue
		}
		if strings.HasPrefix(line, "|") {
			line = strings.Trim(line, "|")
			fields := strings.Split(line, "|")
			if len(fields) != 3 {
				continue
			}
			model := Model{
				Name:         strings.TrimSpace(fields[0]),
				LastModified: strings.TrimSpace(fields[1]),
				Size:         strings.TrimSpace(fields[2]),
			}
			models = append(models, model)
		}
	}
	return models, nil
}

// getData is the HTTP handler for the /data endpoint.
func getData(w http.ResponseWriter, r *http.Request) {
	log.Println("GET /data called")
	output, err := runIlabCommand("data", "list")
	if err != nil {
		log.Printf("Error running 'ilab data list': %v", err)
		http.Error(w, string(output), http.StatusInternalServerError)
		return
	}
	dataList, err := parseDataList(output)
	if err != nil {
		log.Printf("Error parsing data list: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dataList)
	log.Println("GET /data successful")
}

// parseDataList parses the output of the "ilab data list" command into a slice of Data structs.
func parseDataList(output string) ([]Data, error) {
	var dataList []Data
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "+") || strings.HasPrefix(line, "| Dataset") || line == "" {
			continue
		}
		if strings.HasPrefix(line, "|") {
			line = strings.Trim(line, "|")
			fields := strings.Split(line, "|")
			if len(fields) != 3 {
				continue
			}
			data := Data{
				Dataset:   strings.TrimSpace(fields[0]),
				CreatedAt: strings.TrimSpace(fields[1]),
				FileSize:  strings.TrimSpace(fields[2]),
			}
			dataList = append(dataList, data)
		}
	}
	return dataList, nil
}

// generateData is the HTTP handler for the /data/generate endpoint.
func generateData(w http.ResponseWriter, r *http.Request) {
	log.Println("POST /data/generate called")
	jobID, err := startGenerateJob()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"job_id": jobID})
	log.Printf("POST /data/generate successful, job_id: %s", jobID)
}

// startGenerateJob starts the data generation job and returns the job ID.
func startGenerateJob() (string, error) {
	ilabPath := getIlabCommand()

	//cmdArgs := []string{"data", "generate", "--pipeline", pipelineType}
	// TODO: for now, focus on accelerated pipeline.
	// Should GPUs be variable or just the default?
	cmdArgs := []string{"data", "generate"}

	cmd := exec.Command(ilabPath, cmdArgs...)

	if !rhelai {
		cmd.Dir = baseDir
	}

	jobID := fmt.Sprintf("g-%d", time.Now().UnixNano())
	logFilePath := filepath.Join("logs", fmt.Sprintf("%s.log", jobID))
	log.Printf("Starting generateData job: %s, logs: %s", jobID, logFilePath)
	logFile, err := os.Create(logFilePath)
	if err != nil {
		log.Printf("Error creating log file: %v", err)
		return "", fmt.Errorf("Failed to create log file")
	}

	cmd.Stdout = logFile
	cmd.Stderr = logFile

	log.Printf("Running command: %s %v", ilabPath, cmdArgs)
	if err := cmd.Start(); err != nil {
		log.Printf("Error starting data generation command: %v", err)
		logFile.Close()
		return "", err
	}

	job := &Job{
		JobID:     jobID,
		Cmd:       ilabPath,
		Args:      cmdArgs,
		Status:    "running",
		PID:       cmd.Process.Pid,
		LogFile:   logFilePath,
		StartTime: time.Now(),
	}

	jobsLock.Lock()
	jobs[jobID] = job
	jobsLock.Unlock()

	saveJobs()

	go func() {
		err := cmd.Wait()
		logFile.Close()

		job.Lock.Lock()
		defer job.Lock.Unlock()

		if err != nil {
			job.Status = "failed"
			log.Printf("Job %s failed with error: %v", job.JobID, err)
		} else {
			if cmd.ProcessState.Success() {
				job.Status = "finished"
				log.Printf("Job %s finished successfully", job.JobID)
			} else {
				job.Status = "failed"
				log.Printf("Job %s failed", job.JobID)
			}
		}

		now := time.Now()
		job.EndTime = &now
		saveJobs()
	}()

	return jobID, nil
}

// trainModel is the HTTP handler for the /model/train endpoint.
func trainModel(w http.ResponseWriter, r *http.Request) {
	log.Println("POST /model/train called")

	var reqBody struct {
		ModelName  string `json:"modelName"`
		BranchName string `json:"branchName"`
		Epochs     *int   `json:"epochs,omitempty"` // Optional
	}

	// Parse the request body
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		log.Printf("Error parsing request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("Received train request with modelName: '%s', branchName: '%s', epochs: '%v'",
		reqBody.ModelName, reqBody.BranchName, reqBody.Epochs)

	// Ensure required fields are provided
	if reqBody.ModelName == "" || reqBody.BranchName == "" {
		log.Println("Missing required parameters: modelName or branchName")
		http.Error(w, "Missing required parameters: modelName or branchName", http.StatusBadRequest)
		return
	}

	// If epochs is provided, ensure it's a positive integer
	if reqBody.Epochs != nil && *reqBody.Epochs <= 0 {
		log.Println("Invalid 'epochs' parameter: must be a positive integer")
		http.Error(w, "'epochs' must be a positive integer", http.StatusBadRequest)
		return
	}

	// Sanitize the modelName (still important in some cases)
	sanitizedModelName := sanitizeModelName(reqBody.ModelName)
	log.Printf("Sanitized modelName: '%s'", sanitizedModelName)

	// Perform Git checkout
	gitCheckoutCmd := exec.Command("git", "checkout", reqBody.BranchName)
	gitCheckoutCmd.Dir = taxonomyPath
	gitOutput, err := gitCheckoutCmd.CombinedOutput()

	log.Printf("Git checkout output: %s", string(gitOutput))

	if err != nil {
		log.Printf("Error checking out branch '%s': %v", reqBody.BranchName, err)
		http.Error(w, fmt.Sprintf("Failed to checkout branch '%s': %s", reqBody.BranchName, string(gitOutput)), http.StatusInternalServerError)
		return
	}

	log.Printf("Successfully checked out branch: '%s'", reqBody.BranchName)

	// Start the training job, passing the sanitized model name, branch name, and epochs
	jobID, err := startTrainJob(sanitizedModelName, reqBody.BranchName, reqBody.Epochs)
	if err != nil {
		log.Printf("Error starting train job: %v", err)
		http.Error(w, "Failed to start train job", http.StatusInternalServerError)
		return
	}

	log.Printf("Train job started successfully with job_id: '%s'", jobID)

	// Return the job ID in the response
	response := map[string]string{
		"job_id": jobID,
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Failed to send response", http.StatusInternalServerError)
		return
	}

	log.Println("POST /model/train response sent successfully")
}

// listVllmContainersHandler handles the GET /vllm-containers endpoint.
func listVllmContainersHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("GET /vllm-containers called")

	containers, err := ListVllmContainers()
	if err != nil {
		log.Printf("Error listing vllm containers: %v", err)
		http.Error(w, "Failed to list vllm containers", http.StatusInternalServerError)
		return
	}

	response := VllmContainerResponse{
		Containers: containers,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding vllm containers response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}

	log.Printf("GET /vllm-containers returned %d containers", len(containers))
}

// unloadVllmContainerHandler handles the POST /vllm-unload endpoint.
func unloadVllmContainerHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("POST /vllm-unload called")

	var req UnloadModelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding unload model request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate the model name
	modelName := strings.TrimSpace(req.ModelName)
	if modelName != "pre-train" && modelName != "post-train" {
		log.Printf("Invalid model_name provided: %s", modelName)
		http.Error(w, "Invalid model_name. Must be 'pre-train' or 'post-train'", http.StatusBadRequest)
		return
	}

	// Attempt to stop the vllm container
	err := StopVllmContainer(modelName)
	if err != nil {
		log.Printf("Error unloading model '%s': %v", modelName, err)
		http.Error(w, fmt.Sprintf("Failed to unload model '%s': %v", modelName, err), http.StatusInternalServerError)
		return
	}

	// Respond with success
	response := map[string]string{
		"status":    "success",
		"message":   fmt.Sprintf("Model '%s' unloaded successfully", modelName),
		"modelName": modelName,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	log.Printf("POST /vllm-unload successfully unloaded model '%s'", modelName)
}

func getVllmStatusHandler(w http.ResponseWriter, r *http.Request) {
	// e.g. GET /vllm-status?model_name=pre-train
	modelName := r.URL.Query().Get("model_name")
	if modelName != "pre-train" && modelName != "post-train" {
		http.Error(w, "Invalid model_name (must be 'pre-train' or 'post-train')", http.StatusBadRequest)
		return
	}

	// 1) Check if container with that served-model-name is running
	containers, err := ListVllmContainers()
	if err != nil {
		log.Printf("Error listing vllm containers: %v", err)
		http.Error(w, "Failed to list vllm containers", http.StatusInternalServerError)
		return
	}

	var containerRunning bool
	for _, c := range containers {
		if c.ServedModelName == modelName {
			containerRunning = true
			break
		}
	}

	// If the container is not running => status = "stopped" (or respond however you want)
	if !containerRunning {
		// Optionally return JSON with { "status": "stopped" }
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "stopped"})
		return
	}

	// Container is indeed running. Let's find the job logs for that container:
	jobsLock.Lock()
	jobID, ok := servedModelJobIDs[modelName]
	jobsLock.Unlock()
	if !ok {
		// If for some reason we don't have a job ID stored, we can do "loading" or "unknown"
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "loading"})
		return
	}

	// Retrieve the job to find the log file
	jobsLock.Lock()
	job, exists := jobs[jobID]
	jobsLock.Unlock()
	if !exists {
		// If the job no longer exists, handle it as you wish
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "loading"})
		return
	}

	// Attempt to see if the log contains "Uvicorn running on"
	if job.LogFile == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "loading"})
		return
	}

	logBytes, err := ioutil.ReadFile(job.LogFile)
	if err != nil {
		// If there's an error reading logs, treat it as "loading"
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "loading"})
		return
	}

	logContent := string(logBytes)
	if strings.Contains(logContent, "Uvicorn running on") {
		// if found => "running"
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "running"})
	} else {
		// not found => "loading"
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "loading"})
	}
}

// getQpuFreeHandler checks how many GPUs are "free" based on nvidia-smi output.
func getGpuFreeHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("GET /gpu-free called")

	cmd := exec.Command("nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader")
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		log.Printf("Error running nvidia-smi: %v, stderr: %s", err, stderr.String())
		w.Header().Set("Content-Type", "application/json")
		// Return zero for both free_gpus & total_gpus on error
		json.NewEncoder(w).Encode(map[string]int{"free_gpus": 0, "total_gpus": 0})
		return
	}

	lines := strings.Split(strings.TrimSpace(out.String()), "\n")
	freeCount := 0

	// Track total GPUs
	totalCount := 0

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		// Increment total GPUs for each non-empty line
		totalCount++

		// If it's "1 MiB" we consider that GPU free
		if strings.HasPrefix(line, "1 ") {
			freeCount++
		}
	}

	// Return both free_gpus and total_gpus
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{
		"free_gpus":  freeCount,
		"total_gpus": totalCount,
	})

	log.Printf("GET /gpu-free => free_gpus=%d, total_gpus=%d", freeCount, totalCount)
}

// startTrainJob starts a training job with the given parameters.
func startTrainJob(modelName, branchName string, epochs *int) (string, error) {
	log.Printf("Starting training job for model: '%s', branch: '%s'", modelName, branchName)

	// Generate a unique job ID
	jobID := fmt.Sprintf("t-%d", time.Now().UnixNano())
	logFilePath := filepath.Join("logs", fmt.Sprintf("%s.log", jobID))

	// Get the full model path. This ensures ~/.cache/instructlab/models/... is always used.
	fullModelPath, err := getFullModelPath(modelName)
	if err != nil {
		return "", fmt.Errorf("failed to get full model path: %v", err)
	}
	log.Printf("Resolved fullModelPath: '%s'", fullModelPath)

	// Ensure the model directory exists (e.g., ~/.cache/instructlab/models/...)
	modelDir := filepath.Dir(fullModelPath)
	if err := os.MkdirAll(modelDir, os.ModePerm); err != nil {
		return "", fmt.Errorf("failed to create model directory '%s': %v", modelDir, err)
	}

	ilabPath := getIlabCommand()

	// Initialize command arguments
	cmdArgs := []string{
		"model", "train",
	}

	// Conditionally add the --pipeline argument only if not rhelai and pipelineType is set
	if !rhelai && pipelineType != "" {
		cmdArgs = append(cmdArgs, "--pipeline", pipelineType)
	}

	// Always include --model-path
	cmdArgs = append(cmdArgs, fmt.Sprintf("--model-path=%s", fullModelPath))

	// Append device flags based on configuration
	if isOSX {
		cmdArgs = append(cmdArgs, "--device=mps")
	}
	if isCuda {
		cmdArgs = append(cmdArgs, "--device=cuda")
	}

	// Conditionally add the --num-epochs flag if epochs is specified
	if epochs != nil {
		cmdArgs = append(cmdArgs, fmt.Sprintf("--num-epochs=%d", *epochs))
		log.Printf("Number of epochs specified: %d", *epochs)
	} else {
		log.Println("No epochs specified; using default number of epochs.")
	}

	// -------------------------------------------------------------------------
	// SPECIAL LOGIC for pipelineType == "simple" (when not rhelai).
	//   1) Copy the latest "knowledge_train_msgs_*.jsonl" => train_gen.jsonl
	//   2) Copy the latest "test_ggml-model-*.jsonl"      => test_gen.jsonl
	//   3) Pass only the dataset directory to --data-path
	// -------------------------------------------------------------------------
	if pipelineType == "simple" && !rhelai {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", fmt.Errorf("failed to get user home directory: %v", err)
		}
		datasetDir := filepath.Join(homeDir, ".local", "share", "instructlab", "datasets")

		// 1) Find the latest "knowledge_train_msgs_*.jsonl"
		latestTrainFile, err := findLatestFileWithPrefix(datasetDir, "knowledge_train_msgs_")
		if err != nil {
			return "", fmt.Errorf("failed to find knowledge_train_msgs_*.jsonl file: %v", err)
		}
		// Copy it to train_gen.jsonl
		trainGenPath := filepath.Join(datasetDir, "train_gen.jsonl")
		if err := overwriteCopy(latestTrainFile, trainGenPath); err != nil {
			return "", fmt.Errorf("failed to copy %s to %s: %v", latestTrainFile, trainGenPath, err)
		}

		// 2) Find the latest "test_ggml-model-*.jsonl"
		latestTestFile, err := findLatestFileWithPrefix(datasetDir, "test_ggml-model")
		if err != nil {
			return "", fmt.Errorf("failed to find test_ggml-model*.jsonl file: %v", err)
		}
		// Copy it to test_gen.jsonl
		testGenPath := filepath.Join(datasetDir, "test_gen.jsonl")
		if err := overwriteCopy(latestTestFile, testGenPath); err != nil {
			return "", fmt.Errorf("failed to copy %s to %s: %v", latestTestFile, testGenPath, err)
		}

		// Finally, pass only the dataset directory to --data-path
		cmdArgs = []string{
			"model", "train",
			"--pipeline", pipelineType,
			fmt.Sprintf("--data-path=%s", datasetDir),
			fmt.Sprintf("--model-path=%s", fullModelPath),
		}
		if isOSX {
			cmdArgs = append(cmdArgs, "--device=mps")
		}
		if isCuda {
			cmdArgs = append(cmdArgs, "--device=cuda")
		}

		// Re-apply the epoch flag if epochs were specified
		if epochs != nil {
			cmdArgs = append(cmdArgs, fmt.Sprintf("--num-epochs=%d", *epochs))
			log.Printf("Number of epochs specified for simple pipeline: %d", *epochs)
		} else {
			log.Println("No epochs specified for simple pipeline; using default number of epochs.")
		}
	}

	// Handle rhelai-specific logic
	if rhelai {
		latestDataset, err := getLatestDatasetFile()
		if err != nil {
			return "", fmt.Errorf("failed to get latest dataset file: %v", err)
		}
		cmdArgs = []string{
			"model", "train",
			fmt.Sprintf("--data-path=%s", latestDataset),
			"--max-batch-len=5000",
			"--gpus=4",
			"--device=cuda",
			"--save-samples=1000",
			fmt.Sprintf("--model-path=%s", fullModelPath),
			"--pipeline", pipelineType, // Include the pipelineType set in PreRunE
		}
		if epochs != nil {
			cmdArgs = append(cmdArgs, fmt.Sprintf("--num-epochs=%d", *epochs))
			log.Printf("Number of epochs specified for rhelai pipeline: %d", *epochs)
		} else {
			log.Println("No epochs specified for rhelai pipeline; using default number of epochs.")
		}
	}

	log.Printf("[ILAB TRAIN COMMAND] %s %v", ilabPath, cmdArgs)

	// Create the exec.Command
	cmd := exec.Command(ilabPath, cmdArgs...)
	if !rhelai {
		cmd.Dir = baseDir
	}

	logFile, err := os.Create(logFilePath)
	if err != nil {
		return "", fmt.Errorf("failed to create log file '%s': %v", logFilePath, err)
	}
	defer logFile.Close()

	// Redirect command output to log file
	cmd.Stdout = logFile
	cmd.Stderr = logFile

	// Start the command
	if err := cmd.Start(); err != nil {
		return "", fmt.Errorf("error starting training command: %v", err)
	}
	log.Printf("Training process started with PID: %d", cmd.Process.Pid)

	// Save job details
	job := &Job{
		JobID:     jobID,
		Cmd:       ilabPath,
		Args:      cmdArgs,
		Status:    "running",
		PID:       cmd.Process.Pid,
		LogFile:   logFilePath,
		Branch:    branchName,
		StartTime: time.Now(),
	}

	jobsLock.Lock()
	jobs[jobID] = job
	jobsLock.Unlock()
	saveJobs()

	// Wait for process completion in a goroutine
	go func() {
		err := cmd.Wait()
		logFile.Close()

		job.Lock.Lock()
		defer job.Lock.Unlock()

		if err != nil {
			job.Status = "failed"
			log.Printf("Training job '%s' failed: %v", job.JobID, err)
		} else if cmd.ProcessState.Success() {
			job.Status = "finished"
			log.Printf("Training job '%s' finished successfully", job.JobID)
		} else {
			job.Status = "failed"
			log.Printf("Training job '%s' failed (unknown reason)", job.JobID)
		}

		now := time.Now()
		job.EndTime = &now
		saveJobs()
	}()

	return jobID, nil
}

// getJobStatus is the HTTP handler for the /jobs/{job_id}/status endpoint.
func getJobStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	jobID := vars["job_id"]
	log.Printf("GET /jobs/%s/status called", jobID)
	jobsLock.Lock()
	job, exists := jobs[jobID]
	jobsLock.Unlock()
	if !exists {
		log.Printf("Job %s not found", jobID)
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	}
	job.Lock.Lock()
	status := job.Status
	job.Lock.Unlock()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"job_id":  job.JobID,
		"status":  job.Status,
		"branch":  job.Branch,
		"command": job.Cmd,
	})
	log.Printf("GET /jobs/%s/status successful, status: %s", jobID, status)
}

// listJobs is the HTTP handler for the /jobs endpoint.
func listJobs(w http.ResponseWriter, r *http.Request) {
	log.Println("GET /jobs called")
	jobsLock.Lock()
	defer jobsLock.Unlock()
	var jobList []Job
	for _, job := range jobs {
		job.Lock.Lock()
		jobCopy := *job
		job.Lock.Unlock()
		jobList = append(jobList, jobCopy)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(jobList)
}

// getJobLogs is the HTTP handler for the /jobs/{job_id}/logs endpoint.
func getJobLogs(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	jobID := vars["job_id"]
	log.Printf("GET /jobs/%s/logs called", jobID)

	jobsLock.Lock()
	job, exists := jobs[jobID]
	jobsLock.Unlock()

	if !exists {
		log.Printf("Job %s not found", jobID)
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	}

	if _, err := os.Stat(job.LogFile); os.IsNotExist(err) {
		log.Printf("Log file for job %s not found", jobID)
		http.Error(w, "Log file not found", http.StatusNotFound)
		return
	}

	logContent, err := ioutil.ReadFile(job.LogFile)
	if err != nil {
		log.Printf("Error reading log file for job %s: %v", jobID, err)
		http.Error(w, "Failed to read log file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write(logContent)
	log.Printf("GET /jobs/%s/logs successful", jobID)
}

// generateTrainPipeline is the HTTP handler for the /pipeline/generate-train endpoint.
func generateTrainPipeline(w http.ResponseWriter, r *http.Request) {
	log.Println("POST /pipeline/generate-train called")
	var reqBody struct {
		ModelName  string `json:"modelName"`
		BranchName string `json:"branchName"`
		Epochs     *int   `json:"epochs,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		log.Printf("Error parsing request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Ensure required fields are provided
	if reqBody.ModelName == "" || reqBody.BranchName == "" {
		log.Println("Missing required parameters: modelName or branchName")
		http.Error(w, "Missing required parameters: modelName or branchName", http.StatusBadRequest)
		return
	}

	// Sanitize the modelName
	sanitizedModelName := sanitizeModelName(reqBody.ModelName)
	log.Printf("Sanitized modelName for pipeline: '%s'", sanitizedModelName)

	// Create a unique pipeline job ID
	pipelineJobID := fmt.Sprintf("p-%d", time.Now().UnixNano())
	log.Printf("Starting pipeline job with ID: %s", pipelineJobID)

	// Save the pipeline job as a placeholder
	job := &Job{
		JobID:     pipelineJobID,
		Cmd:       "pipeline-generate-train",
		Args:      []string{sanitizedModelName, reqBody.BranchName},
		Status:    "running",
		PID:       0,
		LogFile:   fmt.Sprintf("logs/%s.log", pipelineJobID),
		Branch:    reqBody.BranchName,
		StartTime: time.Now(),
	}

	jobsLock.Lock()
	jobs[pipelineJobID] = job
	jobsLock.Unlock()

	saveJobs()

	// Start the pipeline in a separate goroutine
	go runPipelineJob(job, sanitizedModelName, reqBody.BranchName, reqBody.Epochs)

	// Respond immediately with the pipeline job ID
	response := map[string]string{
		"pipeline_job_id": pipelineJobID,
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Failed to send response", http.StatusInternalServerError)
		return
	}

	log.Printf("POST /pipeline/generate-train response sent successfully with job_id: %s", pipelineJobID)
}

// listCheckpoints is the HTTP handler for the /checkpoints endpoint.
// It lists all directories within the default checkpoints directory.
func listCheckpoints(w http.ResponseWriter, r *http.Request) {
	log.Println("GET /checkpoints called")

	// Get the user's home directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Printf("Error getting user home directory: %v", err)
		http.Error(w, "Failed to get user home directory", http.StatusInternalServerError)
		return
	}

	// Define the default checkpoints directory
	checkpointsDir := filepath.Join(homeDir, ".local", "share", "instructlab", "checkpoints", "hf_format")

	// Check if the checkpoints directory exists
	if _, err := os.Stat(checkpointsDir); os.IsNotExist(err) {
		log.Printf("Checkpoints directory does not exist: %s", checkpointsDir)
		http.Error(w, "Checkpoints directory does not exist", http.StatusNotFound)
		return
	}

	// Read the contents of the checkpoints directory
	entries, err := ioutil.ReadDir(checkpointsDir)
	if err != nil {
		log.Printf("Error reading checkpoints directory: %v", err)
		http.Error(w, "Failed to read checkpoints directory", http.StatusInternalServerError)
		return
	}

	// Filter out files, retaining only directories
	var directories []string
	for _, entry := range entries {
		if entry.IsDir() {
			directories = append(directories, entry.Name())
		}
	}

	// Return the list of directories as JSON
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(directories); err != nil {
		log.Printf("Error encoding directories to JSON: %v", err)
		http.Error(w, "Failed to encode directories", http.StatusInternalServerError)
		return
	}

	log.Printf("GET /checkpoints successful, %d directories returned", len(directories))
}

// serveModel starts serving a model on the specified port.
func serveModel(modelPath, port string, w http.ResponseWriter) {
	modelLock.Lock()
	defer modelLock.Unlock()

	log.Printf("serveModel called with modelPath=%s, port=%s", modelPath, port)

	// Determine which model we are serving based on port
	var targetProcess **exec.Cmd
	if port == "8000" {
		targetProcess = &modelProcessBase
	} else if port == "8001" {
		targetProcess = &modelProcessLatest
	} else {
		http.Error(w, "Invalid port specified", http.StatusBadRequest)
		return
	}

	// Check model file existence
	if _, err := os.Stat(modelPath); os.IsNotExist(err) {
		log.Printf("Model path does not exist: %s", modelPath)
		http.Error(w, fmt.Sprintf("Model path does not exist: %s", modelPath), http.StatusNotFound)
		return
	}
	log.Printf("Model file found at: %s", modelPath)

	// Kill only the process corresponding to this port
	if *targetProcess != nil && (*targetProcess).Process != nil {
		log.Printf("Stopping existing model process on port %s...", port)
		if err := (*targetProcess).Process.Kill(); err != nil {
			log.Printf("Failed to kill existing model process on port %s: %v", port, err)
			http.Error(w, "Failed to stop existing model process", http.StatusInternalServerError)
			return
		}
		*targetProcess = nil
	}

	var cmdArgs []string
	cmdArgs = []string{
		"serve", "model",
		"--model", modelPath,
		"--host", "0.0.0.0",
		"--port", port,
	}

	cmdPath := getIlabCommand()
	cmd := exec.Command(cmdPath, cmdArgs...)
	if !rhelai {
		cmd.Dir = baseDir
	}

	jobID := fmt.Sprintf("ml-%d", time.Now().UnixNano())
	logFilePath := filepath.Join("logs", fmt.Sprintf("%s.log", jobID))
	log.Printf("Model serve logs: %s", logFilePath)
	logFile, err := os.Create(logFilePath)
	if err != nil {
		log.Printf("Error creating model run log file: %v", err)
		http.Error(w, "Failed to create log file", http.StatusInternalServerError)
		return
	}

	cmd.Stdout = logFile
	cmd.Stderr = logFile

	log.Println("Attempting to start model process...")
	if err := cmd.Start(); err != nil {
		log.Printf("Error starting model process: %v", err)
		logFile.Close()
		http.Error(w, "Failed to start model process", http.StatusInternalServerError)
		return
	}

	*targetProcess = cmd
	log.Printf("Model process started with PID %d on port %s", cmd.Process.Pid, port)

	// Save job details
	job := &Job{
		JobID:     jobID,
		Cmd:       cmdPath,
		Args:      cmdArgs,
		Status:    "running",
		PID:       cmd.Process.Pid,
		LogFile:   logFilePath,
		StartTime: time.Now(),
	}
	log.Printf("Model serve job details: %+v", job)

	jobsLock.Lock()
	jobs[jobID] = job
	jobsLock.Unlock()
	saveJobs()

	// Monitor the model process
	go func() {
		log.Printf("Waiting for model process to finish (job_id: %s, port: %s)", jobID, port)
		err := cmd.Wait()
		logFile.Sync()
		logFile.Close()

		job.Lock.Lock()
		defer job.Lock.Unlock()

		if err != nil {
			job.Status = "failed"
			log.Printf("Model run job '%s' on port %s failed: %v", jobID, port, err)
		} else if cmd.ProcessState.Success() {
			job.Status = "finished"
			log.Printf("Model run job '%s' on port %s finished successfully", jobID, port)
		} else {
			job.Status = "failed"
			log.Printf("Model run job '%s' on port %s failed (unknown reason)", jobID, port)
		}

		now := time.Now()
		job.EndTime = &now
		saveJobs()

		// If the process ends, clear the reference
		modelLock.Lock()
		defer modelLock.Unlock()
		if port == "8000" {
			if modelProcessBase == cmd {
				modelProcessBase = nil
			}
		} else if port == "8001" {
			if modelProcessLatest == cmd {
				modelProcessLatest = nil
			}
		}
	}()

	log.Printf("Model serve started successfully on port %s, returning job_id: %s", port, jobID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "model process started", "job_id": jobID})
}

// serveLatestCheckpoint serves the latest checkpoint model on port 8001.
func serveLatestCheckpoint(w http.ResponseWriter, r *http.Request) {
	log.Println("POST /model/serve-latest called, loading the latest checkpoint")

	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Printf("Error getting user home directory: %v", err)
		http.Error(w, "Failed to get home directory", http.StatusInternalServerError)
		return
	}

	if useVllm {
		// Spawn podman container for latest checkpoint
		latestModelPath := filepath.Join(homeDir, ".local", "share", "instructlab", "checkpoints", "hf_format")
		log.Printf("Serving latest model using vllm at %s on port 8001", latestModelPath)
		runVllmContainer(
			fmt.Sprintf("%s/%s", latestModelPath, "samples_1192378"),
			"8001",
			"post-train",
			1, // GPU device index
			"/var/home/cloud-user",
			"/var/home/cloud-user",
			w,
		)
	} else {
		// Default serving behavior
		latestModelPath := filepath.Join(homeDir, ".local", "share", "instructlab", "checkpoints", "ggml-model-f16.gguf")
		log.Printf("Serving latest model at %s on port 8001", latestModelPath)
		serveModel(latestModelPath, "8001", w)
	}
}

// serveBaseModel serves the "base" model on port 8000.
func serveBaseModel(w http.ResponseWriter, r *http.Request) {
	log.Println("POST /model/serve-base called")

	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Printf("Error getting user home directory: %v", err)
		http.Error(w, "Failed to get home directory", http.StatusInternalServerError)
		return
	}

	if useVllm {
		// Spawn podman container for base model
		baseModelPath := filepath.Join(homeDir, ".cache", "instructlab", "models", "granite-8b-starter-v1")
		log.Printf("Serving base model using vllm at %s on port 8000", baseModelPath)
		runVllmContainer(
			baseModelPath,
			"8000",
			"pre-train",
			0, // GPU device index
			"/var/home/cloud-user",
			"/var/home/cloud-user",
			w,
		)
	} else {
		// Default serving behavior
		baseModelPath := filepath.Join(homeDir, ".cache", "instructlab", "models", "granite-7b-lab-Q4_K_M.gguf")
		log.Printf("Serving base model at %s on port 8000", baseModelPath)
		serveModel(baseModelPath, "8000", w)
	}
}

// runVllmContainer spawns a podman container running vllm
func runVllmContainer(modelPath, port, servedModelName string, gpuIndex int, hostVolume, containerVolume string, w http.ResponseWriter) {
	cmdArgs := []string{
		"run", "--rm",
		fmt.Sprintf("--device=nvidia.com/gpu=%d", gpuIndex),
		fmt.Sprintf("-e=NVIDIA_VISIBLE_DEVICES=%d", gpuIndex),
		"-v", "/usr/local/cuda-12.4/lib64:/usr/local/cuda-12.4/lib64",
		"-v", fmt.Sprintf("%s:%s", hostVolume, containerVolume),
		"-p", fmt.Sprintf("%s:%s", port, port),
		"--ipc=host",
		"vllm/vllm-openai:latest",
		"--host", "0.0.0.0",
		"--port", port,
		"--model", modelPath,
		"--load-format", "safetensors",
		"--config-format", "hf",
		"--trust-remote-code",
		"--device", "cuda",
		"--served-model-name", servedModelName,
	}

	fullCmd := fmt.Sprintf("podman %s", strings.Join(cmdArgs, " "))
	log.Printf("Executing Podman command: %s", fullCmd)

	jobID := fmt.Sprintf("v-%d", time.Now().UnixNano())
	logFilePath := filepath.Join("logs", fmt.Sprintf("%s.log", jobID))
	log.Printf("Starting vllm-openai container with job_id: %s, logs: %s", jobID, logFilePath)

	cmd := exec.Command("podman", cmdArgs...)

	// Redirect command output to log file
	logFile, err := os.Create(logFilePath)
	if err != nil {
		log.Printf("Error creating log file for vllm job %s: %v", jobID, err)
		http.Error(w, "Failed to create log file for vllm job", http.StatusInternalServerError)
		return
	}
	cmd.Stdout = logFile
	cmd.Stderr = logFile

	if err := cmd.Start(); err != nil {
		log.Printf("Error starting podman container for vllm job %s: %v", jobID, err)
		logFile.Close()
		http.Error(w, "Failed to start vllm container", http.StatusInternalServerError)
		return
	}

	log.Printf("Vllm container started with PID %d for job_id: %s", cmd.Process.Pid, jobID)

	// Save job details
	job := &Job{
		JobID:     jobID,
		Cmd:       "podman",
		Args:      cmdArgs,
		Status:    "running",
		PID:       cmd.Process.Pid,
		LogFile:   logFilePath,
		StartTime: time.Now(),
	}

	jobsLock.Lock()
	jobs[jobID] = job
	jobsLock.Unlock()
	saveJobs()

	servedModelJobIDs[servedModelName] = jobID

	go func() {
		err := cmd.Wait()
		logFile.Sync()
		logFile.Close()

		job.Lock.Lock()
		defer job.Lock.Unlock()

		if err != nil {
			job.Status = "failed"
			log.Printf("Vllm job '%s' failed: %v", job.JobID, err)
		} else if cmd.ProcessState.Success() {
			job.Status = "finished"
			log.Printf("Vllm job '%s' finished successfully", job.JobID)
		} else {
			job.Status = "failed"
			log.Printf("Vllm job '%s' failed (unknown reason)", job.JobID)
		}

		now := time.Now()
		job.EndTime = &now
		saveJobs()
	}()

	// Respond with the job ID
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "vllm container started",
		"job_id": jobID,
	})
	log.Printf("POST /model/serve-%s response sent successfully with job_id: %s", servedModelName, jobID)
}

// runPipelineJob executes the pipeline steps: Git checkout, data generation, and training.
func runPipelineJob(job *Job, modelName, branchName string, epochs *int) {
	logFile, err := os.Create(job.LogFile)
	if err != nil {
		log.Printf("Error creating pipeline log file for job %s: %v", job.JobID, err)
		jobsLock.Lock()
		job.Status = "failed"
		jobsLock.Unlock()
		saveJobs()
		return
	}
	defer logFile.Close()

	logger := log.New(logFile, "", log.LstdFlags)

	logger.Printf("Starting pipeline job: %s, model: %s, branch: %s, epochs: %v", job.JobID, modelName, branchName, epochs)

	// Perform Git checkout
	gitCheckoutCmd := exec.Command("git", "checkout", branchName)
	gitCheckoutCmd.Dir = taxonomyPath
	gitOutput, gitErr := gitCheckoutCmd.CombinedOutput()
	logger.Printf("Git checkout output: %s", string(gitOutput))
	if gitErr != nil {
		logger.Printf("Failed to checkout branch '%s': %v", branchName, gitErr)
		jobsLock.Lock()
		job.Status = "failed"
		jobsLock.Unlock()
		saveJobs()
		return
	}

	// Start data generation step
	logger.Println("Starting data generation step...")
	genJobID, genErr := startGenerateJob()
	if genErr != nil {
		logger.Printf("Data generation step failed: %v", genErr)
		jobsLock.Lock()
		job.Status = "failed"
		jobsLock.Unlock()
		saveJobs()
		return
	}
	logger.Printf("Data generation step started successfully with job_id: '%s'", genJobID)

	// Wait for data generation to finish
	for {
		time.Sleep(5 * time.Second)
		jobsLock.Lock()
		genJob, exists := jobs[genJobID]
		jobsLock.Unlock()

		if !exists || genJob.Status == "failed" {
			logger.Println("Data generation step failed.")
			jobsLock.Lock()
			job.Status = "failed"
			jobsLock.Unlock()
			saveJobs()
			return
		}

		if genJob.Status == "finished" {
			logger.Println("Data generation step completed successfully.")
			break
		}
	}

	// Start training step
	logger.Println("Starting training step...")
	trainJobID, trainErr := startTrainJob(modelName, branchName, epochs)
	if trainErr != nil {
		logger.Printf("Training step failed: %v", trainErr)
		jobsLock.Lock()
		job.Status = "failed"
		jobsLock.Unlock()
		saveJobs()
		return
	}
	logger.Printf("Training step started successfully with job_id: '%s'", trainJobID)

	// Wait for training to finish
	for {
		time.Sleep(5 * time.Second)
		jobsLock.Lock()
		tJob, tExists := jobs[trainJobID]
		jobsLock.Unlock()

		if !tExists || tJob.Status == "failed" {
			logger.Println("Training step failed.")
			jobsLock.Lock()
			job.Status = "failed"
			jobsLock.Unlock()
			saveJobs()
			return
		}

		if tJob.Status == "finished" {
			logger.Println("Training step completed successfully.")
			break
		}
	}

	// Pipeline completed successfully
	jobsLock.Lock()
	job.Status = "finished"
	jobsLock.Unlock()
	saveJobs()
	logger.Println("Pipeline job completed successfully.")
}

func runQnaEval(w http.ResponseWriter, r *http.Request) {
	log.Println("POST /qna-eval called")

	// Decode the JSON request body
	var req QnaEvalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate that model_path exists
	if _, err := os.Stat(req.ModelPath); os.IsNotExist(err) {
		log.Printf("Model path does not exist: %s", req.ModelPath)
		http.Error(w, fmt.Sprintf("Model path does not exist: %s", req.ModelPath), http.StatusBadRequest)
		return
	}

	// Validate that yaml_file exists
	if _, err := os.Stat(req.YamlFile); os.IsNotExist(err) {
		log.Printf("YAML file does not exist: %s", req.YamlFile)
		http.Error(w, fmt.Sprintf("YAML file does not exist: %s", req.YamlFile), http.StatusBadRequest)
		return
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Printf("Failed to get user's home directory: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Construct the Podman command
	cmd := exec.Command("podman", "run", "--rm",
		"--device", "nvidia.com/gpu=all",
		"-v", fmt.Sprintf("%s:%s", homeDir, homeDir),
		"quay.io/bsalisbu/qna-eval",
		"--model_path", req.ModelPath,
		"--yaml_file", req.YamlFile,
	)

	// Capture stdout and stderr
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	log.Printf("Executing Podman command: %v", cmd.Args)

	err = cmd.Run()

	if err != nil {
		log.Printf("Podman command failed: %v", err)
		log.Printf("Error Output: %s", stderr.String())

		// Respond with error logs
		response := map[string]string{
			"error": stderr.String(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Command was successful, return the output
	response := map[string]string{
		"result": stdout.String(),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
	log.Println("POST /qna-eval completed successfully")
}
