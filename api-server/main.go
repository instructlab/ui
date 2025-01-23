package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
	"github.com/spf13/cobra"
	"go.uber.org/zap"
)

// -----------------------------------------------------------------------------
// Structs
// -----------------------------------------------------------------------------

// Model represents a model record (from 'ilab model list').
type Model struct {
	Name         string `json:"name"`
	LastModified string `json:"last_modified"`
	Size         string `json:"size"`
}

// Data represents a data record (from 'ilab data list').
type Data struct {
	Dataset   string `json:"dataset"`
	CreatedAt string `json:"created_at"`
	FileSize  string `json:"file_size"`
}

// Job represents a background job, including train/generate/pipeline/vllm-run jobs.
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

	// Lock is not serialized; it protects updates to the Job in memory.
	Lock sync.Mutex `json:"-"`
}

// ModelCache encapsulates the cached models and related metadata.
type ModelCache struct {
	Models []Model
	Time   time.Time
	Mutex  sync.Mutex
}

// QnaEvalRequest is used by the /qna-eval endpoint.
type QnaEvalRequest struct {
	ModelPath string `json:"model_path"`
	YamlFile  string `json:"yaml_file"`
}

// VllmContainerResponse is returned by the /vllm-containers endpoint.
type VllmContainerResponse struct {
	Containers []VllmContainer `json:"containers"`
}

type ServeModelRequest struct {
	Checkpoint string `json:"checkpoint,omitempty"` // Optional: Name of the checkpoint directory (e.g., "samples_12345")
}

// UnloadModelRequest is used by the /vllm-unload endpoint.
type UnloadModelRequest struct {
	ModelName string `json:"model_name"` // Expected: "pre-train" or "post-train"
}

// -----------------------------------------------------------------------------
// ILabServer struct to hold configuration, DB handle, logs, etc.
// -----------------------------------------------------------------------------

type ILabServer struct {
	baseDir      string
	taxonomyPath string
	rhelai       bool
	ilabCmd      string
	isOSX        bool
	isCuda       bool
	useVllm      bool
	pipelineType string
	debugEnabled bool
	homeDir      string // New field added

	// Logger
	logger *zap.Logger
	log    *zap.SugaredLogger

	// Database handle
	db *sql.DB

	// Model processes for CPU-based or local serving (if not using VLLM)
	modelLock          sync.Mutex
	modelProcessBase   *exec.Cmd
	modelProcessLatest *exec.Cmd

	// Base model reference
	baseModel string

	// Map of "pre-train"/"post-train" => jobID for VLLM serving
	servedModelJobIDs map[string]string
	jobIDsMutex       sync.RWMutex

	// Cache variables
	modelCache ModelCache
}

// -----------------------------------------------------------------------------
// main(), flags and Cobra
// -----------------------------------------------------------------------------

