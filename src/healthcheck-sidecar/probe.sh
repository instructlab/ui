#!/bin/bash

# requires jq

health_curl=$(curl localhost:8080/health)

granite_curl_healthy=$(echo $health_curl | jq '. | select(.granite_api=="healthy")')
if [[ -z "$granite_curl_healthy" ]]; then
  echo "granite not healthy!"
  exit 1
fi

merlinite_curl_healthy=$(echo $health_curl | jq '. | select(.merlinite_api=="healthy")')
if [[ -z "$merlinite_curl_healthy" ]]; then
  echo "merlinite not healthy!"
  exit 1
fi

exit 0
