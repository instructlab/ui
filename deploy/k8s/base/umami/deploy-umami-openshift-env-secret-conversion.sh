#!/bin/bash
# -*- indent-tabs-mode: nil; tab-width: 2; sh-indentation: 2; -*-

# Helper script to filter out `.env`` values related to umami deployment, and generate the secret manifest from that

source .env

if [ "$#" -ne 2 ]; then
    echo "USAGE: $0 TARGET NAMESPACE
      TARGET:     The deployment target. Options: [\"OPENSHIFT\", \"KIND\"]
      NAMESPACE:  The namespace where you want to deploy the umami-secret." 1>&2
    exit 1
fi

TARGET="$1"
NAMESPACE="$2"


if [ "${TARGET}" == "OPENSHIFT" ]; then
  UMAMI_SECRET_FILE_PATH="deploy/k8s/overlays/openshift/umami/umami-secret.yaml"
elif [ "${TARGET}" == "KIND" ]; then
  UMAMI_SECRET_FILE_PATH="deploy/k8s/overlays/kind/umami/umami-secret.yaml"
else
  echo "Error, \$TARGET ${TARGET} not recongnized.
    TARGET options: [\"OPENSHIFT\", \"KIND\"]"
  exit 1
fi

required_vars=("DATABASE_TYPE" "POSTGRESQL_DATABASE" "POSTGRESQL_USER" "POSTGRESQL_PASSWORD" "UMAMI_APP_SECRET" "DATABASE_URL")

missing_vars=()

for var in "${required_vars[@]}"; do
  if [[ -z "${!var}" ]]; then
    missing_vars+=("$var")
  fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
  echo "The following environment variables are missing:"
  for var in "${missing_vars[@]}"; do
    echo "  - $var"
  done
  echo "Please add these variables to your .env file."
  exit 1
fi

# Note: `.env` value  UMAMI_APP_SECRET is re-routed to APP_SECRET intentionally
kubectl create secret generic umami-secret \
  --from-literal DATABASE_TYPE=${DATABASE_TYPE} \
  --from-literal POSTGRESQL_DATABASE=${POSTGRESQL_DATABASE} \
  --from-literal POSTGRESQL_USER=${POSTGRESQL_USER} \
  --from-literal POSTGRESQL_PASSWORD=${POSTGRESQL_PASSWORD} \
  --from-literal APP_SECRET=${UMAMI_APP_SECRET} \
  --from-literal DATABASE_URL=${DATABASE_URL} \
  --namespace ${NAMESPACE} \
  --dry-run=client \
  -o yaml > ${UMAMI_SECRET_FILE_PATH}

echo "Secret manifest has been created: ${UMAMI_SECRET_FILE_PATH}."