func main() {
	// We create an instance of ILabServer to hold all state and methods.
	srv := &ILabServer{
		baseModel:         "instructlab/granite-7b-lab",
		servedModelJobIDs: make(map[string]string),
		modelCache:        ModelCache{},
	}

	rootCmd := &cobra.Command{
		Use:   "ilab-server",
		Short: "ILab Server Application",
		Run: func(cmd *cobra.Command, args []string) {
			// Now that flags are set, run the server method on the struct.
			srv.runServer(cmd, args)
		},
	}

	// Define flags
	rootCmd.Flags().BoolVar(&srv.rhelai, "rhelai", false, "Use ilab binary from PATH instead of Python virtual environment")
	rootCmd.Flags().StringVar(&srv.baseDir, "base-dir", "", "Base directory for ilab operations (required if --rhelai is not set)")
	rootCmd.Flags().StringVar(&srv.taxonomyPath, "taxonomy-path", "", "Path to the taxonomy repository for Git operations (required)")
	rootCmd.Flags().BoolVar(&srv.isOSX, "osx", false, "Enable OSX-specific settings (default: false)")
	rootCmd.Flags().BoolVar(&srv.isCuda, "cuda", false, "Enable Cuda (default: false)")
	rootCmd.Flags().BoolVar(&srv.useVllm, "vllm", false, "Enable VLLM model serving using podman containers")
	rootCmd.Flags().StringVar(&srv.pipelineType, "pipeline", "", "Pipeline type (simple, accelerated, full)")
	rootCmd.Flags().BoolVar(&srv.debugEnabled, "debug", false, "Enable debug logging")

	// PreRun to validate flags
	rootCmd.PreRunE = func(cmd *cobra.Command, args []string) error {
		if !srv.rhelai && srv.baseDir == "" {
			return fmt.Errorf("--base-dir is required unless --rhelai is set")
		}
		if srv.taxonomyPath == "" {
			return fmt.Errorf("--taxonomy-path is required")
		}

		// Validate or set pipelineType based on --rhelai
		if !srv.rhelai {
			if srv.pipelineType == "" {
				return fmt.Errorf("--pipeline is required unless --rhelai is set")
			}
			switch srv.pipelineType {
			case "simple", "full", "accelerated":
				// Valid
			default:
				return fmt.Errorf("--pipeline must be 'simple', 'accelerated' or 'full'; got '%s'", srv.pipelineType)
			}
		} else {
			// When --rhelai is set and --pipeline is not provided, set a default
			if srv.pipelineType == "" {
				srv.pipelineType = "accelerated"
				fmt.Println("--rhelai is set; defaulting --pipeline to 'accelerated'")
			} else {
				switch srv.pipelineType {
				case "simple", "full", "accelerated":
					// Valid
				default:
					return fmt.Errorf("--pipeline must be 'simple', 'accelerated' or 'full'; got '%s'", srv.pipelineType)
				}
			}
		}
		return nil
	}

	if err := rootCmd.Execute(); err != nil {
		fmt.Printf("Error executing command: %v\n", err)
		os.Exit(1)
	}
}

// runServer is the main entry method after flags are parsed.
func (srv *ILabServer) runServer(cmd *cobra.Command, args []string) {
	// Initialize zap logger
	srv.initLogger(srv.debugEnabled)

	// Initialize the database
	srv.initDB()

	// Determine the user's home directory / TODO: alternative approch here for expected path?
	homeDir, err := os.UserHomeDir()
	if err != nil {
		srv.log.Fatalf("Failed to get user home directory: %v", err)
	}
	srv.homeDir = homeDir
	srv.log.Infof("User home directory set to: %s", srv.homeDir)

	// Determine ilab command path
	if srv.rhelai {
		// Use ilab from PATH
		ilabPath, err := exec.LookPath("ilab")
		if err != nil {
			srv.log.Fatalf("ilab binary not found in PATH. Please ensure ilab is installed and in your PATH.")
		}
		srv.ilabCmd = ilabPath
	} else {
		// Use ilab from virtual environment
		srv.ilabCmd = filepath.Join(srv.baseDir, "venv", "bin", "ilab")
		if _, err := os.Stat(srv.ilabCmd); os.IsNotExist(err) {
			srv.log.Fatalf("ilab binary not found at %s. Please ensure the virtual environment is set up correctly.", srv.ilabCmd)
		}
	}

	srv.log.Infof("Using ilab command: %s", srv.ilabCmd)

	// Validate mandatory arguments if not using rhelai
	if !srv.rhelai {
		if _, err := os.Stat(srv.baseDir); os.IsNotExist(err) {
			srv.log.Fatalf("Base directory does not exist: %s", srv.baseDir)
		}
	}

	if _, err := os.Stat(srv.taxonomyPath); os.IsNotExist(err) {
		srv.log.Fatalf("Taxonomy path does not exist: %s", srv.taxonomyPath)
	}

	srv.log.Infof("Running with baseDir=%s, taxonomyPath=%s, isOSX=%v, isCuda=%v, useVllm=%v, pipeline=%s",
		srv.baseDir, srv.taxonomyPath, srv.isOSX, srv.isCuda, srv.useVllm, srv.pipelineType)
	srv.log.Infof("Current working directory: %s", srv.mustGetCwd())

	// Check statuses of any jobs that might have been running before a restart
	srv.checkRunningJobs()

	// Initialize the model cache
	srv.initializeModelCache()

	// Create the logs directory if it doesn't exist
	err = os.MkdirAll("logs", os.ModePerm)
	if err != nil {
		srv.log.Fatalf("Failed to create logs directory: %v", err)
	}

	// Setup HTTP routes
	r := mux.NewRouter()
	r.HandleFunc("/models", srv.getModelsHandler).Methods("GET")
	r.HandleFunc("/data", srv.getDataHandler).Methods("GET")
	r.HandleFunc("/data/generate", srv.generateDataHandler).Methods("POST")
	r.HandleFunc("/model/train", srv.trainModelHandler).Methods("POST")
	r.HandleFunc("/jobs/{job_id}/status", srv.getJobStatusHandler).Methods("GET")
	r.HandleFunc("/jobs/{job_id}/logs", srv.getJobLogsHandler).Methods("GET")
	r.HandleFunc("/jobs", srv.listJobsHandler).Methods("GET")
	r.HandleFunc("/pipeline/generate-train", srv.generateTrainPipelineHandler).Methods("POST")
	r.HandleFunc("/model/serve-latest", srv.serveLatestCheckpointHandler).Methods("POST")
	r.HandleFunc("/model/serve-base", srv.serveBaseModelHandler).Methods("POST")
	r.HandleFunc("/qna-eval", srv.runQnaEval).Methods("POST")
	r.HandleFunc("/checkpoints", srv.listCheckpointsHandler).Methods("GET")
	r.HandleFunc("/vllm-containers", srv.listVllmContainersHandler).Methods("GET")
	r.HandleFunc("/vllm-unload", srv.unloadVllmContainerHandler).Methods("POST")
	r.HandleFunc("/vllm-status", srv.getVllmStatusHandler).Methods("GET")
	r.HandleFunc("/gpu-free", srv.getGpuFreeHandler).Methods("GET")
	r.HandleFunc("/served-model-jobids", srv.listServedModelJobIDsHandler).Methods("GET")

	srv.log.Info("Server starting on port 8080... (Taxonomy path: ", srv.taxonomyPath, ")")
	if err := http.ListenAndServe("0.0.0.0:8080", r); err != nil {
		srv.log.Fatalf("Server failed to start: %v", err)
	}
}

