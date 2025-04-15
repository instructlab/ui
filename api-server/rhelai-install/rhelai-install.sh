#!/bin/bash
# -*- indent-tabs-mode: nil; tab-width: 4; sh-indentation: 4; -*-

# Install script for the API server

set -x
set -e
set -o pipefail

if [ -z "$TAXONOMY_PATH" ]; then
    echo "Var \$TAXONOMY_PATH was not set, using default path: $HOME/.local/share/instructlab/taxonomy."
    export TAXONOMY_PATH="$HOME/.local/share/instructlab/taxonomy"
fi

if [ ! -d "$TAXONOMY_PATH" ]; then
    echo "\$TAXONOMY_PATH was set as $TAXONOMY_PATH, but path does not exist."
    exit 1
fi

if [ -d "/tmp/api-server" ]; then
    rm -rf /tmp/api-server
fi

mkdir -p /tmp/api-server
cd /tmp/api-server
curl -sLO https://instructlab-ui.s3.us-east-1.amazonaws.com/apiserver/apiserver-linux-amd64.tar.gz
tar -xzf apiserver-linux-amd64.tar.gz
mv apiserver-linux-amd64/ilab-apiserver $HOME/.local/bin
rm -rf apiserver-linux-amd64 apiserver-linux-amd64.tar.gz /tmp/api-server

CUDA_FLAG=""

if [ "$(command -v nvcc)" ] && [ -n "$(nvcc --version)" ]; then
    CUDA_FLAG="--cuda"
fi

ilab-apiserver --taxonomy-path "$TAXONOMY_PATH" $CUDA_FLAG --rhelai --vllm
