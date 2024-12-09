#!/bin/bash
# -*- indent-tabs-mode: nil; tab-width: 2; sh-indentation: 2; -*-

# Install the kind binary

[ "$(uname -m)" = "x86_64" ] && curl -Lo /tmp/kind https://kind.sigs.k8s.io/dl/v0.25.0/kind-linux-amd64
[ "$(uname -m)" = "aarch64" ] && curl -Lo /tmp/kind https://kind.sigs.k8s.io/dl/v0.25.0/kind-linux-arm64
chmod +x /tmp/kind
mv /tmp/kind /usr/local/bin/kind
kind completion zsh > "${HOME}/.oh-my-zsh/cache/completions/_kind"
chown -R ${USERNAME}:npm ${HOME}/.oh-my-zsh/cache/completions/_kind
