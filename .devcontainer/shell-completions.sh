#!/bin/bash
# -*- indent-tabs-mode: nil; tab-width: 2; sh-indentation: 2; -*-

# Misc shell completions
personal_completions_dir=/opt/app-root/src/completions
mkdir -p ${personal_completions_dir}

kubectl completion zsh > ${personal_completions_dir}/_kubectl
chmod 644 ${personal_completions_dir}/_kubectl 

kind completion zsh > ${personal_completions_dir}/_kind
chmod 644 ${personal_completions_dir}/_kind

chown -R default:npm ${personal_completions_dir}

echo "fpath+=${personal_completions_dir}" >> $HOME/.zshrc
