.PHONY: help
help:
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

#
# If you want to see the full commands, run:
#   NOISY_BUILD=y make
#
ifeq ($(NOISY_BUILD),)
    ECHO_PREFIX=@
    CMD_PREFIX=@
    PIPE_DEV_NULL=> /dev/null 2> /dev/null
else
    ECHO_PREFIX=@\#
    CMD_PREFIX=
    PIPE_DEV_NULL=
endif

ILAB_KUBE_CONTEXT?=kind-instructlab-ui
ILAB_KUBE_NAMESPACE?=instructlab
ILAB_KUBE_CLUSTER_NAME?=instructlab-ui
CONTAINER_ENGINE?=docker
DEVCONTAINER_BINARY_EXISTS?=$(shell command -v devcontainer)
DEVCONTAINER_DEFAULT_SHELL?=zsh
TAG=$(shell git rev-parse HEAD)
##@ Development - Helper commands for development
.PHONY: md-lint
md-lint: ## Lint markdown files
	$(ECHO_PREFIX) printf "  %-12s ./...\n" "[MD LINT]"
	$(CMD_PREFIX) docker run --rm -v $(CURDIR):/workdir docker.io/davidanson/markdownlint-cli2:v0.6.0 > /dev/null

.PHONY: action-lint
action-lint:  ## Lint GitHub Action workflows
	$(ECHO_PREFIX) printf "  %-12s .github/...\n" "[ACTION LINT]"
	$(CMD_PREFIX) if ! which actionlint $(PIPE_DEV_NULL) ; then \
		echo "Please install actionlint." ; \
		echo "go install github.com/rhysd/actionlint/cmd/actionlint@latest" ; \
		exit 1 ; \
	fi
	$(CMD_PREFIX) actionlint -color

.PHONY: yaml-lint
yaml-lint: ## Lint yaml files
	$(CMD_PREFIX) if ! which yamllint >/dev/null 2>&1; then \
		echo "Please install yamllint." ; \
		echo "See: https://yamllint.readthedocs.io/en/stable/quickstart.html" ; \
		exit 1 ; \
	fi
	$(ECHO_PREFIX) printf "  %-12s ./...\n" "[YAML LINT]"
	$(CMD_PREFIX) yamllint -c .yamllint.yaml deploy --strict

##@ Artifacts - Command to build and publish artifacts
ui-image: src/Containerfile ## Build container image for the InstructLab UI
	$(ECHO_PREFIX) printf "  %-12s src/Containerfile\n" "[docker]"
	$(CMD_PREFIX) docker build -f src/Containerfile -t ghcr.io/instructlab/ui/ui:$(TAG) .
	$(CMD_PREFIX) docker tag ghcr.io/instructlab/ui/ui:$(TAG) ghcr.io/instructlab/ui/ui:main


ps-image: pathservice/Containerfile ## Build container image for the InstructLab PathService
	$(ECHO_PREFIX) printf "  %-12s pathservice/Containerfile\n" "[docker]"
	$(CMD_PREFIX) docker build -f pathservice/Containerfile -t ghcr.io/instructlab/ui/pathservice:$(TAG) .
	$(CMD_PREFIX) docker tag ghcr.io/instructlab/ui/pathservice:$(TAG) ghcr.io/instructlab/ui/pathservice:main

##@ Local Dev - Local machine based deployment of the UI stack
.PHONY: stop-dev-local
stop-dev-local:  ## Stop the npm and pathservice local instances
	$(CMD_PREFIX) echo "Stopping ui and pathservice..."
	$(CMD_PREFIX) if [ -f ui.pid ]; then kill -2 `cat ui.pid` && rm ui.pid || echo "Failed to stop ui"; fi
	$(CMD_PREFIX) if [ -f pathservice.pid ]; then kill -2 `cat pathservice.pid` && rm pathservice.pid || echo "Failed to stop pathservice"; fi
	$(CMD_PREFIX) echo "Development environment stopped."

.PHONY: start-dev-local
start-dev-local:  ## Start the npm and pathservice local instances
	$(CMD_PREFIX) echo "Starting ui and pathservice..."
	$(CMD_PREFIX) cd ./pathservice; go run main.go & echo $$! > ../pathservice.pid
	$(CMD_PREFIX) npm run dev & echo $$! > ui.pid
	$(CMD_PREFIX) echo "Development environment started."

##@ Podman Dev - Podman desktop based Deployment of the UI stack
.PHONY: stop-dev-podman
stop-dev-podman:  ## Stop UI development stack running in podman
	$(CMD_PREFIX) echo "Deleting UI development stack running in podman..."
	$(CMD_PREFIX) podman-compose -f ./deploy/compose/ui-compose.yml down
	$(CMD_PREFIX) echo "Development environment deleted."

