package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os/exec"
	"strings"
)

// VllmContainer details of a vllm container.
type VllmContainer struct {
	ContainerID     string `json:"container_id"`
	Image           string `json:"image"`
	Command         string `json:"command"`
	CreatedAt       string `json:"created_at"`
	Status          string `json:"status"`
	Ports           string `json:"ports"`
	Names           string `json:"names"`
	ServedModelName string `json:"served_model_name"`
	ModelPath       string `json:"model_path"`
}

// ListVllmContainers retrieves all running vllm containers and extracts the
// --served-model-name and --model values.
func (srv *ILabServer) ListVllmContainers() ([]VllmContainer, error) {
	// Define a custom format with a pipe delimiter to avoid splitting on spaces.
	format := "{{.ID}}|{{.Image}}|{{.Command}}|{{.CreatedAt}}|{{.Status}}|{{.Ports}}|{{.Names}}"

	cmd := exec.Command("podman", "ps",
		"--filter", "ancestor=registry.redhat.io/rhelai1/instructlab-nvidia-rhel9:1.4-1738905416",
		"--format", format,
	)

	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("error running podman ps: %v, stderr: %s", err, stderr.String())
	}

	lines := strings.Split(strings.TrimSpace(out.String()), "\n")
	var containers []VllmContainer

	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			continue
		}
		parts := strings.Split(line, "|")
		if len(parts) != 7 {
			srv.log.Warnf("Skipping malformed podman ps line: %s", line)
			continue
		}

		containerID := strings.TrimSpace(parts[0])
		image := strings.TrimSpace(parts[1])
		command := strings.TrimSpace(parts[2])
		createdAt := strings.TrimSpace(parts[3])
		status := strings.TrimSpace(parts[4])
		ports := strings.TrimSpace(parts[5])
		names := strings.TrimSpace(parts[6])

		// Inspect the container to get the full command & extract args
		servedModelName, modelPath, err := srv.ExtractVllmArgs(containerID)
		if err != nil {
			srv.log.Warnf("Error extracting vllm args for container %s: %v", containerID, err)
			continue
		}

		container := VllmContainer{
			ContainerID:     containerID,
			Image:           image,
			Command:         command,
			CreatedAt:       createdAt,
			Status:          status,
			Ports:           ports,
			Names:           names,
			ServedModelName: servedModelName,
			ModelPath:       modelPath,
		}
		containers = append(containers, container)
	}

	return containers, nil
}

// ExtractVllmArgs inspects a container and extracts --served-model-name and --model values.
func (srv *ILabServer) ExtractVllmArgs(containerID string) (string, string, error) {
	inspectCmd := exec.Command("podman", "inspect",
		"--format", "{{json .Config.Cmd}}",
		containerID,
	)

	var inspectOut, inspectErr bytes.Buffer
	inspectCmd.Stdout = &inspectOut
	inspectCmd.Stderr = &inspectErr

	if err := inspectCmd.Run(); err != nil {
		return "", "", fmt.Errorf("error inspecting container %s: %v, stderr: %s",
			containerID, err, inspectErr.String())
	}

	// The command is a JSON array, e.g.:
	// ["serve","/var/home/cloud-user/.cache/instructlab/models/granite-8b-starter-v1","--served-model-name","pre-train","--load-format","safetensors","--host","127.0.0.1","--port","8000"]
	var cmdArgs []string
	if err := json.Unmarshal(inspectOut.Bytes(), &cmdArgs); err != nil {
		return "", "", fmt.Errorf("error unmarshalling command args for container %s: %v",
			containerID, err)
	}

	servedModelName, modelPath, err := srv.parseVllmArgs(cmdArgs)
	if err != nil {
		return "", "", fmt.Errorf("error parsing vllm args for container %s: %v", containerID, err)
	}
	return servedModelName, modelPath, nil
}

// parseVllmArgs parses the command-line arguments to extract --served-model-name and --model values.
func (srv *ILabServer) parseVllmArgs(args []string) (string, string, error) {
	var servedModelName, modelPath string

	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "--served-model-name":
			if i+1 < len(args) {
				servedModelName = args[i+1]
				i++
			} else {
				return "", "", errors.New("missing value for --served-model-name")
			}
		case "--model":
			if i+1 < len(args) {
				modelPath = args[i+1]
				i++
			} else {
				return "", "", errors.New("missing value for --model")
			}
		}
	}

	// If modelPath wasn't set via the flag, check for a positional model path.
	// If the command starts with "serve" and a second argument exists, use that as the model path.
	if modelPath == "" && len(args) > 1 && args[0] == "serve" {
		modelPath = args[1]
	}

	if servedModelName == "" || modelPath == "" {
		return "", "", errors.New("required arguments --served-model-name or --model not found")
	}
	return servedModelName, modelPath, nil
}

// StopVllmContainer stops a running vllm container based on the served model name.
func (srv *ILabServer) StopVllmContainer(servedModelName string) error {
	containers, err := srv.ListVllmContainers()
	if err != nil {
		return fmt.Errorf("failed to list vllm containers: %v", err)
	}

	var targetContainer *VllmContainer
	for _, c := range containers {
		if c.ServedModelName == servedModelName {
			targetContainer = &c
			break
		}
	}
	if targetContainer == nil {
		return fmt.Errorf("no vllm container found with served-model-name '%s'", servedModelName)
	}

	stopCmd := exec.Command("podman", "stop", targetContainer.ContainerID)
	var stopOut, stopErr bytes.Buffer
	stopCmd.Stdout = &stopOut
	stopCmd.Stderr = &stopErr

	if err := stopCmd.Run(); err != nil {
		return fmt.Errorf("error stopping container %s: %v, stderr: %s",
			targetContainer.ContainerID, err, stopErr.String())
	}

	srv.log.Infof("Successfully stopped vllm container '%s' with served-model-name '%s'",
		targetContainer.ContainerID, servedModelName)
	return nil
}
