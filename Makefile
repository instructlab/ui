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

##@ Artifacts - Command to build and publish artifacts
ui-image: Containerfile ## Build continaer image for the InstructLab UI
	$(ECHO_PREFIX) printf "  %-12s Containerfile\n" "[docker]"
	$(CMD_PREFIX) docker build -f Containerfile -t ghcr.io/instructlab/ui/ui:$(TAG) .
	$(CMD_PREFIX) docker tag ghcr.io/instructlab/ui/ui:$(TAG) ghcr.io/instructlab/ui/ui:main


##@ Kubernetes - kind dev environment
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

.PHONY: load-images
load-images: ## Load images onto kind
	$(CMD_PREFIX) kind load --name $(ILAB_KUBE_CLUSTER_NAME) docker-image ghcr.io/instructlab/ui/ui:main

.PHONY: stop-dev
stop-dev: check-kind ## Stop the kind cluster to destroy the development environment
	$(CMD_PREFIX) kind delete cluster --name $(ILAB_KUBE_CLUSTER_NAME)

.PHONY: setup-kind
setup-kind: check-kind check-kubectl stop-dev ## Create a kind cluster with ingress enabled
	$(CMD_PREFIX) kind create cluster --config ./deploy/k8s/kind.yaml
	$(CMD_PREFIX) kubectl cluster-info
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) apply -f ./deploy/k8s/kind-ingress.yaml

.PHONY: wait-for-readiness
wait-for-readiness: # Wait for operators to be ready
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) -n ingress-nginx rollout restart deployment ingress-nginx-controller
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) -n ingress-nginx rollout status deployment ingress-nginx-controller --timeout=5m

.PHONY: deploy
deploy: wait-for-readiness ## Deploy a InstructLab UI development stack onto a kubernetes cluster
	$(CMD_PREFIX) if [ ! -f .env ]; then \
		echo "Please create a .env file in the root of the project." ; \
		exit 1 ; \
	fi
	$(CMD_PREFIX) yes | cp -rf .env ./deploy/k8s/overlays/kind/.env
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) apply -k ./deploy/k8s/overlays/kind
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) wait --for=condition=Ready pods -n $(ILAB_KUBE_NAMESPACE) --all -l app.kubernetes.io/part-of=ui --timeout=15m

.PHONY: redeploy
redeploy: ui-image load-images ## Redeploy the InstructLab UI stack onto a kubernetes cluster
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) -n $(ILAB_KUBE_NAMESPACE) rollout restart deploy/ui

.PHONY: undeploy
undeploy: ## Undeploy the InstructLab UI stack from a kubernetes cluster
	$(CMD_PREFIX) if [ -f ./deploy/k8s/overlays/kind/.env ]; then \
		rm ./deploy/k8s/overlays/kind/.env ; \
	fi
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) delete namespace $(ILAB_KUBE_NAMESPACE)

.PHONY: start-dev ## Run the development environment on kind
start-dev: setup-kind deploy ## Setup a kind cluster and deploy InstructLab UI on it

##@ OpenShift - UI deployment in OpenShift
.PHONY: deploy-openshift
deploy-openshift: ## Deploy the InstructLab UI on OpenShift
	$(CMD_PREFIX) if [ ! -f .env ]; then \
		echo "Please create a .env file in the root of the project." ; \
		exit 1 ; \
	fi

	$(CMD_PREFIX) yes | cp -rf .env ./deploy/k8s/overlays/openshift/.env
	$(CMD_PREFIX) oc apply -k ./deploy/k8s/overlays/openshift
	$(CMD_PREFIX) oc wait --for=condition=Ready pods -n $(ILAB_KUBE_NAMESPACE) --all -l app.kubernetes.io/part-of=ui --timeout=15m

.PHONY: redeploy-openshift
redeploy-openshift: deploy-openshift ## Redeploy the InstructLab UI on OpenShift

.PHONY: undeploy-openshift
undeploy-openshift: ## Undeploy the InstructLab UI on OpenShift
	$(CMD_PREFIX) oc delete -k ./deploy/k8s/overlays/openshift
	$(CMD_PREFIX) if [ -f ./deploy/k8s/overlays/openshift/.env ]; then \
		rm ./deploy/k8s/overlays/openshift/.env ; \
	fi
