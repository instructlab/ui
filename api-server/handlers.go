package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// -----------------------------------------------------------------------------
// HTTP Handlers
// -----------------------------------------------------------------------------

// getModelsHandler is the HTTP handler for the /models endpoint.
func (srv *ILabServer) getModelsHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Info("GET /models called")

	srv.modelCache.Mutex.Lock()
	cachedTime := srv.modelCache.Time
	cachedModels := make([]Model, len(srv.modelCache.Models))
	copy(cachedModels, srv.modelCache.Models)
	srv.modelCache.Mutex.Unlock()

	if len(cachedModels) > 0 && time.Since(cachedTime) < 20*time.Minute {
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(cachedModels); err != nil {
			srv.log.Errorf("Error encoding cached models: %v", err)
			http.Error(w, "Failed to encode models", http.StatusInternalServerError)
			return
		}
		srv.log.Info("GET /models returned cached models.")
		return
	}

	srv.log.Info("Cache is empty or stale. Refreshing model cache now...")
	srv.refreshModelCache()

	srv.modelCache.Mutex.Lock()
	cachedTime = srv.modelCache.Time
	cachedModels = make([]Model, len(srv.modelCache.Models))
	copy(cachedModels, srv.modelCache.Models)
	srv.modelCache.Mutex.Unlock()

	if len(cachedModels) > 0 {
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(cachedModels); err != nil {
			srv.log.Errorf("Error encoding refreshed models: %v", err)
			http.Error(w, "Failed to encode models", http.StatusInternalServerError)
			return
		}
		srv.log.Info("GET /models returned refreshed models.")
	} else {
		http.Error(w, "Failed to retrieve models", http.StatusInternalServerError)
		srv.log.Info("GET /models failed to retrieve models.")
	}
}

// getDataHandler is the HTTP handler for the /data endpoint.
func (srv *ILabServer) getDataHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Info("GET /data called")
	output, err := srv.runIlabCommand("data", "list")
	if err != nil {
		srv.log.Errorf("Error running 'ilab data list': %v", err)
		http.Error(w, string(output), http.StatusInternalServerError)
		return
	}
	dataList, err := srv.parseDataList(output)
	if err != nil {
		srv.log.Errorf("Error parsing data list: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(dataList)
	srv.log.Info("GET /data successful")
}

// generateDataHandler is the HTTP handler for the /data/generate endpoint.
func (srv *ILabServer) generateDataHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Info("POST /data/generate called")
	jobID, err := srv.startGenerateJob()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"job_id": jobID})
	srv.log.Infof("POST /data/generate successful, job_id: %s", jobID)
}

