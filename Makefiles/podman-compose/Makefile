
# ╔══════════════════════════════════════════════════════════╗
# ║       Container Runtime Compose Deployment Targets       ║
# ╚══════════════════════════════════════════════════════════╝

.PHONY: help
help:
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

#################### DEPLOYMENT FUNCTIONS ####################

##@ Podman Deployment - Helper commands for deploying UI stack in Podman

.PHONY: validate-podman-container-engine
validate-podman-container-engine: ## Validate the podman container engine in PATH
	$(CMD_PREFIX) CONTAINER_ENGINE=podman $(MAKE) validate-container-engine

.PHONY: stop-dev-native-podman
stop-dev-native-podman: validate-podman-container-engine ## Stop UI Native mode development stack running in podman
	$(CMD_PREFIX) echo "Deleting UI Native mode development stack running in podman..."
	$(CMD_PREFIX) podman kube down $(REPO_ROOT)/deploy/podman/native/instructlab-ui.yaml
	$(CMD_PREFIX) podman kube down $(REPO_ROOT)/deploy/podman/native/secret.yaml
	$(CMD_PREFIX) echo "Development environment for UI Native mode deleted."

.PHONY: start-dev-native-podman
start-dev-native-podman: validate-podman-container-engine ## Start UI Native mode development stack in podman
	$(CMD_PREFIX) echo "Deploying UI Native mode development stack using podman..."
	$(CMD_PREFIX) podman kube play $(REPO_ROOT)/deploy/podman/native/secret.yaml
	$(CMD_PREFIX) podman kube play $(REPO_ROOT)/deploy/podman/native/instructlab-ui.yaml
	$(CMD_PREFIX) echo "Development environment for UI Native mode is started."

.PHONY: stop-dev-github-podman
stop-dev-github-podman: validate-podman-container-engine ## Stop UI Github mode development stack running in podman
	$(CMD_PREFIX) echo "Deleting UI Github mode development stack running in podman..."
	$(CMD_PREFIX) podman kube down $(REPO_ROOT)/deploy/podman/github/instructlab-ui.yaml
	$(CMD_PREFIX) podman kube down $(REPO_ROOT)/deploy/podman/github/secret.yaml
	$(CMD_PREFIX) echo "Development environment for UI Github mode deleted."

.PHONY: start-dev-github-podman
start-dev-github-podman: validate-podman-container-engine ## Start UI Github mode development stack in podman
	$(CMD_PREFIX) podman kube play $(REPO_ROOT)/deploy/podman/github/secret.yaml
	$(CMD_PREFIX) podman kube play $(REPO_ROOT)/deploy/podman/github/instructlab-ui.yaml
	$(CMD_PREFIX) echo "Development environment for UI Github mode is started."
