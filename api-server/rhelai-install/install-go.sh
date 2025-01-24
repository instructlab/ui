#!/bin/bash
# -*- indent-tabs-mode: nil; tab-width: 2; sh-indentation: 2; -*-

# Dependency installations for RHELAI APIserver install

GO_VERSION="1.23.5"
GO_ARCHIVE="go${GO_VERSION}.linux-amd64.tar.gz"
GO_URL="https://go.dev/dl/${GO_ARCHIVE}"
INSTALL_DIR="$HOME/.go"
PATH_EXPORT="export PATH=\$PATH:${INSTALL_DIR}/bin"

for cmd in curl tar; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: '$cmd' is not installed. Please install it and retry."
        exit 1
    fi
done

echo "Downloading Go ${GO_VERSION}..."
curl -LO "$GO_URL"

mkdir -p "$INSTALL_DIR"

tar --strip-components=1 -C "$INSTALL_DIR" -xzf "$GO_ARCHIVE"

rm "$GO_ARCHIVE"

# Export PATH in current shell
export PATH="$PATH:${INSTALL_DIR}/bin"
echo "Go bin directory added to PATH for the current session."

# Add PATH export to ~/.bashrc if not already present
grep -qxF "$PATH_EXPORT" "$HOME/.bashrc" || echo "$PATH_EXPORT" >> "$HOME/.bashrc"
echo "Go bin directory added to PATH in ~/.bashrc."

# Verify
go version
