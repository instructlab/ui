# ╔══════════════════════════════════════════════════════════╗
# ║                Local Development Targets                 ║
# ╚══════════════════════════════════════════════════════════╝

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