.PHONY: start-dev-podman
start-dev-podman:  ## Start UI development stack in podman
	$(CMD_PREFIX) echo "Deploying UI development stack using compose..."
	$(CMD_PREFIX) if [ ! -f .env ]; then \
		echo "Please create a .env file in the root of the project." ; \
		exit 1 ; \
	fi

	$(CMD_PREFIX) yes | cp -rf .env ./deploy/compose/.env
	$(CMD_PREFIX) podman-compose -f ./deploy/compose/ui-compose.yml up -d
	$(CMD_PREFIX) echo "Development environment started."

##@ Kubernetes - Kind cluster based dev environment
.PHONY: check-kind
check-kind:
	$(CMD_PREFIX) if [ -z "$(shell which kind)" ]; then \
		echo "Please install kind and then start the kind dev environment." ; \
		echo "https://kind.sigs.k8s.io/" ; \
		exit 1 ; \
	fi

.PHONY: check-kubectl
check-kubectl:
	$(CMD_PREFIX) if [ -z "$(shell which kubectl)" ]; then \
		echo "Please install kubectl" ; \
		echo "https://kubernetes.io/docs/tasks/tools/#kubectl" ; \
		exit 1 ; \
	fi

.PHONY: check-kubeseal
check-kubeseal:
	$(CMD_PREFIX) if [ -z "$(shell which kubeseal)" ]; then \
		echo "Please install kubeseal" ; \
		echo "https://github.com/bitnami-labs/sealed-secrets?tab=readme-ov-file#kubeseal" ; \
		exit 1 ; \
	fi

.PHONY: load-images
load-images: ## Load images onto Kind cluster
	$(CMD_PREFIX) kind load --name $(ILAB_KUBE_CLUSTER_NAME) docker-image ghcr.io/instructlab/ui/ui:main

.PHONY: stop-dev-kind
stop-dev-kind: check-kind ## Stop the Kind cluster to destroy the development environment
	$(CMD_PREFIX) kind delete cluster --name $(ILAB_KUBE_CLUSTER_NAME)

.PHONY: setup-kind
setup-kind: check-kind check-kubectl stop-dev-kind ## Create a Kind cluster with ingress enabled
	$(CMD_PREFIX) kind create cluster --config ./deploy/k8s/overlays/kind/kind.yaml
	$(CMD_PREFIX) kubectl cluster-info
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) apply -f ./deploy/k8s/overlays/kind/kind-ingress.yaml

.PHONY: wait-for-readiness
wait-for-readiness: # Wait for operators to be ready
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) -n ingress-nginx rollout restart deployment ingress-nginx-controller
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) -n ingress-nginx rollout status deployment ingress-nginx-controller --timeout=10m

.PHONY: deploy-kind
deploy-kind: wait-for-readiness ## Deploy a InstructLab UI development stack onto a kubernetes cluster
	$(CMD_PREFIX) if [ ! -f .env ]; then \
		echo "Please create a .env file in the root of the project." ; \
		exit 1 ; \
	fi
	$(CMD_PREFIX) yes | cp -rf .env ./deploy/k8s/overlays/kind/.env
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) apply -k ./deploy/k8s/overlays/kind
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) wait --for=condition=Ready pods -n $(ILAB_KUBE_NAMESPACE) --all -l app.kubernetes.io/part-of=ui --timeout=15m

.PHONY: redeploy-kind
redeploy-kind: ui-image load-images ## Redeploy the InstructLab UI stack onto a kubernetes cluster
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) -n $(ILAB_KUBE_NAMESPACE) rollout restart deploy/ui
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) -n $(ILAB_KUBE_NAMESPACE) rollout restart deploy/pathservice

.PHONY: undeploy-kind
undeploy-kind: ## Undeploy the InstructLab UI stack from a kubernetes cluster
	$(CMD_PREFIX) if [ -f ./deploy/k8s/overlays/kind/.env ]; then \
		rm ./deploy/k8s/overlays/kind/.env ; \
	fi
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) delete namespace $(ILAB_KUBE_NAMESPACE)

.PHONY: start-dev-kind ## Run the development environment on Kind cluster
start-dev-kind: setup-kind load-images deploy-kind ## Setup a Kind cluster and deploy InstructLab UI on it

##@ OpenShift - UI prod and qa deployment on OpenShift
.PHONY: deploy-qa-openshift
deploy-qa-openshift: ## Deploy QA stack of the InstructLab UI on OpenShift
	$(CMD_PREFIX) if [ ! -f .env ]; then \
		echo "Please create a .env file in the root of the project." ; \
		exit 1 ; \
	fi
	$(CMD_PREFIX) yes | cp -rf .env ./deploy/k8s/overlays/openshift/qa/.env
	$(CMD_PREFIX) oc apply -k ./deploy/k8s/overlays/openshift/qa
	$(CMD_PREFIX) oc wait --for=condition=Ready pods -n $(ILAB_KUBE_NAMESPACE) --all -l app.kubernetes.io/part-of=ui --timeout=15m

