#!/bin/bash
# -*- indent-tabs-mode: nil; tab-width: 2; sh-indentation: 2; -*-

# Install the  kubectl binary

ARCH=$(uname -m)
if [ "$ARCH" == "x86_64" ] || [ "$ARCH" == "amd64" ]; then
    ARCH="amd64"
elif [ "$ARCH" == "aarch64" ] || [ "$ARCH" == "arm64" ]; then
    ARCH="arm64"
else
    echo "Unsupported architecture: $ARCH"
    exit 1
fi

KUBECTL_VERSION=$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)
echo "Installing kubectl version $KUBECTL_VERSION for $ARCH..."
curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/${ARCH}/kubectl"
chmod +x kubectl
mv kubectl /usr/local/bin/
kubectl completion zsh > /opt/app-root/src/.oh-my-zsh/cache/completions/_kubectl
