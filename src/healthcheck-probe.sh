#!/bin/bash

# -*- indent-tabs-mode: nil; tab-width: 2; sh-indentation: 2; -*-

# probe script to check to run as readinesProb (https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#define-readiness-probes)
# requires jq

set -x
set -e
set -o pipefail

if ! curl "http://localhost:8080/health" >/dev/null 2>&1; then
  echo "Error: Could not access the sidecar server."
  exit 1
fi

## Below checks the actual health of the model enpdoints, which I am not sure we want. The UI container
## should be dependent on only the sidecar health server, and not its results.
# granite_health_api_status=$(echo $health_curl | jq '.granite.health_api_status' | cut -d "\"" -f 2)
# granite_models_api_status=$(echo $health_curl | jq '.granite.models_api_status.status' | cut -d "\"" -f 2)
# granite_model_avilable=$(echo $health_curl | jq '.granite.models_api_status.available')

# if [[ "$granite_health_api_status" != "healthy" ]]; then
#   echo "\`.granite.health_api_status\` did not evaluate to healthy: ${granite_health_api_status}"
#   exit 1
# fi

# if [[ "$granite_models_api_status" != "healthy" ]]; then
#   echo "\`.granite.models_api_status\` did not evaluate to healthy: ${granite_models_api_status}"
#   exit 1
# fi

# if [[ "$granite_model_avilable" != true ]]; then
#   echo "\`.granite.models_api_status.available\` did not evaluate to healthy: ${granite_model_avilable}"
#   exit 1
# fi