// -----------------------------------------------------------------------------
// Utility
// -----------------------------------------------------------------------------

// getIlabCommand returns the path to the ilab command, depending on rhelai or local venv.
func (srv *ILabServer) getIlabCommand() string {
	return srv.ilabCmd
}

// mustGetCwd returns the current working directory or "unknown" if it fails.
func (srv *ILabServer) mustGetCwd() string {
	cwd, err := os.Getwd()
	if err != nil {
		return "unknown"
	}
	return cwd
}

// sanitizeModelName checks if the modelName starts with "model/" and replaces it with "models/".
func (srv *ILabServer) sanitizeModelName(modelName string) string {
	if strings.HasPrefix(modelName, "model/") {
		return strings.Replace(modelName, "model/", "models/", 1)
	}
	return modelName
}

// -----------------------------------------------------------------------------
// Model Cache
// -----------------------------------------------------------------------------

// initializeModelCache refreshes the model cache once and then schedules a refresh every 20 minutes.
func (srv *ILabServer) initializeModelCache() {
	srv.refreshModelCache()
	go func() {
		for {
			time.Sleep(20 * time.Minute)
			srv.refreshModelCache()
		}
	}()
}

// refreshModelCache updates the model cache if it's older than 20 minutes or if empty.
// TODO: this is really slow due to a caching issue upstream/downstream, should probably be async
func (srv *ILabServer) refreshModelCache() {
	srv.modelCache.Mutex.Lock()
	defer srv.modelCache.Mutex.Unlock()

	if time.Since(srv.modelCache.Time) < 20*time.Minute && len(srv.modelCache.Models) > 0 {
		srv.log.Info("Model cache is still valid; no refresh needed.")
		return
	}

	srv.log.Info("Refreshing model cache... Takes 10-20s")
	output, err := srv.runIlabCommand("model", "list")
	if err != nil {
		srv.log.Errorf("Error refreshing model cache: %v", err)
		return
	}
	models, err := srv.parseModelList(output)
	if err != nil {
		srv.log.Errorf("Error parsing model list during cache refresh: %v", err)
		return
	}
	srv.modelCache.Models = models
	srv.modelCache.Time = time.Now()
	srv.log.Infof("Model cache refreshed at %v with %d models.", srv.modelCache.Time, len(models))
}

