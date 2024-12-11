#!/bin/bash
# -*- indent-tabs-mode: nil; tab-width: 2; sh-indentation: 2; -*-

# Helper script to filter out `.env`` values related to umami deployment, and generate the secret manifest from that

# Requires: kubectl, yq

if [ -f ".env" ]; then
  source .env
fi

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
  UMAMI_DATABASE_NAME_KEY_NAME=POSTGRESQL_DATABASE
  UMAMI_DATABASE_USER_KEY_NAME=POSTGRESQL_USER
  UMAMI_DATABASE_PASSWORD_KEY_NAME=POSTGRESQL_PASSWORD
elif [ "${TARGET}" == "KIND" ]; then
  UMAMI_SECRET_FILE_PATH="deploy/k8s/overlays/kind/umami/umami-secret.yaml"
  UMAMI_DATABASE_NAME_KEY_NAME=POSTGRES_DB
  UMAMI_DATABASE_USER_KEY_NAME=POSTGRES_USER
  UMAMI_DATABASE_PASSWORD_KEY_NAME=POSTGRES_PASSWORD
else
  echo "Error, \$TARGET ${TARGET} not recongnized.
    TARGET options: [\"OPENSHIFT\", \"KIND\"]"
  exit 1
fi

required_vars=("DATABASE_TYPE" "UMAMI_DATABASE_NAME" "UMAMI_DATABASE_USER" "UMAMI_DATABASE_PASSWORD" "UMAMI_APP_SECRET" "DATABASE_URL")

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

cluster_domain=$(kubectl cluster-info | grep 'Kubernetes control plane' | awk -F// '{print $2}' | awk -F: '{print $1}')

# Note: `.env` values get rerouted to their correct image target
# Prod uses: `POSTGRESQL_DATABASE`,`POSTGRESQL_USER`, and `POSTGRESQL_PASSWORD`
# Stage uses: `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD`
# This different is due to the differences in the `postgresql:15-alpine` image and the `registry.redhat.io/rhel9/postgresql-15:9.5-1733127512` image
# Both map `UMAMI_APP_SECRET` to `APP_SECRET`

kubectl create secret generic umami-secret \
  --from-literal "DATABASE_TYPE=${DATABASE_TYPE}" \
  --from-literal "${UMAMI_DATABASE_NAME_KEY_NAME}=${UMAMI_DATABASE_NAME}" \
  --from-literal "${UMAMI_DATABASE_USER_KEY_NAME}=${UMAMI_DATABASE_USER}" \
  --from-literal "${UMAMI_DATABASE_PASSWORD_KEY_NAME}=${UMAMI_DATABASE_PASSWORD}" \
  --from-literal "APP_SECRET=${UMAMI_APP_SECRET}" \
  --from-literal "DATABASE_URL=${DATABASE_URL}" \
  --namespace "${NAMESPACE}" \
  --dry-run=client \
  -o yaml > ${UMAMI_SECRET_FILE_PATH}

yq eval ".metadata.labels.cluster_domain = \"${cluster_domain}\"" -i ${UMAMI_SECRET_FILE_PATH}

echo "Secret manifest has been created: ${UMAMI_SECRET_FILE_PATH}."
