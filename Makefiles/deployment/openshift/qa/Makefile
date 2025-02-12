# ╔══════════════════════════════════════════════════════════╗
# ║             QA Openshift Deployment Targets              ║
# ╚══════════════════════════════════════════════════════════╝
.PHONY: help
help:
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

#################### DEPLOYMENT FUNCTIONS ####################

##@ Openshift QA Deployment - Helper commands for deploying UI stack in Openshift QA cluster

.PHONY: deploy-qa-openshift
deploy-qa-openshift: ## Deploy QA stack of the InstructLab UI on OpenShift
	$(CMD_PREFIX) if [ ! -f $(REPO_ROOT)/.env ]; then \
		echo "Please create a .env file in the root of the project." ; \
		exit 1 ; \
	fi
	$(CMD_PREFIX) yes | cp -f $(REPO_ROOT)/.env $(REPO_ROOT)/deploy/k8s/overlays/openshift/qa/.env
	$(CMD_PREFIX) $(OC) apply -k $(REPO_ROOT)/deploy/k8s/overlays/openshift/qa
	$(CMD_PREFIX) $(OC) wait --for=condition=Ready pods -n $(ILAB_KUBE_NAMESPACE) --all -l app.kubernetes.io/part-of=ui --timeout=15m

.PHONY: redeploy-qa-openshift
redeploy-qa-openshift: ## Redeploy QA stack of the InstructLab UI on OpenShift
	$(CMD_PREFIX) $(OC) -n $(ILAB_KUBE_NAMESPACE) rollout restart deploy/ui
	$(CMD_PREFIX) $(OC) -n $(ILAB_KUBE_NAMESPACE) rollout restart deploy/pathservice

.PHONY: undeploy-qa-openshift
undeploy-qa-openshift: ## Undeploy QA stack of the InstructLab UI on OpenShift
	$(CMD_PREFIX) $(OC) delete -k $(REPO_ROOT)/deploy/k8s/overlays/openshift/qa
	$(CMD_PREFIX) if [ -f $(REPO_ROOT)/deploy/k8s/overlays/openshift/qa/.env ]; then \
		rm $(REPO_ROOT)/deploy/k8s/overlays/openshift/qa/.env ; \
	fi

################# UMAMI DEPLOYMENT FUNCTIONS #################

.PHONY: deploy-umami-qa-openshift
deploy-umami-qa-openshift: ## Deploy Umami stack onto an OpenShift QA cluster
	$(CMD_PREFIX) if [ ! -f $(REPO_ROOT)/.env ]; then \
		echo "Please create a .env file in the root of the project." ; \
		exit 1 ; \
	fi
	$(CMD_PREFIX) $(OC) create namespace $(UMAMI_KUBE_NAMESPACE) --dry-run=client -o yaml | $(OC) apply -f -
	$(CMD_PREFIX) source $(REPO_ROOT)/.env && \
		deploy/k8s/base/umami/deploy-umami-openshift-env-secret-conversion.sh QA_OPENSHIFT $(UMAMI_KUBE_NAMESPACE)
	$(CMD_PREFIX) $(OC) apply -k $(REPO_ROOT)/deploy/k8s/overlays/openshift/umami/qa
	$(CMD_PREFIX) echo "Waiting for Umami Deployment (pods: postgresql and umami) ..."
	$(CMD_PREFIX) $(OC) wait --for=condition=Ready pods -n $(UMAMI_KUBE_NAMESPACE) --all -l app.kubernetes.io/part-of=umami --timeout=15m
	$(CMD_PREFIX) umami_route=$$($(OC) get route umami -n $(UMAMI_KUBE_NAMESPACE) | tail -n 1 | awk '{print $$2}') ; \
	echo "Umami route deployed to: $$umami_route"

.PHONY: undeploy-umami-qa-openshift
undeploy-umami-qa-openshift: ## Undeploy Umami stack from an OpenShift QA cluster
	-$(CMD_PREFIX) $(OC) scale --replicas=0 deployment/umami -n $(UMAMI_KUBE_NAMESPACE)
	-$(CMD_PREFIX) $(OC) delete -k $(REPO_ROOT)/deploy/k8s/overlays/openshift/umami/qa
