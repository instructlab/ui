#!/bin/bash
# -*- indent-tabs-mode: nil; tab-width: 2; sh-indentation: 2; -*-

# Install script for the API server
## dependencies: go, git

set -x
set -e
set -o pipefail

### installations

if [ -z "$(command -v git)" ]; then
    echo "please make sure \`git\` is installed."
    exit 1 
fi

if [ -z "$(command -v go)" ]; then
    echo "\`go\` is not installed, installing."
    ./install-go.sh
fi

if [ -z "$TAXONOMY_PATH" ]; then
    echo "Var \$TAXONOMY_PATH was not set, using default path: $HOME/.local/share/instructlab/taxonomy."
    export TAXONOMY_PATH="$HOME/.local/share/instructlab/taxonomy"
fi

if [ ! -d "$TAXONOMY_PATH" ]; then
    echo "\$TAXONOMY_PATH was set as $TAXONOMY_PATH, but path does not exist."
    exit 1
fi

### script

if [ -d "/tmp/ui" ]; then
    rm -rf /tmp/ui
fi

git clone https://github.com/instructlab/ui.git /tmp/ui
cd /tmp/ui/api-server
go mod download
go build -o ilab-api-router

CUDA_FLAG=""

if [ "$(command -v nvcc)" ] && [ -n "$(nvcc --version)" ]; then
    CUDA_FLAG="--cuda"
fi

./ilab-api-router  --taxonomy-path "$TAXONOMY_PATH" $CUDA_FLAG --rhelai --vllm
