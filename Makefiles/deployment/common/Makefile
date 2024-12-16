# ╔══════════════════════════════════════════════════════════╗
# ║                Common Development Targets                ║
# ╚══════════════════════════════════════════════════════════╝

#################### VARIABLE DEFINITIONS ####################

OC := $(shell command -v oc 2>/dev/null || echo kubectl)
UMAMI_KUBE_NAMESPACE?=umami

#################### DEPENDENCY FUNCTIONS ####################

.PHONY: check-kubectl
check-kubectl:
	$(CMD_PREFIX) if ! command -v kubectl >/dev/null 2>&1; then \
		echo "Please install kubectl" ; \
		echo "https://kubernetes.io/docs/tasks/tools/#kubectl" ; \
		exit 1 ; \
	fi

.PHONY: check-yq
check-yq:
	$(CMD_PREFIX) if ! command -v yq >/dev/null 2>&1; then \
		echo "Error: 'yq' is not installed."; \
		echo "Please visit https://github.com/mikefarah/yq#install for installation instructions."; \
		exit 1; \
	fi