// -----------------------------------------------------------------------------
// Start Generate Data Job
// -----------------------------------------------------------------------------

// startGenerateJob launches a job to run "ilab data generate" and tracks it.
func (srv *ILabServer) startGenerateJob() (string, error) {
	ilabPath := srv.getIlabCommand()

	// Hard-coded pipeline choice for data generate, or we could use srv.pipelineType
	cmdArgs := []string{"data", "generate", "--pipeline", "full"}

	cmd := exec.Command(ilabPath, cmdArgs...)
	if !srv.rhelai {
		cmd.Dir = srv.baseDir
	}

	jobID := fmt.Sprintf("g-%d", time.Now().UnixNano())
	logFilePath := filepath.Join("logs", fmt.Sprintf("%s.log", jobID))
	srv.log.Infof("Starting generateDataHandler job: %s, logs: %s", jobID, logFilePath)

	logFile, err := os.Create(logFilePath)
	if err != nil {
		srv.log.Errorf("Error creating log file: %v", err)
		return "", fmt.Errorf("Failed to create log file")
	}
	cmd.Stdout = logFile
	cmd.Stderr = logFile

	srv.log.Infof("Running command: %s %v", ilabPath, cmdArgs)
	if err := cmd.Start(); err != nil {
		srv.log.Errorf("Error starting data generation command: %v", err)
		logFile.Close()
		return "", err
	}

	newJob := &Job{
		JobID:     jobID,
		Cmd:       ilabPath,
		Args:      cmdArgs,
		Status:    "running",
		PID:       cmd.Process.Pid,
		LogFile:   logFilePath,
		StartTime: time.Now(),
	}
	if err := srv.createJob(newJob); err != nil {
		srv.log.Errorf("Error creating job in DB: %v", err)
		return "", err
	}

	go func() {
		defer logFile.Close()
		err := cmd.Wait()

		newJob.Lock.Lock()
		defer newJob.Lock.Unlock()

		if err != nil {
			newJob.Status = "failed"
			srv.log.Infof("Job %s failed with error: %v", newJob.JobID, err)
		} else {
			if cmd.ProcessState.Success() {
				newJob.Status = "finished"
				srv.log.Infof("Job %s finished successfully", newJob.JobID)
			} else {
				newJob.Status = "failed"
				srv.log.Infof("Job %s failed", newJob.JobID)
			}
		}
		now := time.Now()
		newJob.EndTime = &now
		_ = srv.updateJob(newJob)
	}()

	return jobID, nil
}

// -----------------------------------------------------------------------------
// Start Train Job
// -----------------------------------------------------------------------------

