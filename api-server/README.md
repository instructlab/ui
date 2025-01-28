# Ilab API Server

## Overview

This is an Ilab API Server that is a temporary set of APIs for service developing apps against [InstructLab](https://github.com/instructlab/). It provides endpoints for model management, data generation, training, job tracking and job logging.

## Quickstart

### Prerequisites

- Ensure that the required directories (`base-dir` and `taxonomy-path`) exist and are accessible and Go is installed in the $PATH.

### Install Dependencies

To install the necessary dependencies, run:

```bash
# gcc in $PATH required for sqlite
go mod download
```

### Run the Server

### Build

```bash
go build -o ilab-api-server
```

#### For macOS with Metal (MPS)

```bash
./ilab-api-server --base-dir /path/to/base-dir --taxonomy-path /path/to/taxonomy --osx  --pipeline simple
# Or the full pipeline
./ilab-api-server --base-dir /path/to/base-dir --taxonomy-path /path/to/taxonomy --osx  --pipeline full
```

#### For CUDA-enabled environments

Since the device type is cuda, only the accelerated pipeline option is available and set as the default.

```bash
./ilab-api-server --base-dir /path/to/base-dir --taxonomy-path /path/to/taxonomy --cuda
```

#### For a RHEL AI machine

- If you're operating on a Red Hat Enterprise Linux AI (RHEL AI) machine, and the ilab binary is already available in your $PATH, you don't need to specify the --base-dir. Additionally, pass CUDA support with `--cuda`. The `accelerated` pipeline is the only option here and also  the default.

```bash
./ilab-api-server --taxonomy-path ~/.local/share/instructlab/taxonomy/ --rhelai --cuda
```

The `--rhelai` flag indicates that the ilab binary is available in the system's $PATH and does not require a virtual environment.
When using `--rhelai`, the `--base-dir` flag is not required since it will be in a known location at least for meow.

#### RHELAI API server easy-install

It is recommended that you make a temporary directory for yourself to facilitate the install: `mkdir -p ~/temp-apiserver-install && cd ~/temp-apiserver-install`.

We have provided some scripts that should facilitate installation of the API server on RHEL-AI. First, we will download and run a script to install `glibc-devel` as a dependency and reboot the system.

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/instructlab/ui/refs/heads/main/api-server/rhelai-install/install-glibc-devel.sh)"
```

After the reboot has finished we can download the other two install scripts and run the `rhelai-install.sh` as the entrypoint. Make sure to return to your directory before you start:

```bash
cd ~/temp-apiserver-install
curl -fsSL https://raw.githubusercontent.com/instructlab/ui/refs/heads/main/api-server/rhelai-install/install-go.sh
bash -c  "$(curl -fsSL https://raw.githubusercontent.com/instructlab/ui/refs/heads/main/api-server/rhelai-install/rhelai-install.sh)"
```

After this, we can cleanup our temp directory as it is no longer required: `rm -rf ~/temp-apiserver-install`.

### Example command with paths

Here's an example command for running the server on a macOS machine with Metal support and debugging enabled:

```bash
./ilab-api-server --base-dir /Users/<USERNAME>/<PATH_TO_ILAB>/instructlab/ --taxonomy-path ~/.local/share/instructlab/taxonomy/ --pipeline simple --osx --debug
```

## API Documentation

### Models

#### Get Models

**Endpoint**: `GET /models`  
Fetches the list of available models.

- **Response**:

  ```json
  [
    {
      "name": "model-name",
      "last_modified": "timestamp",
      "size": "size-string"
    }
  ]
  ```

### Data

#### Get Data

**Endpoint**: `GET /data`  
Fetches the list of datasets.

- **Response**:

  ```json
  [
    {
      "dataset": "dataset-name",
      "created_at": "timestamp",
      "file_size": "size-string"
    }
  ]
  ```

#### Generate Data

**Endpoint**: `POST /data/generate`  
Starts a data generation job.

- **Request**: None

- **Response**:

  ```json
  {
    "job_id": "generated-job-id"
  }
  ```

### Jobs

#### List Jobs

**Endpoint**: `GET /jobs`  
Fetches the list of all jobs.

- **Response**:

  ```json
  [
    {
      "job_id": "job-id",
      "status": "running/finished/failed",
      "cmd": "command",
      "branch": "branch-name",
      "start_time": "timestamp",
      "end_time": "timestamp"
    }
  ]
  ```

#### Job Status

**Endpoint**: `GET /jobs/{job_id}/status`  
Fetches the status of a specific job.

- **Response**:

  ```json
  {
    "job_id": "job-id",
    "status": "running/finished/failed",
    "branch": "branch-name",
    "command": "command"
  }
  ```

#### Job Logs

**Endpoint**: `GET /jobs/{job_id}/logs`  
Fetches the logs of a specific job.

- **Response**:  
  Text logs of the job.

### Training

#### Start Training

**Endpoint**: `POST /model/train`  
Starts a training job.

- **Request**:

  ```json
  {
    "modelName": "name-of-the-model",
    "branchName": "name-of-the-branch",
    "epochs": 10
  }
  ```

  **Parameters**:
  - `modelName` (string, required): The name of the model. Can be provided **with or without** the `models/` prefix.
    - Examples:
      - Without prefix: `"granite-7b-lab-Q4_K_M.gguf"`
      - With prefix: `"models/granite-7b-starter"`
  - `branchName` (string, required): The name of the branch to train on.
  - `epochs` (integer, optional): The number of training epochs. Must be a positive integer.

- **Response**:

  ```json
  {
    "job_id": "training-job-id"
  }
  ```

### Pipeline

#### Generate and Train Pipeline

**Endpoint**: `POST /pipeline/generate-train`  
Combines data generation and training into a single pipeline job.

- **Request**:

  ```json
  {
    "modelName": "name-of-the-model",
    "branchName": "name-of-the-branch",
    "epochs": 10
  }
  ```

  **Parameters**:
  - `modelName` (string, required): The name of the model. Can be provided **with or without** the `models/` prefix.
    - Examples:
      - Without prefix: `"granite-7b-lab-Q4_K_M.gguf"`
      - With prefix: `"models/granite-7b-starter"`
  - `branchName` (string, required): The name of the branch to train on.
  - `epochs` (integer, optional): The number of training epochs. Must be a positive integer.

- **Response**:

  ```json
  {
    "pipeline_job_id": "pipeline-job-id"
  }
  ```

### Model Serving

#### Serve Latest Checkpoint

**Endpoint**: `POST /model/serve-latest`  
Serves the latest model checkpoint on port `8001`.

- **Request**:

  ```json
  {
    "checkpoint": "samples_12345"
  }
  ```

  **Parameters**:
  - `checkpoint` (string, optional): Name of the checkpoint directory (e.g., `"samples_12345"`). If omitted, the server uses the latest checkpoint.

- **Response**:

  ```json
  {
    "status": "model process started",
    "job_id": "serve-job-id"
  }
  ```

#### Serve Base Model

**Endpoint**: `POST /model/serve-base`  
Serves the base model on port `8000`.

- **Request**: None

- **Response**:

  ```json
  {
    "status": "model process started",
    "job_id": "serve-job-id"
  }
  ```

### QnA Evaluation

#### Run QnA Evaluation

**Endpoint**: `POST /qna-eval`  
Performs QnA evaluation using a specified model and YAML configuration.

- **Request**:

  ```json
  {
    "model_path": "/path/to/model",
    "yaml_file": "/path/to/config.yaml"
  }
  ```

  **Parameters**:
  - `model_path` (string, required): The file path to the model.
  - `yaml_file` (string, required): The file path to the YAML configuration.

- **Response**:
  - **Success**:

    ```json
    {
      "result": "evaluation results..."
    }
    ```

  - **Error**:

    ```json
    {
      "error": "error message"
    }
    ```

### Checkpoints

#### List Checkpoints

**Endpoint**: `GET /checkpoints`  
Lists all available checkpoints.

- **Response**:

  ```json
  [
    "checkpoint1",
    "checkpoint2",
    "checkpoint3"
  ]
  ```

### VLLM

#### List VLLM Containers

**Endpoint**: `GET /vllm-containers`  
Fetches the list of VLLM containers.

- **Response**:

  ```json
  {
    "containers": [
      {
        "container_id": "container-id-1",
        "served_model_name": "pre-train",
        "status": "running",
        "port": "8000"
      },
      {
        "container_id": "container-id-2",
        "served_model_name": "post-train",
        "status": "running",
        "port": "8001"
      }
    ]
  }
  ```

#### Unload VLLM Container

**Endpoint**: `POST /vllm-unload`  
Unloads a specific VLLM container.

- **Request**:

  ```json
  {
    "model_name": "pre-train"
  }
  ```

- **Response**:

  ```json
  {
    "status": "success",
    "message": "Model 'pre-train' unloaded successfully",
    "modelName": "pre-train"
  }
  ```

  **Error Response**:

  ```json
  {
    "error": "Failed to unload model 'pre-train': error details..."
  }
  ```

#### VLLM Status

**Endpoint**: `GET /vllm-status`  
Fetches the status of a specific VLLM model.

- **Query Parameters**:
  - `model_name` (string, required): The name of the model. Must be either `"pre-train"` or `"post-train"`.

- **Response**:

  ```json
  {
    "status": "running"
  }
  ```

### GPU Information

#### GPU Free

**Endpoint**: `GET /gpu-free`  
Retrieves the number of free and total GPUs available.

- **Response**:

  ```json
  {
    "free_gpus": 2,
    "total_gpus": 4
  }
  ```
