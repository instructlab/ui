// podman.go

package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os/exec"
	"strings"
)

// VllmContainer are details of a vllm container.
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

// ListVllmContainers retrieves all running vllm containers and extracts the --served-model-name and --model values.
func ListVllmContainers() ([]VllmContainer, error) {

	format := "{{.ID}}|{{.Image}}|{{.Command}}|{{.CreatedAt}}|{{.Status}}|{{.Ports}}|{{.Names}}"

	// Execute 'podman ps' with the specified format
	cmd := exec.Command("podman", "ps", "--filter", "ancestor=vllm/vllm-openai:latest", "--format", format)
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("error running podman ps: %v, stderr: %s", err, stderr.String())
	}

	lines := strings.Split(strings.TrimSpace(out.String()), "\n")
	var containers []VllmContainer

	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			continue // Skip empty lines
		}

		// Split the line into parts based on the delimiter '|'
		parts := strings.Split(line, "|")
		if len(parts) != 7 {
			log.Printf("Skipping malformed podman ps line: %s", line)
			continue
		}

		containerID := strings.TrimSpace(parts[0])
		image := strings.TrimSpace(parts[1])
		command := strings.TrimSpace(parts[2])
		createdAt := strings.TrimSpace(parts[3])
		status := strings.TrimSpace(parts[4])
		ports := strings.TrimSpace(parts[5])
		names := strings.TrimSpace(parts[6])

		// Inspect the container to get the full command and extract args
		servedModelName, modelPath, err := ExtractVllmArgs(containerID)
		if err != nil {
			log.Printf("Error extracting vllm args for container %s: %v", containerID, err)
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
func ExtractVllmArgs(containerID string) (string, string, error) {
	// Execute 'podman inspect' with a JSON format to get the full command
	inspectCmd := exec.Command("podman", "inspect", "--format", "{{json .Config.Cmd}}", containerID)
	var inspectOut bytes.Buffer
	var inspectErr bytes.Buffer
	inspectCmd.Stdout = &inspectOut
	inspectCmd.Stderr = &inspectErr

	err := inspectCmd.Run()
	if err != nil {
		return "", "", fmt.Errorf("error inspecting container %s: %v, stderr: %s", containerID, err, inspectErr.String())
	}

	// The command is a JSON array, e.g., ["--host", "0.0.0.0", "--port", "8000", "--model", "/path/to/model", "--served-model-name", "pre-train"]
	var cmdArgs []string
	if err := json.Unmarshal(inspectOut.Bytes(), &cmdArgs); err != nil {
		return "", "", fmt.Errorf("error unmarshalling command args for container %s: %v", containerID, err)
	}

	servedModelName, modelPath, err := parseVllmArgs(cmdArgs)
	if err != nil {
		return "", "", fmt.Errorf("error parsing vllm args for container %s: %v", containerID, err)
	}

	return servedModelName, modelPath, nil
}

// parseVllmArgs parses the command-line arguments to extract --served-model-name and --model values.
func parseVllmArgs(args []string) (string, string, error) {
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

	if servedModelName == "" || modelPath == "" {
		return "", "", errors.New("required arguments --served-model-name or --model not found")
	}

	return servedModelName, modelPath, nil
}

// StopVllmContainer stops a running vllm container based on the served model name.
func StopVllmContainer(servedModelName string) error {
	containers, err := ListVllmContainers()
	if err != nil {
		return fmt.Errorf("failed to list vllm containers: %v", err)
	}

	var targetContainer *VllmContainer
	for _, container := range containers {
		if container.ServedModelName == servedModelName {
			targetContainer = &container
			break
		}
	}

	if targetContainer == nil {
		return fmt.Errorf("no vllm container found with served-model-name '%s'", servedModelName)
	}

	// Execute 'podman stop <container_id>'
	stopCmd := exec.Command("podman", "stop", targetContainer.ContainerID)
	var stopOut bytes.Buffer
	var stopErr bytes.Buffer
	stopCmd.Stdout = &stopOut
	stopCmd.Stderr = &stopErr

	err = stopCmd.Run()
	if err != nil {
		return fmt.Errorf("error stopping container %s: %v, stderr: %s", targetContainer.ContainerID, err, stopErr.String())
	}

	log.Printf("Successfully stopped vllm container '%s' with served-model-name '%s'", targetContainer.ContainerID, servedModelName)
	return nil
}