// startTrainJob starts a training job with the given parameters.
func (srv *ILabServer) startTrainJob(modelName, branchName string, epochs *int) (string, error) {
	srv.log.Infof("Starting training job for model: '%s', branch: '%s'", modelName, branchName)

	jobID := fmt.Sprintf("t-%d", time.Now().UnixNano())
	logFilePath := filepath.Join("logs", fmt.Sprintf("%s.log", jobID))

	fullModelPath, err := srv.getFullModelPath(modelName)
	if err != nil {
		return "", fmt.Errorf("failed to get full model path: %v", err)
	}
	srv.log.Infof("Resolved fullModelPath: '%s'", fullModelPath)

	modelDir := filepath.Dir(fullModelPath)
	if err := os.MkdirAll(modelDir, os.ModePerm); err != nil {
		return "", fmt.Errorf("failed to create model directory '%s': %v", modelDir, err)
	}

	ilabPath := srv.getIlabCommand()

	var cmdArgs []string
	cmdArgs = append(cmdArgs, "model", "train")

	// If not rhelai, add pipeline if set
	if !srv.rhelai && srv.pipelineType != "" {
		cmdArgs = append(cmdArgs, "--pipeline", srv.pipelineType)
	}
	cmdArgs = append(cmdArgs, fmt.Sprintf("--model-path=%s", fullModelPath))

	if srv.isOSX {
		cmdArgs = append(cmdArgs, "--device=mps")
	}
	if srv.isCuda {
		cmdArgs = append(cmdArgs, "--device=cuda")
	}
	if epochs != nil {
		cmdArgs = append(cmdArgs, fmt.Sprintf("--num-epochs=%d", *epochs))
		srv.log.Infof("Number of epochs specified: %d", *epochs)
	} else {
		srv.log.Info("No epochs specified; using default number of epochs.")
	}

	// Additional logic if pipelineType == "simple" (and not rhelai)
	if srv.pipelineType == "simple" && !srv.rhelai {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", fmt.Errorf("failed to get user home directory: %v", err)
		}
		datasetDir := filepath.Join(homeDir, ".local", "share", "instructlab", "datasets")

		// Copy the latest knowledge_train_msgs_*.jsonl => train_gen.jsonl
		latestTrainFile, err := srv.findLatestFileWithPrefix(datasetDir, "knowledge_train_msgs_")
		if err != nil {
			return "", fmt.Errorf("failed to find knowledge_train_msgs_*.jsonl file: %v", err)
		}
		trainGenPath := filepath.Join(datasetDir, "train_gen.jsonl")
		if err := srv.overwriteCopy(latestTrainFile, trainGenPath); err != nil {
			return "", fmt.Errorf("failed to copy %s to %s: %v", latestTrainFile, trainGenPath, err)
		}

		// Copy the latest test_ggml-model-*.jsonl => test_gen.jsonl
		latestTestFile, err := srv.findLatestFileWithPrefix(datasetDir, "test_ggml-model")
		if err != nil {
			return "", fmt.Errorf("failed to find test_ggml-model*.jsonl file: %v", err)
		}
		testGenPath := filepath.Join(datasetDir, "test_gen.jsonl")
		if err := srv.overwriteCopy(latestTestFile, testGenPath); err != nil {
			return "", fmt.Errorf("failed to copy %s to %s: %v", latestTestFile, testGenPath, err)
		}

		// Reset cmdArgs to a simpler set
		cmdArgs = []string{
			"model", "train",
			"--pipeline", srv.pipelineType,
			fmt.Sprintf("--data-path=%s", datasetDir),
			fmt.Sprintf("--model-path=%s", fullModelPath),
		}
		if srv.isOSX {
			cmdArgs = append(cmdArgs, "--device=mps")
		}
		if srv.isCuda {
			cmdArgs = append(cmdArgs, "--device=cuda")
		}
		if epochs != nil {
			cmdArgs = append(cmdArgs, fmt.Sprintf("--num-epochs=%d", *epochs))
			srv.log.Infof("Number of epochs specified for simple pipeline: %d", *epochs)
		} else {
			srv.log.Info("No epochs specified for simple pipeline; using default number of epochs.")
		}
	}

	if srv.rhelai {
		latestDataset, err := srv.getLatestDatasetFile()
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
			"--pipeline", srv.pipelineType,
		}
		if epochs != nil {
			cmdArgs = append(cmdArgs, fmt.Sprintf("--num-epochs=%d", *epochs))
			srv.log.Infof("Number of epochs specified for rhelai pipeline: %d", *epochs)
		} else {
			srv.log.Info("No epochs specified for rhelai pipeline; using default number of epochs.")
		}
	}

	srv.log.Infof("[ILAB TRAIN COMMAND] %s %v", ilabPath, cmdArgs)

	cmd := exec.Command(ilabPath, cmdArgs...)
	if !srv.rhelai {
		cmd.Dir = srv.baseDir
	}

	logFile, err := os.Create(logFilePath)
	if err != nil {
		return "", fmt.Errorf("failed to create log file '%s': %v", logFilePath, err)
	}
	defer logFile.Close()

	cmd.Stdout = logFile
	cmd.Stderr = logFile

	srv.log.Infof("[ILAB TRAIN COMMAND] %s %v", ilabPath, cmdArgs)
	if err := cmd.Start(); err != nil {
		return "", fmt.Errorf("error starting training command: %v", err)
	}
	srv.log.Infof("Training process started with PID: %d", cmd.Process.Pid)

	newJob := &Job{
		JobID:     jobID,
		Cmd:       ilabPath,
		Args:      cmdArgs,
		Status:    "running",
		PID:       cmd.Process.Pid,
		LogFile:   logFilePath,
		Branch:    branchName,
		StartTime: time.Now(),
	}
	if err := srv.createJob(newJob); err != nil {
		return "", fmt.Errorf("failed to create job in DB: %v", err)
	}

	go func() {
		defer logFile.Close()
		err := cmd.Wait()

		newJob.Lock.Lock()
		defer newJob.Lock.Unlock()

		if err != nil {
			newJob.Status = "failed"
			srv.log.Infof("Training job '%s' failed: %v", newJob.JobID, err)
		} else if cmd.ProcessState.Success() {
			newJob.Status = "finished"
			srv.log.Infof("Training job '%s' finished successfully", newJob.JobID)
		} else {
			newJob.Status = "failed"
			srv.log.Infof("Training job '%s' failed (unknown reason)", newJob.JobID)
		}
		now := time.Now()
		newJob.EndTime = &now
		_ = srv.updateJob(newJob)
	}()

	return jobID, nil
}

