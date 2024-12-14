# ╔══════════════════════════════════════════════════════════╗
# ║                     Linting Targets                      ║
# ╚══════════════════════════════════════════════════════════╝

###################### LINTING FUNCTIONS #####################

md-lint: validate-container-engine ## Lint markdown files
	$(ECHO_PREFIX) printf " "[$(CONTAINER_ENGINE)]" \n %-12s ./...\n" "[MD LINT]"
	$(CMD_PREFIX) $(CONTAINER_ENGINE) run --rm -v $(CURDIR):/workdir docker.io/davidanson/markdownlint-cli2:v0.6.0 > /dev/null

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