.PHONY: redeploy-qa-openshift
redeploy-qa-openshift: ## Redeploy QA stack of the InstructLab UI on OpenShift
	$(CMD_PREFIX) oc -n $(ILAB_KUBE_NAMESPACE) rollout restart deploy/ui
	$(CMD_PREFIX) oc -n $(ILAB_KUBE_NAMESPACE) rollout restart deploy/pathservice

.PHONY: undeploy-qa-openshift
undeploy-qa-openshift: ## Undeploy QA stack of the InstructLab UI on OpenShift
	$(CMD_PREFIX) oc delete -k ./deploy/k8s/overlays/openshift/qa
	$(CMD_PREFIX) if [ -f ./deploy/k8s/overlays/openshift/qa/.env ]; then \
		rm ./deploy/k8s/overlays/openshift/qa/.env ; \
	fi

.PHONY: deploy-prod-openshift
deploy-prod-openshift: ## Deploy production stack of the InstructLab UI on OpenShift
	$(CMD_PREFIX) if [ ! -f .env ]; then \
		echo "Please create a .env file in the root of the project." ; \
		exit 1 ; \
	fi

	$(CMD_PREFIX) yes | cp -rf .env ./deploy/k8s/overlays/openshift/prod/.env
	$(CMD_PREFIX) oc apply -k ./deploy/k8s/overlays/openshift/prod
	$(CMD_PREFIX) oc wait --for=condition=Ready pods -n $(ILAB_KUBE_NAMESPACE) --all -l app.kubernetes.io/part-of=ui --timeout=15m

.PHONY: redeploy-prod-openshift
redeploy-prod-openshift: ## Redeploy production stack of the InstructLab UI on OpenShift
	$(CMD_PREFIX) oc -n $(ILAB_KUBE_NAMESPACE) rollout restart deploy/ui
	$(CMD_PREFIX) oc -n $(ILAB_KUBE_NAMESPACE) rollout restart deploy/pathservice


.PHONY: undeploy-prod-openshift
undeploy-prod-openshift: ## Undeploy production stack of the InstructLab UI on OpenShift
	$(CMD_PREFIX) oc delete -k ./deploy/k8s/overlays/openshift/prod
	$(CMD_PREFIX) if [ -f ./deploy/k8s/overlays/openshift/prod/.env ]; then \
		rm ./deploy/k8s/overlays/openshift/prod/.env ; \
	fi

.PHONY: check-dev-container-installed
check-dev-container-installed:
	@if [ -z "${DEVCONTAINER_BINARY_EXISTS}" ]; then \
		echo "You do not have devcontainer installed, please isntall it!"; \
		exit 1; \
	fi;

.PHONY: build-dev-container
build-dev-container:
	$(MAKE) check-dev-container-installed
	devcontainer build --workspace-folder=./ --docker-path=${CONTAINER_ENGINE}

.PHONY: start-dev-container
start-dev-container:
	$(MAKE) check-dev-container-installed
	devcontainer up --workspace-folder=./ --docker-path=${CONTAINER_ENGINE}

.PHONY: enter-dev-container
enter-dev-container:
	$(MAKE) check-dev-container-installed
	devcontainer exec --workspace-folder=./ --docker-path=${CONTAINER_ENGINE} ${DEVCONTAINER_DEFAULT_SHELL}

.PHONY: cycle-dev-container
cycle-dev-container:
	@image_id=$(shell ${CONTAINER_ENGINE} images | grep "quay.io/instructlab-ui/devcontainer" | awk '{print $$3}') && \
	if [ -n "$$image_id" ]; then \
		CONTAINER_IDS=$(shell ${CONTAINER_ENGINE} ps -a | grep "quay.io/instructlab-ui/devcontainer" | awk '{print $$1}') && \
		if [ -n "$$CONTAINER_IDS" ]; then \
			for CONTAINER_ID in "$$CONTAINER_IDS"; do \
				echo "Stopping and removing container $$CONTAINER_ID of imageid $$image_id..."; \
				${CONTAINER_ENGINE} rm "$$CONTAINER_ID" -f; \
			done; \
		fi; \
		echo "removing image with id $$image_id and all containers using that image ..."; \
		${CONTAINER_ENGINE} rmi $$image_id -f; \
	fi;
	$(MAKE) build-dev-container
	$(MAKE) start-dev-container
