# Development

## building

podman build . -f Containerfile --platform linux/amd64 -t quay.io/grpereir/ilab-ui-healthcheck-sidecar:latest

## running

podman run --platform linux/amd64 --rm -e IL_GRANITE_API=localhost -e IL_MERLINITE_API=localhost -it quay.io/grpereir/ilab-ui-healthcheck-sidecar:latest /bin/bash

## push 

podman push quay.io/grpereir/ilab-ui-healthcheck-sidecar:latest

# How does it work

the sidecar-script.py is the entrypoint to the sidecar container. Its a simple python script that grabs the env variables for `IL_GRANITE_API` and `IL_MERLINITE_API`,
and uses those values to check the `/health` endpoint of the server. From there it aggregates the results of `curl`ing both a json object, and serves that as the
payload to `localhost:8080`. The UI deployment will then pick this up via a readinesProb, with the command being the contents of the `probe.sh` script. This script
has been added to the UI container build process, along with the installation of `jq` as its dependency via the UI Containerfile.
