// mock_mode.go
package main

import (
	"fmt"
	"os"
	"time"
)

// simulateJob simulates a job of the given type (e.g., "generate" or "train").
// It creates a job record with a unique job ID, writes a log file, and schedules
// a goroutine that waits 30s before marking the job as finished.
func (srv *ILabServer) simulateJob(jobType string) (string, error) {
	// Generate a unique job ID
	jobID := fmt.Sprintf("mock-%s-%d", jobType, time.Now().UnixNano())
	logFilePath := fmt.Sprintf("logs/%s.log", jobID)

	// Create and write an initial log file
	f, err := os.Create(logFilePath)
	if err != nil {
		srv.log.Errorf("Mock: failed to create log file: %v", err)
		return "", err
	}
	_, _ = f.WriteString(fmt.Sprintf("Mock %s job started...\n", jobType))
	f.Close()

	// Create a new job record
	newJob := &Job{
		JobID:     jobID,
		Cmd:       fmt.Sprintf("mock-%s", jobType),
		Args:      []string{},
		Status:    "running",
		PID:       0,
		LogFile:   logFilePath,
		StartTime: time.Now(),
	}
	if err := srv.createJob(newJob); err != nil {
		srv.log.Errorf("Mock: failed to create job record: %v", err)
		return "", err
	}

	// Simulate the job: after (n) seconds, mark it as finished.
	go func(j *Job) {
		srv.log.Infof("Mock job %s running (simulated 30s delay)...", j.JobID)
		time.Sleep(30 * time.Second)
		j.Lock.Lock()
		defer j.Lock.Unlock()
		j.Status = "finished"
		now := time.Now()
		j.EndTime = &now
		if err := srv.updateJob(j); err != nil {
			srv.log.Errorf("Mock: failed to update job %s: %v", j.JobID, err)
		}
		srv.log.Infof("Mock job %s finished successfully", j.JobID)
	}(newJob)

	return jobID, nil
}
