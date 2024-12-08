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
kubectl completion zsh > $ZSH/cache/completions/_kubectl

curl -sLO https://access.cdn.redhat.com/content/origin/files/sha256/99/99f0ecb5477ed1a038e7279252971b4c5d50fa9a877f78610b7d4e4ee02e0589/openshift-client-linux-amd64-rhel9-4.17.6.tar.gz
