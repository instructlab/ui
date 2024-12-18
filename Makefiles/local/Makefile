# ╔══════════════════════════════════════════════════════════╗
# ║                Local Development Targets                 ║
# ╚══════════════════════════════════════════════════════════╝

#################### DEPENDENCY FUNCTIONS ####################

.PHONY: check-python3
check-python3:
	$(CMD_PREFIX) if ! command -v python3 >/dev/null 2>&1; then \
		echo "Error: 'python3' is not installed."; \
		echo "Please visit https://www.python.org/downloads/ for installation instructions."; \
		exit 1; \
	fi

#################### DEPLOYMENT FUNCTIONS ####################

.PHONY: start-dev-local
start-dev-local:  ## Start the npm and pathservice local instances
	$(CMD_PREFIX) echo "Starting ui and pathservice..."
	$(CMD_PREFIX) cd $(REPO_ROOT)/pathservice; go run main.go & echo $$! > ../pathservice.pid
	$(CMD_PREFIX) npm run dev & echo $$! > ui.pid
	$(CMD_PREFIX) echo "Development environment started."

.PHONY: stop-dev-local
stop-dev-local:  ## Stop the npm and pathservice local instances
	$(CMD_PREFIX) echo "Stopping ui and pathservice..."
	$(CMD_PREFIX) if [ -f ui.pid ]; then kill -2 `cat ui.pid` && rm ui.pid || echo "Failed to stop ui"; fi
	$(CMD_PREFIX) if [ -f pathservice.pid ]; then kill -2 `cat pathservice.pid` && rm pathservice.pid || echo "Failed to stop pathservice"; fi
	$(CMD_PREFIX) echo "Development environment stopped."

.PHONY: start-healthcheck-sidecar-local
start-healthcheck-sidecar-local: check-python3 ## Start the healthcheck-sidecar local instance
	$(CMD_PREFIX) echo "Starting healthcheck-sidecar..."
	$(CMD_PREFIX) cd healthcheck-sidecar; \
                  python3 -m venv venv; \
                  source venv/bin/activate; \
	              venv/bin/python -m pip install -r requirements.txt; \
	              python sidecar_script.py & echo $$! > healthcheck-sidecar.pid
	$(CMD_PREFIX) echo "Healthcheck-Sidecar started at http://localhost:8080/health."

.PHONY: stop-healthcheck-sidecar-local
stop-healthcheck-sidecar-local:  ## Stop the healtcheck-sidecar local instance
	$(CMD_PREFIX) echo "Stopping healthcheck-sidecar..."
	$(CMD_PREFIX) if [ -f healthcheck-sidecar.pid ]; then kill -2 `cat healthcheck-sidecar.pid` && rm healthcheck-sidecar.pid || echo "Failed to stop healthcheck-sidecar"; fi
	$(CMD_PREFIX) echo "Healthcheck-Sidecar stopped."

.PHONY: start-healthcheck-sidecar-model-server-local
start-healthcheck-sidecar-model-server-local: check-python3 ## Start the healthcheck-sidecar model server instance
	$(CMD_PREFIX) echo "Starting Stubbed model server..."
	$(CMD_PREFIX) cd healthcheck-sidecar; \
                  python3 -m venv venv; \
                  source venv/bin/activate; \
	              venv/bin/python -m pip install -r requirements.txt; \
	              python stubbed_model_server.py & echo $$! > stubbed-model-server.pid
	$(CMD_PREFIX) echo "Stubbed Model Server started at http://localhost:8001, serving `/health` and `/v1/models`."

.PHONY: stop-healthcheck-sidecar-model-server-local
stop-healthcheck-sidecar-model-server-local:  ## Stop the healtcheck-sidecar model server local instance
	$(CMD_PREFIX) echo "Stopping stubbed model server..."
	$(CMD_PREFIX) if [ -f stubbed-model-server.pid ]; then kill -2 `cat stubbed-model-server.pid` && rm stubbed-model-server.pid || echo "Failed to stop stubbed model server"; fi
	$(CMD_PREFIX) echo "Stubbed Model Server stopped."