// -----------------------------------------------------------------------------
// Pipeline
// -----------------------------------------------------------------------------

func (srv *ILabServer) generateTrainPipelineHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Info("POST /pipeline/generate-train called")

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

	sanitizedModelName := srv.sanitizeModelName(reqBody.ModelName)
	srv.log.Infof("Sanitized modelName for pipeline: '%s'", sanitizedModelName)

	pipelineJobID := fmt.Sprintf("p-%d", time.Now().UnixNano())
	srv.log.Infof("Starting pipeline job with ID: %s", pipelineJobID)

	pipelineJob := &Job{
		JobID:     pipelineJobID,
		Cmd:       "pipeline-generate-train",
		Args:      []string{sanitizedModelName, reqBody.BranchName},
		Status:    "running",
		PID:       0, // no direct OS process
		LogFile:   fmt.Sprintf("logs/%s.log", pipelineJobID),
		Branch:    reqBody.BranchName,
		StartTime: time.Now(),
	}
	if err := srv.createJob(pipelineJob); err != nil {
		srv.log.Errorf("Error creating pipeline job: %v", err)
		http.Error(w, "Failed to create pipeline job", http.StatusInternalServerError)
		return
	}

	go srv.runPipelineJob(pipelineJob, sanitizedModelName, reqBody.BranchName, reqBody.Epochs)

	response := map[string]string{"pipeline_job_id": pipelineJobID}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
	srv.log.Infof("POST /pipeline/generate-train => pipeline_job_id=%s", pipelineJobID)
}

