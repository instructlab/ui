# Ilab API Server

## Overview

This is an Ilab API Server that is a temporary set of APIs for service developing apps against [InstructLab](https://github.com/instructlab/). It provides endpoints for model management, data generation, training, job tracking and job logging.

## Quickstart

On a node with CUDA/GPUs and `ilab` in the $PATH, run:

```bash
go mod download
go build
./api-server  --taxonomy-path /var/home/cloud-user/.local/share/instructlab/taxonomy/ --cuda --rhelai --vllm
```

### Prerequisites

- Ensure that the required directories (`base-dir` and `taxonomy-path`) exist and are accessible and Go is installed in the $PATH.

### Install Dependencies

To install the necessary dependencies, run:

```bash
go mod download
```

### Run the Server

#### For macOS with Metal (MPS):

```bash
go run main.go --base-dir /path/to/base-dir --taxonomy-path /path/to/taxonomy --osx
```

#### For CUDA-enabled environments:

```bash
go run main.go --base-dir /path/to/base-dir --taxonomy-path /path/to/taxonomy --cuda
```

#### For a RHEL AI machine:

- If you're operating on a Red Hat Enterprise Linux AI (RHEL AI) machine, and the ilab binary is already available in your $PATH, you don't need to specify the --base-dir. Additionally, pass CUDA support with `--cuda`.

```bash
go run main.go --taxonomy-path ~/.local/share/instructlab/taxonomy/ --rhelai --cuda
```

The `--rhelai` flag indicates that the ilab binary is available in the system's $PATH and does not require a virtual environment.
When using `--rhelai`, the `--base-dir` flag is not required since it will be in a known location at least for meow.

### Example command with paths:

Here's an example command for running the server on a macOS machine with Metal support:

```bash
go run main.go --base-dir /Users/user/code/instructlab --taxonomy-path ~/.local/share/instructlab/taxonomy/ --osx
```

## API Doc

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

- **Response**: Text logs of the job.

### Training

#### Start Training
**Endpoint**: `POST /model/train`  
Starts a training job.

- **Request**:
  ```json
  {
    "modelName": "name-of-the-model",
    "branchName": "name-of-the-branch"
  }
  ```
  
  **Note**: The `modelName` can be provided **with or without** the `models/` prefix. Examples:
  
  - Without prefix: `"granite-7b-lab-Q4_K_M.gguf"`
  - With prefix: `"models/granite-7b-starter"`
  
  The server will handle the prefix to construct the correct model path.

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
    "branchName": "name-of-the-branch"
  }
  ```
  
  **Note**: Similar to the training endpoint, `modelName` can be with or without the `models/` prefix.

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

- **Response**:
  ```json
  {
    "status": "model process started",
    "job_id": "serve-job-id"
  }
  ```

## Handling Model Names with or without `models/` Prefix

The server is designed to handle `modelName` inputs **both with and without** the `models/` prefix to prevent path duplication. Here’s how it works:

- **Without Prefix**:
  - **Input**: `"granite-7b-lab-Q4_K_M.gguf"`
  - **Constructed Path**: `~/.cache/instructlab/models/granite-7b-lab-Q4_K_M.gguf`

- **With Prefix**:
  - **Input**: `"models/granite-7b-starter"`
  - **Constructed Path**: `~/.cache/instructlab/models/granite-7b-starter`
