#!/bin/bash
# -*- indent-tabs-mode: nil; tab-width: 2; sh-indentation: 2; -*-

# Install the kubeseal binary

set -x
set -e
set -o pipefail

# Determine architecture
ARCH=$(uname -m)
if [ "$ARCH" == "x86_64" ] || [ "$ARCH" == "amd64" ]; then
    ARCH="amd64"
elif [ "$ARCH" == "aarch64" ] || [ "$ARCH" == "arm64" ]; then
    ARCH="arm64"
else
    echo "Unsupported architecture: $ARCH"
    exit 1
fi

KUBESEAL_VERSION=$(curl -s https://api.github.com/repos/bitnami-labs/sealed-secrets/tags | jq -r '.[0].name' | cut -c 2-)
if [ -z "$KUBESEAL_VERSION" ]; then
    echo "Failed to fetch the latest KUBESEAL_VERSION"
    exit 1
fi

curl -OL "https://github.com/bitnami-labs/sealed-secrets/releases/download/v${KUBESEAL_VERSION}/kubeseal-${KUBESEAL_VERSION}-linux-${ARCH}.tar.gz"
tar -xvzf kubeseal-${KUBESEAL_VERSION}-linux-${ARCH}.tar.gz kubeseal
install -m 755 kubeseal /usr/local/bin/kubeseal
kubeseal completion zsh > ~/.oh-my-zsh/cache/completions/_kubeseal