// runPipelineJob orchestrates data generate + model train steps in sequence.
func (srv *ILabServer) runPipelineJob(job *Job, modelName, branchName string, epochs *int) {
	// Open the pipeline job log
	logFile, err := os.Create(job.LogFile)
	if err != nil {
		srv.log.Errorf("Error creating pipeline log file for job %s: %v", job.JobID, err)
		job.Status = "failed"
		_ = srv.updateJob(job)
		return
	}
	defer logFile.Close()

	stdLogger := zap.NewStdLog(srv.logger)

	// Redirect that standard logger's output to our log file
	stdLogger.SetOutput(logFile)

	stdLogger.Printf("Starting pipeline job: %s, model: %s, branch: %s, epochs: %v",
		job.JobID, modelName, branchName, epochs)

	// 1) Git checkout
	gitCheckoutCmd := exec.Command("git", "checkout", branchName)
	gitCheckoutCmd.Dir = srv.taxonomyPath
	gitOutput, gitErr := gitCheckoutCmd.CombinedOutput()
	stdLogger.Printf("Git checkout output: %s", string(gitOutput))
	if gitErr != nil {
		stdLogger.Printf("Failed to checkout branch '%s': %v", branchName, gitErr)
		job.Status = "failed"
		_ = srv.updateJob(job)
		return
	}

	// 2) Generate data step
	stdLogger.Println("Starting data generation step...")
	genJobID, genErr := srv.startGenerateJob()
	if genErr != nil {
		stdLogger.Printf("Data generation step failed: %v", genErr)
		job.Status = "failed"
		_ = srv.updateJob(job)
		return
	}
	stdLogger.Printf("Data generation step started with job_id=%s", genJobID)

	for {
		time.Sleep(5 * time.Second)
		genJob, err := srv.getJob(genJobID)
		if err != nil || genJob == nil {
			stdLogger.Printf("Data generation job %s not found or error: %v", genJobID, err)
			job.Status = "failed"
			_ = srv.updateJob(job)
			return
		}
		if genJob.Status == "failed" {
			stdLogger.Println("Data generation step failed.")
			job.Status = "failed"
			_ = srv.updateJob(job)
			return
		}
		if genJob.Status == "finished" {
			stdLogger.Println("Data generation step completed successfully.")
			break
		}
	}

	// 3) Train step
	stdLogger.Println("Starting training step...")
	trainJobID, trainErr := srv.startTrainJob(modelName, branchName, epochs)
	if trainErr != nil {
		stdLogger.Printf("Training step failed to start: %v", trainErr)
		job.Status = "failed"
		_ = srv.updateJob(job)
		return
	}
	stdLogger.Printf("Training step started with job_id=%s", trainJobID)

	for {
		time.Sleep(5 * time.Second)
		tJob, err := srv.getJob(trainJobID)
		if err != nil || tJob == nil {
			stdLogger.Printf("Training job %s not found or error: %v", trainJobID, err)
			job.Status = "failed"
			_ = srv.updateJob(job)
			return
		}
		if tJob.Status == "failed" {
			stdLogger.Println("Training step failed.")
			job.Status = "failed"
			_ = srv.updateJob(job)
			return
		}
		if tJob.Status == "finished" {
			stdLogger.Println("Training step completed successfully.")
			break
		}
	}

	job.Status = "finished"
	_ = srv.updateJob(job)
	stdLogger.Println("Pipeline job completed successfully.")
}

// findLatestFileWithPrefix returns the newest file in dir that starts with prefix.
func (srv *ILabServer) findLatestFileWithPrefix(dir, prefix string) (string, error) {
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		return "", fmt.Errorf("failed to read directory '%s': %v", dir, err)
	}
	var latest os.FileInfo
	for _, f := range files {
		if f.IsDir() {
			continue
		}
		if strings.HasPrefix(f.Name(), prefix) && strings.HasSuffix(f.Name(), ".jsonl") {
			if latest == nil || f.ModTime().After(latest.ModTime()) {
				latest = f
			}
		}
	}
	if latest == nil {
		return "", fmt.Errorf("no file found in %s with prefix '%s'", dir, prefix)
	}
	return filepath.Join(dir, latest.Name()), nil
}

// overwriteCopy copies src to dst (overwrites if dst exists).
func (srv *ILabServer) overwriteCopy(src, dst string) error {
	input, err := ioutil.ReadFile(src)
	if err != nil {
		return err
	}
	if err := ioutil.WriteFile(dst, input, 0644); err != nil {
		return err
	}
	return nil
}

// getFullModelPath returns the directory or file path for a given model name.
func (srv *ILabServer) getFullModelPath(modelName string) (string, error) {
	// If the user passed something like "models/instructlab/my-model" we keep it
	// but place it in ~/.cache/instructlab/models/...
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("cannot find home directory: %v", err)
	}
	base := filepath.Join(home, ".cache", "instructlab")
	return filepath.Join(base, modelName), nil
}

// runIlabCommand executes the ilab command with the provided arguments and returns combined output.
func (srv *ILabServer) runIlabCommand(args ...string) (string, error) {
	cmdPath := srv.getIlabCommand()
	cmd := exec.Command(cmdPath, args...)
	if !srv.rhelai {
		cmd.Dir = srv.baseDir
	}
	out, err := cmd.CombinedOutput()
	return string(out), err
}

// parseModelList parses the output of the "ilab model list" command into a slice of Model.
func (srv *ILabServer) parseModelList(output string) ([]Model, error) {
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

// parseDataList parses the output of the "ilab data list" command into a slice of Data.
func (srv *ILabServer) parseDataList(output string) ([]Data, error) {
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
