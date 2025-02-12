# ╔══════════════════════════════════════════════════════════╗
# ║                 Container Build Targets                  ║
# ╚══════════════════════════════════════════════════════════╝

#################### VARIABLE DEFINITIONS ####################

TARGET_IMAGE_ARCH?=amd64
CONTAINER_ENGINE?=docker

#################### VALIDATION FUNCTIONS ####################
.PHONY: help
help:
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

validate-container-engine:
ifeq ($(CONTAINER_ENGINE),docker)
	@if ! command -v docker >/dev/null 2>&1; then \
		echo "Error: Docker is not installed or not in your PATH." >&2; \
		exit 1; \
	fi
else ifeq ($(CONTAINER_ENGINE),podman)
	@if ! command -v podman >/dev/null 2>&1; then \
		echo "Error: Podman is not installed or not in your PATH." >&2; \
		exit 1; \
	fi
else
	@echo "Error: CONTAINER_ENGINE must be either 'docker' or 'podman'." >&2
	@exit 1
endif

################## BUILD SOURCE CONTAINERS ##################

##@ Build Images - Helper commands for building relevant container images

ui-image: validate-container-engine src/Containerfile ## Build container image for the InstructLab UI
	$(ECHO_PREFIX) printf "  %-12s src/Containerfile\n" "[$(CONTAINER_ENGINE)]"
	$(CMD_PREFIX) $(CONTAINER_ENGINE) build -f src/Containerfile -t quay.io/instructlab-ui/ui:$(TAG) .
	$(CMD_PREFIX) $(CONTAINER_ENGINE) tag quay.io/instructlab-ui/ui:$(TAG) quay.io/instructlab-ui/ui:main
	$(CMD_PREFIX) $(CONTAINER_ENGINE) tag quay.io/instructlab-ui/ui:$(TAG) ghcr.io/instructlab/ui/ui:main

ps-image: validate-container-engine pathservice/Containerfile ## Build container image for the InstructLab PathService
	$(ECHO_PREFIX) printf "  %-12s pathservice/Containerfile\n" "[$(CONTAINER_ENGINE)]"
	$(CMD_PREFIX) $(CONTAINER_ENGINE) build -f pathservice/Containerfile -t quay.io/instructlab-ui/pathservice:$(TAG) .
	$(CMD_PREFIX) $(CONTAINER_ENGINE) tag quay.io/instructlab-ui/pathservice:$(TAG) quay.io/instructlab-ui/pathservice:main
	$(CMD_PREFIX) $(CONTAINER_ENGINE) tag quay.io/instructlab-ui/pathservice:$(TAG) ghcr.io/instructlab/ui/pathservice:main

healthcheck-sidecar-image: validate-container-engine healthcheck-sidecar/Containerfile ## Build container image for the InstructLab Healthcheck-Sidecar
	$(ECHO_PREFIX) printf "  %-12s healthcheck-sidecar/Containerfile\n" "[$(CONTAINER_ENGINE)]"
	$(CMD_PREFIX) $(CONTAINER_ENGINE) build -f healthcheck-sidecar/Containerfile -t quay.io/instructlab-ui/healthcheck-sidecar:$(TAG) healthcheck-sidecar
	$(CMD_PREFIX) $(CONTAINER_ENGINE) tag quay.io/instructlab-ui/healthcheck-sidecar:$(TAG) quay.io/instructlab-ui/healthcheck-sidecar:main
