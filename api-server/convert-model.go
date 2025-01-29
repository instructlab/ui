package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

// convertModelHandler is the HTTP handler for the /model/convert endpoint.
// This endpoint is valid only on OSX machines (srv.isOSX == true).
func (srv *ILabServer) convertModelHandler(w http.ResponseWriter, r *http.Request) {
	srv.log.Info("POST /model/convert called")

	// If not OS X, return an error.
	if !srv.isOSX {
		srv.log.Warn("Attempt to use /model/convert on a non-OSX machine")
		http.Error(w, "Model conversion endpoint is available only on OSX", http.StatusForbidden)
		return
	}

	var reqBody struct {
		ModelDir string `json:"model_dir"`
	}
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		srv.log.Errorf("Error parsing convert request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Ensure we have a model directory path
	if reqBody.ModelDir == "" {
		srv.log.Info("Missing required parameter: model_dir")
		http.Error(w, "Missing required parameter: model_dir", http.StatusBadRequest)
		return
	}

	jobID, err := srv.startConvertJob(reqBody.ModelDir)
	if err != nil {
		srv.log.Errorf("Error starting convert job: %v", err)
		http.Error(w, fmt.Sprintf("Failed to start convert job: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"job_id": jobID})
	srv.log.Infof("POST /model/convert started successfully, job_id: %s", jobID)
}

// startConvertJob launches "ilab model convert --model-dir=..."
func (srv *ILabServer) startConvertJob(modelDir string) (string, error) {
	ilabPath := srv.getIlabCommand()

	cmdArgs := []string{
		"model", "convert",
		fmt.Sprintf("--model-dir=%s", modelDir),
	}

	// Unique job ID & log file
	jobID := fmt.Sprintf("c-%d", time.Now().UnixNano())
	logFilePath := filepath.Join("logs", fmt.Sprintf("%s.log", jobID))

	finalCmdString := fmt.Sprintf("[ILAB CONVERT COMMAND] %s %v", ilabPath, cmdArgs)
	srv.log.Info(finalCmdString)

	cmd := exec.Command(ilabPath, cmdArgs...)
	if !srv.rhelai {
		cmd.Dir = srv.baseDir
	}

	// Log the job
	logFile, err := os.Create(logFilePath)
	if err != nil {
		return "", fmt.Errorf("failed to create log file for convert job: %v", err)
	}
	fmt.Fprintln(logFile, finalCmdString)

	cmd.Stdout = logFile
	cmd.Stderr = logFile

	srv.log.Infof("Starting ilab convert process with job ID '%s'", jobID)
	if err := cmd.Start(); err != nil {
		logFile.Close()
		srv.log.Errorf("Error starting convert command: %v", err)
		return "", err
	}

	// Create DB record for the job
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
		srv.log.Errorf("Error creating convert job in DB: %v", err)
	}

	go func() {
		defer logFile.Close()
		err := cmd.Wait()

		newJob.Lock.Lock()
		defer newJob.Lock.Unlock()

		if err != nil {
			newJob.Status = "failed"
			srv.log.Infof("Convert job %s failed: %v", newJob.JobID, err)
		} else if cmd.ProcessState.Success() {
			newJob.Status = "finished"
			srv.log.Infof("Convert job %s finished successfully", newJob.JobID)
		} else {
			newJob.Status = "failed"
			srv.log.Infof("Convert job %s failed (unknown reason)", newJob.JobID)
		}
		now := time.Now()
		newJob.EndTime = &now
		_ = srv.updateJob(newJob)
	}()

	return jobID, nil
}
