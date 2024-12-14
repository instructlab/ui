# ╔══════════════════════════════════════════════════════════╗
# ║                 Container Build Targets                  ║
# ╚══════════════════════════════════════════════════════════╝

#################### VARIABLE DEFINITIONS ####################

TARGET_IMAGE_ARCH?=amd64
CONTAINER_ENGINE?=docker

#################### VALIDATION FUNCTIONS ####################

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

ui-image: validate-container-engine src/Containerfile ## Build container image for the InstructLab UI
	$(ECHO_PREFIX) printf "  %-12s src/Containerfile\n" "[$(CONTAINER_ENGINE), linux/$(TARGET_IMAGE_ARCH)]"
	$(CMD_PREFIX) $(CONTAINER_ENGINE) build --platform linux/$(TARGET_IMAGE_ARCH) -f src/Containerfile -t quay.io/instructlab-ui/ui:$(TAG) .
	$(CMD_PREFIX) $(CONTAINER_ENGINE) tag quay.io/instructlab-ui/ui:$(TAG) quay.io/instructlab-ui/ui:main

ps-image: validate-container-engine pathservice/Containerfile ## Build container image for the InstructLab PathService
	$(ECHO_PREFIX) printf "  %-12s pathservice/Containerfile\n" "[$(CONTAINER_ENGINE), linux/$(TARGET_IMAGE_ARCH)]"
	$(CMD_PREFIX) $(CONTAINER_ENGINE) build --platform linux/$(TARGET_IMAGE_ARCH) -f pathservice/Containerfile -t quay.io/instructlab-ui/pathservice:$(TAG) .
	$(CMD_PREFIX) $(CONTAINER_ENGINE) tag quay.io/instructlab-ui/pathservice:$(TAG) quay.io/instructlab-ui/pathservice:main
