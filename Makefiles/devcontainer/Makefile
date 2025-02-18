# ╔══════════════════════════════════════════════════════════╗
# ║                   Devcontainer Targets                   ║
# ╚══════════════════════════════════════════════════════════╝

#################### DEPENDENCY FUNCTIONS ####################

DEVCONTAINER_BINARY_EXISTS ?= $(shell command -v devcontainer)

##@ Devcontainer Deployment - Helper commands for deploying UI stack in dev container

.PHONY: check-dev-container-installed
check-dev-container-installed: ## Check the devcontainer binary is in $PATH
	@if [ -z "${DEVCONTAINER_BINARY_EXISTS}" ]; then \
		echo "You do not have devcontainer installed, please isntall it!" ; \
		exit 1 ; \
	fi;

################### DEVCONTAINER FUNCTIONS ###################

.PHONY: build-dev-container
build-dev-build-dev-container: ## Build the dev container:
	$(MAKE) check-dev-container-installed
	devcontainer build --workspace-folder=./ --docker-path=${CONTAINER_ENGINE}

.PHONY: start-dev-container
start-dev-container:  ## Start the dev container
	$(MAKE) check-dev-container-installed
	devcontainer up --workspace-folder=./ --docker-path=${CONTAINER_ENGINE}

.PHONY: enter-dev-container
enter-dev-container: ## Enter the dev container
	$(MAKE) check-dev-container-installed
	devcontainer exec --workspace-folder=./ --docker-path=${CONTAINER_ENGINE} bash

.PHONY: cycle-dev-container
cycle-dev-container: ## Recyle (Stop, remove, build and start) the dev container
	@image_id=$(shell ${CONTAINER_ENGINE} images | grep "quay.io/instructlab-ui/devcontainer" | awk '{print $$3}') && \
	if [ -n "$$image_id" ]; then \
		CONTAINER_IDS=$(shell ${CONTAINER_ENGINE} ps -a | grep "quay.io/instructlab-ui/devcontainer" | awk '{print $$1}') && \
		if [ -n "$$CONTAINER_IDS" ]; then \
			for CONTAINER_ID in "$$CONTAINER_IDS"; do \
				echo "Stopping and removing container $$CONTAINER_ID of imageid $$image_id..." ; \
				${CONTAINER_ENGINE} rm "$$CONTAINER_ID" -f ; \
			done ; \
		fi ; \
		echo "removing image with id $$image_id and all containers using that image ..." ; \
		${CONTAINER_ENGINE} rmi $$image_id -f ; \
	fi;
	$(MAKE) build-dev-container
	$(MAKE) start-dev-container
