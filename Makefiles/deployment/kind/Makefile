# ╔══════════════════════════════════════════════════════════╗
# ║                       KIND Targets                       ║
# ╚══════════════════════════════════════════════════════════╝

#################### VARIABLE DEFINITIONS ####################

ILAB_KUBE_CONTEXT?=kind-instructlab-ui
ILAB_KUBE_NAMESPACE?=instructlab
ILAB_KUBE_CLUSTER_NAME?=instructlab-ui

##@ Kind Deployment - Helper commands for deploying UI stack in Kind cluster

#################### VALIDATION FUNCTIONS ####################

.PHONY: check-kind
check-kind:
	$(CMD_PREFIX) if ! command -v kind >/dev/null 2>&1; then \
		echo "Please install kind and then start the kind dev environment." ; \
		echo "https://kind.sigs.k8s.io/" ; \
		exit 1 ; \
	fi

###################### SETUP FUNCTIONS ######################

load-images: validate-container-engine ## Load images onto Kind cluster
	$(CMD_PREFIX) if [ "$(CONTAINER_ENGINE)" == "podman" ]; then \
		echo "Note: Despite being better, podman strugles loading images to kind. Consider using docker for this." ; \
		echo "Loading image: quay.io/instructlab-ui/ui:main ..." ; \
		$(CONTAINER_ENGINE) save -o $(REPO_ROOT)/ui-image.tar quay.io/instructlab-ui/ui:main ; \
		kind load --name $(ILAB_KUBE_CLUSTER_NAME) image-archive $(REPO_ROOT)/ui-image.tar ; \
		rm -f $(REPO_ROOT)/ui-image.tar ; \
		echo "Loading image: quay.io/instructlab-ui/healthcheck-sidecar:main ..." ; \
		$(CONTAINER_ENGINE) save -o $(REPO_ROOT)/healthcheck-sidecar-image.tar quay.io/instructlab-ui/healthcheck-sidecar:main ; \
		kind load --name $(ILAB_KUBE_CLUSTER_NAME) image-archive $(REPO_ROOT)/healthcheck-sidecar-image.tar ; \
		rm -f $(REPO_ROOT)/healthcheck-sidecar-image.tar ; \
		echo "Loading image: postgres:15-alpine ..." ; \
		$(CONTAINER_ENGINE) save -o $(REPO_ROOT)/postgresql-15-alpine.tar postgres:15-alpine ; \
		kind load --name $(ILAB_KUBE_CLUSTER_NAME) image-archive $(REPO_ROOT)/postgresql-15-alpine.tar ; \
		rm -f $(REPO_ROOT)/postgresql-15-alpine.tar ; \
	elif [ "$(CONTAINER_ENGINE)" == "docker" ]; then \
		kind load --name $(ILAB_KUBE_CLUSTER_NAME) docker-image quay.io/instructlab-ui/ui:main ; \
		kind load --name $(ILAB_KUBE_CLUSTER_NAME) docker-image quay.io/instructlab-ui/healthcheck-sidecar:main ; \
		kind load --name $(ILAB_KUBE_CLUSTER_NAME) docker-image postgres:15-alpine ; \
	fi;

.PHONY: setup-kind
setup-kind: check-kind check-kubectl stop-dev-kind ## Create a Kind cluster with ingress enabled
	$(CMD_PREFIX) kind create cluster --config $(REPO_ROOT)/deploy/k8s/overlays/kind/kind.yaml
	$(CMD_PREFIX) kubectl cluster-info
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) apply -f $(REPO_ROOT)/deploy/k8s/overlays/kind/kind-ingress.yaml
	$(CMD_PREFIX) $(MAKE) load-images

.PHONY: wait-for-readiness
wait-for-readiness: # Wait for operators to be ready
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) -n ingress-nginx rollout restart deployment ingress-nginx-controller
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) -n ingress-nginx rollout status deployment ingress-nginx-controller --timeout=10m

.PHONY: start-dev-kind ## Run the development environment on Kind cluster
start-dev-kind: setup-kind load-images deploy ## Setup a Kind cluster and deploy InstructLab UI on it

.PHONY: stop-dev-kind
stop-dev-kind: check-kind ## Stop the Kind cluster to destroy the development environment
	$(CMD_PREFIX) kind delete cluster --name $(ILAB_KUBE_CLUSTER_NAME)

#################### DEPLOYMENT FUNCTIONS ####################

.PHONY: deploy
deploy: wait-for-readiness ## Deploy a InstructLab UI development stack onto a kubernetes cluster
	echo $(shell pwd)
	$(CMD_PREFIX) if [ ! -f $(REPO_ROOT)/.env ]; then \
		echo "Please create a .env file in the root of the project." ; \
		exit 1 ; \
	fi
	$(CMD_PREFIX) yes | cp -f $(REPO_ROOT)/.env $(REPO_ROOT)/deploy/k8s/overlays/kind/.env
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) apply -k $(REPO_ROOT)/deploy/k8s/overlays/kind
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) wait --for=condition=Ready pods -n $(ILAB_KUBE_NAMESPACE) --all -l app.kubernetes.io/part-of=ui --timeout=15m

.PHONY: redeploy
redeploy: ui-image load-images ## Redeploy the InstructLab UI stack onto a kubernetes cluster
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) -n $(ILAB_KUBE_NAMESPACE) rollout restart deploy/ui

.PHONY: undeploy
undeploy: ## Undeploy the InstructLab UI stack from a kubernetes cluster
	$(CMD_PREFIX) if [ -f $(REPO_ROOT)/deploy/k8s/overlays/kind/.env ]; then \
		rm $(REPO_ROOT)/deploy/k8s/overlays/kind/.env ; \
	fi
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) delete namespace $(ILAB_KUBE_NAMESPACE)

################# UMAMI DEPLOYMENT FUNCTIONS #################

.PHONY: deploy-umami-kind
deploy-umami-kind: wait-for-readiness load-images
	$(CMD_PREFIX) if [ ! -f $(REPO_ROOT)/.env ]; then \
		echo "Please create a .env file in the root of the project." ; \
		exit 1 ; \
	fi
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) create namespace $(UMAMI_KUBE_NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	$(CMD_PREFIX) bash -c "source$(REPO_ROOT)/.env && \
		deploy/k8s/base/umami/deploy-umami-openshift-env-secret-conversion.sh KIND $(UMAMI_KUBE_NAMESPACE)"
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) apply -k $(REPO_ROOT)/deploy/k8s/overlays/kind/umami
	$(CMD_PREFIX) echo "Waiting for Umami Deployment (pods: postgresql and umami) ..."
	$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) wait --for=condition=Ready pods -n $(UMAMI_KUBE_NAMESPACE) --all -l app.kubernetes.io/part-of=umami --timeout=15m
	$(CMD_PREFIX) umami_ingress=$$(kubectl get ingress umami-ingress -n umami -o jsonpath='{.spec.rules[*].host}') ; \
    echo "Umami ingress deployed to: $$umami_ingress"

.PHONY: undeploy-umami-kind
undeploy-umami-kind:
	-$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) scale --replicas=0 deployment/umami -n $(UMAMI_KUBE_NAMESPACE)
	-$(CMD_PREFIX) kubectl --context=$(ILAB_KUBE_CONTEXT) delete -k $(REPO_ROOT)/deploy/k8s/overlays/kind/umami
