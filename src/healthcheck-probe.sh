#!/bin/bash

# -*- indent-tabs-mode: nil; tab-width: 2; sh-indentation: 2; -*-

# probe script to check to run as readinesProb (https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#define-readiness-probes)
# requires jq

set -x
set -e
set -o pipefail

health_curl=$(curl localhost:8080/health)

granite_curl_healthy=$(echo "${health_curl}" | jq '. | select(.granite_api=="healthy")')
if [[ -z "${granite_curl_healthy}" ]]; then
  echo "granite not healthy!"
  exit 1
fi

merlinite_curl_healthy=$(echo "${health_curl}" | jq '. | select(.merlinite_api=="healthy")')
if [[ -z "${merlinite_curl_healthy}" ]]; then
  echo "merlinite not healthy!"
  exit 1
fi

exit 0
