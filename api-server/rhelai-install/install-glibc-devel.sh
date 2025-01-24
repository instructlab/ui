#!/bin/bash
# -*- indent-tabs-mode: nil; tab-width: 2; sh-indentation: 2; -*-

# Dependency installations for RHELAI APIserver install

set -x
set -e
set -o pipefail

echo "Installing \`glibc-devel\` as a dependency of \`cgo\`." 
sudo rpm-ostree install glibc-devel
echo "export CGO_ENABLED=1" >> ~/.bashrc

echo "The system needs to be rebooted for \`glibc-devel\` to be installed. Re-booting."
sudo systemctl reboot
