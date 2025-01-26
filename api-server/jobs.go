package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"syscall"
	"time"
)

// -----------------------------------------------------------------------------
// Database
// -----------------------------------------------------------------------------

// initDB opens (or creates) a local SQLite database file named jobs.db
// and ensures a jobs table exists.
func (srv *ILabServer) initDB() {
	var err error
	srv.db, err = sql.Open("sqlite3", "jobs.db")
	if err != nil {
		srv.log.Fatalf("Failed to open SQLite database: %v", err)
	}

	// Create the jobs table if it doesn't exist
	createTableSQL := `
    CREATE TABLE IF NOT EXISTS jobs (
        job_id TEXT PRIMARY KEY,
        cmd TEXT,
        args TEXT,
        status TEXT,
        pid INTEGER,
        log_file TEXT,
        start_time TEXT,
        end_time TEXT,
        branch TEXT,
        served_model_name TEXT
    );
    `
	_, err = srv.db.Exec(createTableSQL)
	if err != nil {
		srv.log.Fatalf("Failed to create jobs table: %v", err)
	}
}

// -----------------------------------------------------------------------------
// Jobs
// -----------------------------------------------------------------------------

// createJob inserts a new job row into the DB.
func (srv *ILabServer) createJob(job *Job) error {
	argsJSON, err := json.Marshal(job.Args)
	if err != nil {
		return fmt.Errorf("failed to marshal job Args: %v", err)
	}
	var endTimeStr *string
	if job.EndTime != nil {
		s := job.EndTime.Format(time.RFC3339)
		endTimeStr = &s
	}
	_, err = srv.db.Exec(`
        INSERT INTO jobs (job_id, cmd, args, status, pid, log_file, start_time, end_time, branch, served_model_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
		job.JobID,
		job.Cmd,
		string(argsJSON),
		job.Status,
		job.PID,
		job.LogFile,
		job.StartTime.Format(time.RFC3339),
		endTimeStr,
		job.Branch,
		job.ServedModelName,
	)
	if err != nil {
		return fmt.Errorf("failed to insert job: %v", err)
	}
	return nil
}

// getJob fetches a single job by job_id.
func (srv *ILabServer) getJob(jobID string) (*Job, error) {
	row := srv.db.QueryRow("SELECT job_id, cmd, args, status, pid, log_file, start_time, end_time, branch, served_model_name FROM jobs WHERE job_id = ?", jobID)

	var j Job
	var argsJSON string
	var startTimeStr, endTimeStr sql.NullString

	err := row.Scan(
		&j.JobID,
		&j.Cmd,
		&argsJSON,
		&j.Status,
		&j.PID,
		&j.LogFile,
		&startTimeStr,
		&endTimeStr,
		&j.Branch,
		&j.ServedModelName,
	)
	if err == sql.ErrNoRows {
		return nil, nil // not found
	} else if err != nil {
		return nil, err
	}

	if err := json.Unmarshal([]byte(argsJSON), &j.Args); err != nil {
		return nil, fmt.Errorf("failed to unmarshal job Args: %v", err)
	}
	if startTimeStr.Valid {
		t, err := time.Parse(time.RFC3339, startTimeStr.String)
		if err == nil {
			j.StartTime = t
		}
	}
	if endTimeStr.Valid && endTimeStr.String != "" {
		t, err := time.Parse(time.RFC3339, endTimeStr.String)
		if err == nil {
			j.EndTime = &t
		}
	}
	return &j, nil
}

// updateJob updates an existing job in the DB.
func (srv *ILabServer) updateJob(job *Job) error {
	argsJSON, err := json.Marshal(job.Args)
	if err != nil {
		return fmt.Errorf("failed to marshal job Args: %v", err)
	}
	var endTimeStr *string
	if job.EndTime != nil {
		s := job.EndTime.Format(time.RFC3339)
		endTimeStr = &s
	}
	_, err = srv.db.Exec(`
        UPDATE jobs
        SET cmd = ?, args = ?, status = ?, pid = ?, log_file = ?, start_time = ?, end_time = ?, branch = ?, served_model_name = ?
        WHERE job_id = ?
    `,
		job.Cmd,
		string(argsJSON),
		job.Status,
		job.PID,
		job.LogFile,
		job.StartTime.Format(time.RFC3339),
		endTimeStr,
		job.Branch,
		job.ServedModelName,
		job.JobID,
	)
	if err != nil {
		return fmt.Errorf("failed to update job %s: %v", job.JobID, err)
	}
	return nil
}

// listAllJobs returns all jobs in the DB.
func (srv *ILabServer) listAllJobs() ([]*Job, error) {
	rows, err := srv.db.Query("SELECT job_id, cmd, args, status, pid, log_file, start_time, end_time, branch FROM jobs")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []*Job
	for rows.Next() {
		var j Job
		var argsJSON string
		var startTimeStr, endTimeStr sql.NullString

		err := rows.Scan(
			&j.JobID,
			&j.Cmd,
			&argsJSON,
			&j.Status,
			&j.PID,
			&j.LogFile,
			&startTimeStr,
			&endTimeStr,
			&j.Branch,
		)
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal([]byte(argsJSON), &j.Args); err != nil {
			srv.log.Infof("Warning: failed to unmarshal job Args for job %s: %v", j.JobID, err)
		}
		if startTimeStr.Valid {
			t, err := time.Parse(time.RFC3339, startTimeStr.String)
			if err == nil {
				j.StartTime = t
			}
		}
		if endTimeStr.Valid && endTimeStr.String != "" {
			t, err := time.Parse(time.RFC3339, endTimeStr.String)
			if err == nil {
				j.EndTime = &t
			}
		}
		jobs = append(jobs, &j)
	}

	return jobs, rows.Err()
}

// -----------------------------------------------------------------------------
// Checking Running Jobs after a server restart
// -----------------------------------------------------------------------------

// checkRunningJobs checks the status of "running" jobs and marks them as failed if their processes are not running.
func (srv *ILabServer) checkRunningJobs() {
	rows, err := srv.db.Query("SELECT job_id, pid FROM jobs WHERE status = 'running'")
	if err != nil {
		srv.log.Errorf("Error querying running jobs: %v", err)
		return
	}
	defer rows.Close()

	var jobsToMarkFailed []string
	for rows.Next() {
		var jobID string
		var pid int
		if err := rows.Scan(&jobID, &pid); err != nil {
			srv.log.Infof("Error scanning row of running jobs: %v", err)
			continue
		}
		if !srv.isProcessRunning(pid) {
			srv.log.Infof("Job %s marked as failed (process not running)", jobID)
			jobsToMarkFailed = append(jobsToMarkFailed, jobID)
		}
	}

	// 3. Update jobs that are no longer running
	for _, jobID := range jobsToMarkFailed {
		endTime := time.Now()
		j, err := srv.getJob(jobID)
		if err != nil || j == nil {
			srv.log.Infof("Unable to fetch jobID=%s to mark as failed: %v", jobID, err)
			continue
		}
		j.Status = "failed"
		j.EndTime = &endTime
		if err := srv.updateJob(j); err != nil {
			srv.log.Infof("Error marking job %s as failed: %v", jobID, err)
		}
	}
}

// isProcessRunning checks if a process with the given PID is still alive.
func (srv *ILabServer) isProcessRunning(pid int) bool {
	if pid <= 0 {
		if srv.debugEnabled {
			srv.log.Debugf("[DEBUG] isProcessRunning called with invalid PID=%d", pid)
		}
		return false
	}
	process, err := os.FindProcess(pid)
	if err != nil {
		if srv.debugEnabled {
			srv.log.Debugf("[DEBUG] os.FindProcess error: %v", err)
		}
		return false
	}

	err = process.Signal(syscall.Signal(0))
	if srv.debugEnabled {
		srv.log.Debugf("[DEBUG] process.Signal(0) on PID %d => err=%v", pid, err)
	}
	return err == nil
}