// trainModelHandler is the HTTP handler for the /model/train endpoint.
func (srv *ILabServer) trainModelHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Info("POST /model/train called")

	var reqBody struct {
		ModelName  string `json:"modelName"`
		BranchName string `json:"branchName"`
		Epochs     *int   `json:"epochs,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		srv.log.Errorf("Error parsing request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if reqBody.ModelName == "" || reqBody.BranchName == "" {
		srv.log.Info("Missing required parameters: modelName or branchName")
		http.Error(w, "Missing required parameters: modelName or branchName", http.StatusBadRequest)
		return
	}
	if reqBody.Epochs != nil && *reqBody.Epochs <= 0 {
		srv.log.Info("Invalid 'epochs' parameter: must be a positive integer")
		http.Error(w, "'epochs' must be a positive integer", http.StatusBadRequest)
		return
	}

	sanitizedModelName := srv.sanitizeModelName(reqBody.ModelName)
	srv.log.Infof("Sanitized modelName: '%s'", sanitizedModelName)

	// Git checkout
	gitCheckoutCmd := exec.Command("git", "checkout", reqBody.BranchName)
	gitCheckoutCmd.Dir = srv.taxonomyPath
	gitOutput, err := gitCheckoutCmd.CombinedOutput()
	srv.log.Infof("Git checkout output: %s", string(gitOutput))
	if err != nil {
		srv.log.Errorf("Error checking out branch '%s': %v", reqBody.BranchName, err)
		http.Error(w, fmt.Sprintf("Failed to checkout branch '%s': %s", reqBody.BranchName, string(gitOutput)), http.StatusInternalServerError)
		return
	}
	srv.log.Infof("Successfully checked out branch: '%s'", reqBody.BranchName)

	jobID, err := srv.startTrainJob(sanitizedModelName, reqBody.BranchName, reqBody.Epochs)
	if err != nil {
		srv.log.Errorf("Error starting train job: %v", err)
		http.Error(w, "Failed to start train job", http.StatusInternalServerError)
		return
	}
	srv.log.Infof("Train job started successfully with job_id: '%s'", jobID)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"job_id": jobID})
	srv.log.Info("POST /model/train response sent successfully")
}

// listVllmContainersHandler handles the GET /vllm-containers endpoint.
func (srv *ILabServer) listVllmContainersHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Info("GET /vllm-containers called")

	containers, err := srv.ListVllmContainers()
	if err != nil {
		srv.log.Errorf("Error listing vllm containers: %v", err)
		http.Error(w, "Failed to list vllm containers", http.StatusInternalServerError)
		return
	}

	response := VllmContainerResponse{
		Containers: containers,
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		srv.log.Errorf("Error encoding vllm containers response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
	srv.log.Infof("GET /vllm-containers returned %d containers", len(containers))
}

// unloadVllmContainerHandler handles the POST /vllm-unload endpoint.
func (srv *ILabServer) unloadVllmContainerHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Info("POST /vllm-unload called")

	var req UnloadModelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		srv.log.Errorf("Error decoding unload model request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	modelName := strings.TrimSpace(req.ModelName)
	if modelName != "pre-train" && modelName != "post-train" {
		srv.log.Errorf("Invalid model_name provided: %s", modelName)
		http.Error(w, "Invalid model_name. Must be 'pre-train' or 'post-train'", http.StatusBadRequest)
		return
	}

	err := srv.StopVllmContainer(modelName)
	if err != nil {
		srv.log.Errorf("Error unloading model '%s': %v", modelName, err)
		http.Error(w, fmt.Sprintf("Failed to unload model '%s': %v", modelName, err), http.StatusInternalServerError)
		return
	}

	response := map[string]string{
		"status":    "success",
		"message":   fmt.Sprintf("Model '%s' unloaded successfully", modelName),
		"modelName": modelName,
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
	srv.log.Infof("POST /vllm-unload successfully unloaded model '%s'", modelName)
}

// getVllmStatusHandler handles the GET /vllm-status endpoint.
func (srv *ILabServer) getVllmStatusHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Infof("vllm status called")
	modelName := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("model_name")))
	srv.log.Infof("Received model_name: '%s'", modelName)

	if modelName != "pre-train" && modelName != "post-train" {
		srv.log.Warnf("Invalid model_name provided: %s", modelName)
		http.Error(w, "Invalid model_name (must be 'pre-train' or 'post-train')", http.StatusBadRequest)
		return
	}

	containers, err := srv.ListVllmContainers()
	if err != nil {
		srv.log.Errorf("Error listing vllm containers: %v", err)
		http.Error(w, "Failed to list vllm containers", http.StatusInternalServerError)
		return
	}

	var containerRunning bool
	for _, c := range containers {
		srv.log.Debugf("Checking container %s for model '%s'", c.ContainerID, modelName)
		if strings.ToLower(c.ServedModelName) == modelName {
			containerRunning = true
			break
		}
	}

	w.Header().Set("Content-Type", "application/json")

	if !containerRunning {
		srv.log.Infof("No running container found for model '%s'", modelName)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "stopped"})
		return
	}

	srv.jobIDsMutex.RLock()
	jobID, ok := srv.servedModelJobIDs[modelName]
	srv.jobIDsMutex.RUnlock()

	if !ok {
		srv.log.Infof("WTF jobid not found for model '%s'", modelName)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "loading"})
		return
	}

	srv.log.Infof("Retrieved job ID '%s' for model '%s'", jobID, modelName)

	job, err := srv.getJob(jobID)
	if err != nil {
		srv.log.Errorf("Error retrieving job '%s': %v", jobID, err)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "loading"})
		return
	}
	if job == nil {
		srv.log.Warnf("Job '%s' not found in DB", jobID)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "loading"})
		return
	}

	if job.LogFile == "" {
		srv.log.Warnf("No log file specified for job '%s'", jobID)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "loading"})
		return
	}

	srv.log.Infof("Reading log file '%s' for job '%s'", job.LogFile, jobID)
	logBytes, err := ioutil.ReadFile(job.LogFile)
	if err != nil {
		srv.log.Errorf("Error reading log file '%s': %v", job.LogFile, err)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "loading"})
		return
	}

	logContent := string(logBytes)

	if strings.Contains(logContent, "Uvicorn running") {
		srv.log.Infof("vLLM has finished loading model '%s'", modelName)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "running"})
	} else {
		srv.log.Debugf("Uvicorn not detected in logs for job '%s', current status: loading", jobID)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "loading"})
	}
}

// getGpuFreeHandler is the HTTP handler for the /gpu-free endpoint.
func (srv *ILabServer) getGpuFreeHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Info("GET /gpu-free called")

	cmd := exec.Command("nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader")
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		srv.log.Errorf("Error running nvidia-smi: %v, stderr: %s", err, stderr.String())
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]int{"free_gpus": 0, "total_gpus": 0})
		return
	}

	lines := strings.Split(strings.TrimSpace(out.String()), "\n")
	freeCount := 0
	totalCount := 0

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		totalCount++
		if strings.HasPrefix(line, "1 ") {
			freeCount++
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]int{
		"free_gpus":  freeCount,
		"total_gpus": totalCount,
	})
	srv.log.Infof("GET /gpu-free => free_gpus=%d, total_gpus=%d", freeCount, totalCount)
}

// -----------------------------------------------------------------------------
// Jobs Handlers
// -----------------------------------------------------------------------------

func (srv *ILabServer) getJobStatusHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	jobID := vars["job_id"]
	srv.log.Infof("GET /jobs/%s/status called", jobID)

	job, err := srv.getJob(jobID)
	if err != nil {
		srv.log.Errorf("Error retrieving job from DB: %v", err)
		http.Error(w, "Failed to retrieve job", http.StatusInternalServerError)
		return
	}
	if job == nil {
		srv.log.Infof("Job %s not found", jobID)
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"job_id":  job.JobID,
		"status":  job.Status,
		"branch":  job.Branch,
		"command": job.Cmd,
	})
	srv.log.Infof("GET /jobs/%s/status successful, status: %s", jobID, job.Status)
}

func (srv *ILabServer) getJobLogsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	jobID := vars["job_id"]
	srv.log.Debugf("GET /jobs/%s/logs called", jobID)

	job, err := srv.getJob(jobID)
	if err != nil {
		srv.log.Errorf("Error retrieving job from DB: %v", err)
		http.Error(w, "Failed to retrieve job", http.StatusInternalServerError)
		return
	}
	if job == nil {
		srv.log.Warnf("Job %s not found in DB", jobID)
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	}

	if _, err := os.Stat(job.LogFile); os.IsNotExist(err) {
		srv.log.Warnf("Log file for job %s not found", jobID)
		http.Error(w, "Log file not found", http.StatusNotFound)
		return
	}
	logContent, err := ioutil.ReadFile(job.LogFile)
	if err != nil {
		srv.log.Errorf("Error reading log file for job %s: %v", jobID, err)
		http.Error(w, "Failed to read log file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	_, _ = w.Write(logContent)
	srv.log.Infof("GET /jobs/%s/logs successful", jobID)
}

func (srv *ILabServer) listJobsHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Debugf("GET /jobs called")
	jobList, err := srv.listAllJobs()
	if err != nil {
		srv.log.Errorf("Error listing jobs: %v", err)
		http.Error(w, "Failed to list jobs", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(jobList)
}

// -----------------------------------------------------------------------------
// Checkpoints
// -----------------------------------------------------------------------------

// listCheckpointsHandler is the HTTP handler for the /checkpoints endpoint.
func (srv *ILabServer) listCheckpointsHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Info("GET /checkpoints called")

	homeDir, err := os.UserHomeDir()
	if err != nil {
		srv.log.Errorf("Error getting user home directory: %v", err)
		http.Error(w, "Failed to get user home directory", http.StatusInternalServerError)
		return
	}

	checkpointsDir := filepath.Join(homeDir, ".local", "share", "instructlab", "checkpoints", "hf_format")
	if _, err := os.Stat(checkpointsDir); os.IsNotExist(err) {
		srv.log.Infof("Checkpoints directory does not exist: %s", checkpointsDir)
		http.Error(w, "Checkpoints directory does not exist", http.StatusNotFound)
		return
	}

	entries, err := ioutil.ReadDir(checkpointsDir)
	if err != nil {
		srv.log.Errorf("Error reading checkpoints directory: %v", err)
		http.Error(w, "Failed to read checkpoints directory", http.StatusInternalServerError)
		return
	}

	var directories []string
	for _, entry := range entries {
		if entry.IsDir() {
			directories = append(directories, entry.Name())
		}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(directories); err != nil {
		srv.log.Errorf("Error encoding directories to JSON: %v", err)
		http.Error(w, "Failed to encode directories", http.StatusInternalServerError)
		return
	}
	srv.log.Infof("GET /checkpoints successful, %d directories returned", len(directories))
}

// -----------------------------------------------------------------------------
// QnA Evaluation
// -----------------------------------------------------------------------------

// runQnaEval is the HTTP handler for /qna-eval.
func (srv *ILabServer) runQnaEval(w http.ResponseWriter, r *http.Request) {
	srv.log.Info("POST /qna-eval called")

	var req QnaEvalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		srv.log.Errorf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if _, err := os.Stat(req.ModelPath); os.IsNotExist(err) {
		srv.log.Errorf("Model path does not exist: %s", req.ModelPath)
		http.Error(w, fmt.Sprintf("Model path does not exist: %s", req.ModelPath), http.StatusBadRequest)
		return
	}
	if _, err := os.Stat(req.YamlFile); os.IsNotExist(err) {
		srv.log.Errorf("YAML file does not exist: %s", req.YamlFile)
		http.Error(w, fmt.Sprintf("YAML file does not exist: %s", req.YamlFile), http.StatusBadRequest)
		return
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		srv.log.Errorf("Failed to get user's home directory: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	cmd := exec.Command("podman", "run", "--rm",
		"--device", "nvidia.com/gpu=all",
		"-v", fmt.Sprintf("%s:%s", homeDir, homeDir),
		"quay.io/bsalisbu/qna-eval",
		"--model_path", req.ModelPath,
		"--yaml_file", req.YamlFile,
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	srv.log.Infof("Executing Podman command: %v", cmd.Args)
	err = cmd.Run()
	if err != nil {
		srv.log.Errorf("Podman command failed: %v, stderr: %s", err, stderr.String())
		response := map[string]string{"error": stderr.String()}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(response)
		return
	}

	response := map[string]string{
		"result": stdout.String(),
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
	srv.log.Info("POST /qna-eval completed successfully")
}

// -----------------------------------------------------------------------------
// Serve Models (CPU-based) or via VLLM
// -----------------------------------------------------------------------------

// serveLatestCheckpointHandler serves the latest checkpoint model on port 8001.
func (srv *ILabServer) serveLatestCheckpointHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Info("POST /model/serve-latest called, loading the latest checkpoint")

	// Parse the JSON request body to extract the optional "checkpoint" parameter.
	var req ServeModelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		srv.log.Errorf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		srv.log.Errorf("Error getting user home directory: %v", err)
		http.Error(w, "Failed to get home directory", http.StatusInternalServerError)
		return
	}

	checkpointsDir := filepath.Join(homeDir, ".local", "share", "instructlab", "checkpoints", "hf_format")
	if _, err := os.Stat(checkpointsDir); os.IsNotExist(err) {
		srv.log.Errorf("Checkpoints directory does not exist: %s", checkpointsDir)
		http.Error(w, "Checkpoints directory does not exist", http.StatusNotFound)
		return
	}

	var modelPath string
	if req.Checkpoint != "" {
		// If a checkpoint is provided, construct the model path accordingly.
		modelPath = filepath.Join(checkpointsDir, req.Checkpoint)
		srv.log.Infof("Checkpoint provided: %s", modelPath)

		// Verify that the specified checkpoint directory exists.
		if _, err := os.Stat(modelPath); os.IsNotExist(err) {
			srv.log.Errorf("Specified checkpoint directory does not exist: %s", modelPath)
			http.Error(w, fmt.Sprintf("Checkpoint '%s' does not exist", req.Checkpoint), http.StatusBadRequest)
			return
		}
	} else {
		// If no checkpoint is provided, find the latest "samples_*" directory.
		latestDir, err := srv.findLatestDirWithPrefix(checkpointsDir, "samples_")
		if err != nil {
			srv.log.Errorf("Error finding latest checkpoint: %v", err)
			http.Error(w, "Failed to find the latest checkpoint", http.StatusInternalServerError)
			return
		}
		modelPath = latestDir
		srv.log.Infof("No checkpoint provided. Using the latest checkpoint: %s", modelPath)
	}

	if srv.useVllm {
		// Serving using VLLM with Podman
		srv.log.Infof("Serving model using vllm at %s on port 8001", modelPath)
		srv.runVllmContainerHandler(
			modelPath,
			"8001",
			"post-train",
			1,
			srv.homeDir,
			srv.homeDir,
			w,
		)
	} else {
		// Basic local serve
		srv.log.Infof("Serving model at %s on port 8001", modelPath)
		srv.serveModelHandler(modelPath, "8001", w)
	}
}

// serveBaseModelHandler serves the "base" model on port 8000.
func (srv *ILabServer) serveBaseModelHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Info("POST /model/serve-base called")

	homeDir, err := os.UserHomeDir()
	if err != nil {
		srv.log.Errorf("Error getting user home directory: %v", err)
		http.Error(w, "Failed to get home directory", http.StatusInternalServerError)
		return
	}

	if srv.useVllm {
		// Spawn container for "pre-train" model
		baseModelPath := filepath.Join(homeDir, ".cache", "instructlab", "models", "granite-8b-starter-v1")
		srv.log.Infof("Serving base model using vllm at %s on port 8000", baseModelPath)
		srv.runVllmContainerHandler(
			baseModelPath,
			"8000",
			"pre-train",
			0,
			srv.homeDir,
			srv.homeDir,
			w,
		)
	} else {
		baseModelPath := filepath.Join(homeDir, ".cache", "instructlab", "models", "granite-7b-lab-Q4_K_M.gguf")
		srv.log.Infof("Serving base model at %s on port 8000", baseModelPath)
		srv.serveModelHandler(baseModelPath, "8000", w)
	}
}

// runVllmContainerHandler spawns a container for vllm-openai with the specified parameters.
func (srv *ILabServer) runVllmContainerHandler(
	modelPath, port, servedModelName string,
	gpuIndex int, hostVolume, containerVolume string,
	w http.ResponseWriter,
) {
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

	// Log the command for debugging
	fullCmd := fmt.Sprintf("podman %s", strings.Join(cmdArgs, " "))
	srv.log.Infof("Executing Podman command: %s", fullCmd)

	// Create a unique job ID and a log file
	jobID := fmt.Sprintf("v-%d", time.Now().UnixNano())
	logFilePath := filepath.Join("logs", fmt.Sprintf("%s.log", jobID))
	srv.log.Infof("Starting vllm-openai container with job_id: %s, logs: %s", jobID, logFilePath)

	cmd := exec.Command("podman", cmdArgs...)

	// Open the log file
	logFile, err := os.Create(logFilePath)
	if err != nil {
		srv.log.Errorf("Error creating log file for vllm job %s: %v", jobID, err)
		http.Error(w, "Failed to create log file for vllm job", http.StatusInternalServerError)
		return
	}
	cmd.Stdout = logFile
	cmd.Stderr = logFile

	// Start the container
	if err := cmd.Start(); err != nil {
		srv.log.Errorf("Error starting podman container for vllm job %s: %v", jobID, err)
		logFile.Close()
		http.Error(w, "Failed to start vllm container", http.StatusInternalServerError)
		return
	}

	srv.log.Infof("Vllm container started with PID %d for job_id: %s", cmd.Process.Pid, jobID)

	// Create a Job record and store it in the DB
	newJob := &Job{
		JobID:     jobID,
		Cmd:       "podman",
		Args:      cmdArgs,
		Status:    "running",
		PID:       cmd.Process.Pid,
		LogFile:   logFilePath,
		StartTime: time.Now(),
	}
	if err := srv.createJob(newJob); err != nil {
		srv.log.Errorf("Failed to create job in DB for %s: %v", jobID, err)
		// We won't terminate here—container is already running, so just log the DB error
	}

	// Update the servedModelJobIDs Map
	srv.jobIDsMutex.Lock()
	srv.servedModelJobIDs[servedModelName] = jobID
	srv.jobIDsMutex.Unlock()
	srv.log.Infof("Mapped model '%s' to job ID '%s'", servedModelName, jobID)

	// Monitor the container in a background goroutine
	go func() {
		defer logFile.Close()

		err := cmd.Wait()
		newJob.Lock.Lock()
		defer newJob.Lock.Unlock()

		if err != nil {
			newJob.Status = "failed"
			srv.log.Errorf("Vllm job '%s' failed: %v", newJob.JobID, err)
		} else if cmd.ProcessState.Success() {
			newJob.Status = "finished"
			srv.log.Infof("Vllm job '%s' finished successfully", newJob.JobID)
		} else {
			newJob.Status = "failed"
			srv.log.Warnf("Vllm job '%s' failed (unknown reason)", newJob.JobID)
		}

		now := time.Now()
		newJob.EndTime = &now

		if errDB := srv.updateJob(newJob); errDB != nil {
			srv.log.Errorf("Failed to update DB for job '%s': %v", newJob.JobID, errDB)
		}

		// **Remove the mapping from servedModelJobIDs if job is finished or failed**
		srv.jobIDsMutex.Lock()
		delete(srv.servedModelJobIDs, servedModelName)
		srv.jobIDsMutex.Unlock()
		srv.log.Infof("Removed mapping for model '%s' from servedModelJobIDs", servedModelName)
	}()

	// Respond with the job ID
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"status": "vllm container started",
		"job_id": jobID,
	})
	srv.log.Infof("POST /model/serve-%s response sent successfully with job_id: %s", servedModelName, jobID)
}

// serveModelHandler starts serving a model on the specified port (CPU-based approach).
func (srv *ILabServer) serveModelHandler(modelPath, port string, w http.ResponseWriter) {
	srv.modelLock.Lock()
	defer srv.modelLock.Unlock()

	srv.log.Infof("serveModelHandler called with modelPath=%s, port=%s", modelPath, port)

	var targetProcess **exec.Cmd
	if port == "8000" {
		targetProcess = &srv.modelProcessBase
	} else if port == "8001" {
		targetProcess = &srv.modelProcessLatest
	} else {
		http.Error(w, "Invalid port specified", http.StatusBadRequest)
		return
	}

	if _, err := os.Stat(modelPath); os.IsNotExist(err) {
		srv.log.Errorf("Model path does not exist: %s", modelPath)
		http.Error(w, fmt.Sprintf("Model path does not exist: %s", modelPath), http.StatusNotFound)
		return
	}

	if *targetProcess != nil && (*targetProcess).Process != nil {
		srv.log.Infof("Stopping existing model process on port %s...", port)
		if err := (*targetProcess).Process.Kill(); err != nil {
			srv.log.Errorf("Failed to kill existing model process on port %s: %v", port, err)
			http.Error(w, "Failed to stop existing model process", http.StatusInternalServerError)
			return
		}
		*targetProcess = nil
	}

	cmdArgs := []string{
		"serve", "model",
		"--model", modelPath,
		"--host", "0.0.0.0",
		"--port", port,
	}
	cmdPath := srv.getIlabCommand()
	cmd := exec.Command(cmdPath, cmdArgs...)
	if !srv.rhelai {
		cmd.Dir = srv.baseDir
	}

	jobID := fmt.Sprintf("ml-%d", time.Now().UnixNano())
	logFilePath := filepath.Join("logs", fmt.Sprintf("%s.log", jobID))
	srv.log.Infof("Model serve logs: %s", logFilePath)

	logFile, err := os.Create(logFilePath)
	if err != nil {
		srv.log.Errorf("Error creating model run log file: %v", err)
		http.Error(w, "Failed to create log file", http.StatusInternalServerError)
		return
	}

	cmd.Stdout = logFile
	cmd.Stderr = logFile

	srv.log.Info("Attempting to start model process...")
	if err := cmd.Start(); err != nil {
		srv.log.Errorf("Error starting model process: %v", err)
		logFile.Close()
		http.Error(w, "Failed to start model process", http.StatusInternalServerError)
		return
	}
	*targetProcess = cmd
	srv.log.Infof("Model process started with PID %d on port %s", cmd.Process.Pid, port)

	serveJob := &Job{
		JobID:     jobID,
		Cmd:       cmdPath,
		Args:      cmdArgs,
		Status:    "running",
		PID:       cmd.Process.Pid,
		LogFile:   logFilePath,
		StartTime: time.Now(),
	}
	_ = srv.createJob(serveJob)

	go func() {
		err := cmd.Wait()
		logFile.Sync()
		logFile.Close()

		serveJob.Lock.Lock()
		defer serveJob.Lock.Unlock()

		if err != nil {
			serveJob.Status = "failed"
			srv.log.Infof("Model run job '%s' on port %s failed: %v", jobID, port, err)
		} else if cmd.ProcessState.Success() {
			serveJob.Status = "finished"
			srv.log.Infof("Model run job '%s' on port %s finished successfully", jobID, port)
		} else {
			serveJob.Status = "failed"
			srv.log.Infof("Model run job '%s' on port %s failed (unknown reason)", jobID, port)
		}
		now := time.Now()
		serveJob.EndTime = &now
		_ = srv.updateJob(serveJob)

		srv.modelLock.Lock()
		defer srv.modelLock.Unlock()
		if port == "8000" && srv.modelProcessBase == cmd {
			srv.modelProcessBase = nil
		}
		if port == "8001" && srv.modelProcessLatest == cmd {
			srv.modelProcessLatest = nil
		}
	}()

	srv.log.Infof("Model serve started successfully on port %s, returning job_id: %s", port, jobID)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "model process started", "job_id": jobID})
}

// listServedModelJobIDsHandler is a debug endpoint to list current model to jobID mappings.
func (srv *ILabServer) listServedModelJobIDsHandler(w http.ResponseWriter, r *http.Request) {
	srv.jobIDsMutex.RLock()
	defer srv.jobIDsMutex.RUnlock()
	_ = json.NewEncoder(w).Encode(srv.servedModelJobIDs)
}
