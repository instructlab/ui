# ╔══════════════════════════════════════════════════════════╗
# ║                   Entrypoint Makefile                    ║
# ╚══════════════════════════════════════════════════════════╝

######################## HELP FUNCTION #######################

.PHONY: help
help: # Display which targets are available to you and what they do
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

####################### BUILD SETTINGS #######################

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

#################### VARIABLE DEFINITIONS ####################

TAG=$(shell git rev-parse HEAD)
REPO_ROOT=$(shell git rev-parse --show-toplevel)
MAKEFLAGS += REPO_ROOT=$(REPO_ROOT) CMD_PREFIX=$(CMD_PREFIX) TAG=$(TAG) ECHO_PREFIX=$(ECHO_PREFIX) PIPE_DEV_NULL=$(PIPE_DEV_NULL)

###################### IMPORT MAKEFILES ######################

include Makefiles/containers-base/Makefile
include Makefiles/podman-compose/Makefile
include Makefiles/deployment/common/Makefile
include Makefiles/deployment/kind/Makefile
include Makefiles/deployment/openshift/prod/Makefile
include Makefiles/deployment/openshift/qa/Makefile
include Makefiles/devcontainer/Makefile
include Makefiles/linting/Makefile
include Makefiles/local/Makefile
