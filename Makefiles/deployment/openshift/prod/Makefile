# ╔══════════════════════════════════════════════════════════╗
# ║         Production Openshift Deployment Targets          ║
# ╚══════════════════════════════════════════════════════════╝

#################### VARIABLE DEFINITIONS ####################

SEALED_SECRETS_CONTROLLER_NAMESPACE=kube-system
SEALED_SECRETS_CONTROLLER_NAME=sealed-secrets-controller

#################### DEPENDENCY FUNCTIONS ####################

.PHONY: check-kubeseal
check-kubeseal: ## Check kubeseal binary is properly installed
	$(CMD_PREFIX) if ! command -v kubeseal >/dev/null 2>&1; then \
		echo "Please install kubeseal" ; \
		echo "https://github.com/bitnami-labs/sealed-secrets?tab=readme-ov-file#kubeseal" ; \
		exit 1 ; \
	fi

.PHONY: check-sealed-secrets-controller
check-sealed-secrets-controller: ## Check sealed-secrets-operater installed in current cluster
	$(CMD_PREFIX) kubectl get deployment ${SEALED_SECRETS_CONTROLLER_NAME} -n ${SEALED_SECRETS_CONTROLLER_NAMESPACE} > /dev/null 2>&1 || { \
		echo "Error: Could not find the Sealed Secrets controller deployment named '${SEALED_SECRETS_CONTROLLER_NAME}' in namespace '${SEALED_SECRETS_CONTROLLER_NAMESPACE}'."; \
		echo "Please update SEALED_SECRETS_CONTROLLER_NAME and SEALED_SECRETS_CONTROLLER_NAMESPACE at the top of the Makefile"; \
		echo "to match your deployment, or see https://github.com/bitnami-labs/sealed-secrets#controller for information on installing it."; \
		exit 1; \
	}

#################### DEPLOYMENT FUNCTIONS ####################

.PHONY: deploy-prod-openshift
deploy-prod-openshift: ## Deploy production stack of the InstructLab UI on OpenShift
	$(CMD_PREFIX) if [ ! -f $(REPO_ROOT)/.env ]; then \
		echo "Please create a .env file in the root of the project." ; \
		exit 1 ; \
	fi
	$(CMD_PREFIX) yes | cp -f $(REPO_ROOT)/.env $(REPO_ROOT)/deploy/k8s/overlays/openshift/prod/.env
	$(CMD_PREFIX) $(OC) apply -k $(REPO_ROOT)/deploy/k8s/overlays/openshift/prod
	$(CMD_PREFIX) $(OC) wait --for=condition=Ready pods -n $(ILAB_KUBE_NAMESPACE) --all -l app.kubernetes.io/part-of=ui --timeout=15m

.PHONY: redeploy-prod-openshift
redeploy-prod-openshift: ## Redeploy production stack of the InstructLab UI on OpenShift
	$(CMD_PREFIX) $(OC) -n $(ILAB_KUBE_NAMESPACE) rollout restart deploy/ui
	$(CMD_PREFIX) $(OC) -n $(ILAB_KUBE_NAMESPACE) rollout restart deploy/pathservice

.PHONY: undeploy-prod-openshift
undeploy-prod-openshift: ## Undeploy production stack of the InstructLab UI on OpenShift
	$(CMD_PREFIX) $(OC) delete -k $(REPO_ROOT)/deploy/k8s/overlays/openshift/prod
	$(CMD_PREFIX) if [ -f $(REPO_ROOT)/deploy/k8s/overlays/openshift/prod/.env ]; then \
		rm $(REPO_ROOT)/deploy/k8s/overlays/openshift/prod/.env ; \
	fi

################# UMAMI DEPLOYMENT FUNCTIONS #################

.PHONY: deploy-umami-prod-openshift
deploy-umami-prod-openshift: check-kubeseal check-sealed-secrets-controller ## Deploy Umami stack onto an OpenShift production cluster
	$(CMD_PREFIX) if [ ! -f $(REPO_ROOT)/.env ]; then \
		echo "Please create a .env file in the root of the project." ; \
		exit 1 ; \
	fi
	$(CMD_PREFIX) $(OC) create namespace $(UMAMI_KUBE_NAMESPACE) --dry-run=client -o yaml | $(OC) apply -f -
	$(CMD_PREFIX) source$(REPO_ROOT)/.env && \
		deploy/k8s/base/umami/deploy-umami-openshift-env-secret-conversion.sh PROD_OPENSHIFT $(UMAMI_KUBE_NAMESPACE)
	$(CMD_PREFIX) cat $(REPO_ROOT)/deploy/k8s/overlays/openshift/umami/prod/umami-secret.yaml | kubeseal \
		--controller-name=${SEALED_SECRETS_CONTROLLER_NAME} \
		--controller-namespace=${SEALED_SECRETS_CONTROLLER_NAMESPACE} \
		--format yaml > $(REPO_ROOT)/deploy/k8s/overlays/openshift/umami/prod/umami-secret.sealedsecret.yaml
	$(CMD_PREFIX) $(OC) apply -k $(REPO_ROOT)/deploy/k8s/overlays/openshift/umami/prod
	$(CMD_PREFIX) echo "Waiting for Umami Deployment (pods: postgresql and umami) ..."
	$(CMD_PREFIX) $(OC) wait --for=condition=Ready pods -n $(UMAMI_KUBE_NAMESPACE) --all -l app.kubernetes.io/part-of=umami --timeout=15m
	$(CMD_PREFIX) umami_route=$$($(OC) get route umami -n $(UMAMI_KUBE_NAMESPACE) | tail -n 1 | awk '{print $$2}') ; \
	echo "Umami route deployed to: $$umami_route"

.PHONY: undeploy-umami-prod-openshift
undeploy-umami-prod-openshift: ## Undeploy Umami stack from an OpenShift production cluster
	-$(CMD_PREFIX) $(OC) scale --replicas=0 deployment/umami -n $(UMAMI_KUBE_NAMESPACE)
	-$(CMD_PREFIX) $(OC) delete -k $(REPO_ROOT)/deploy/k8s/overlays/openshift/umami/prod

