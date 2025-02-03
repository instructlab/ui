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
else
    ECHO_PREFIX=@\#
    CMD_PREFIX=
endif

# Pinned container image tags. Check for updates periodically.

APISERVER_VERSION?=$(shell date +%Y.%m.%d)
APISERVER_RELEASE?=$(shell git describe --always --abbrev=6 --exclude qa --exclude prod)
APISERVER_GCFLAGS?=

APISERVER_BUILD_PROFILE?=dev
APISERVER_LDFLAGS:=$(APISERVER_LDFLAGS) -X main.Version=$(APISERVER_VERSION)-$(APISERVER_RELEASE)

CGO_ENABLED?=1
ifeq ($(APISERVER_RACE_DETECTOR),1)
    CGO_ENABLED=1
    APISERVER_BUILD_FLAGS+=-race
endif
ifeq ($(CGO_ENABLED),0)
    APISERVER_LDFLAGS+=-extldflags=-static
endif

OS := $(shell uname -s)

ifeq ($(OS), Darwin)
    TARGET_BIN = dist/apiserver-darwin-amd64 dist/apiserver-darwin-arm64
    TARGET_PACKAGES= dist/packages/apiserver-darwin-amd64.tar.gz dist/packages/apiserver-darwin-arm64.tar.gz
else ifeq ($(OS), Linux)
    TARGET_BIN = dist/apiserver-linux-amd64
    #TARGET_BIN = dist/apiserver-linux-amd64 dist/apiserver-linux-arm64
    TARGET_PACKAGES=dist/packages/apiserver-linux-amd64.tar.gz
    #TARGET_PACKAGES=dist/packages/apiserver-linux-amd64.tar.gz dist/packages/apiserver-linux-arm64.tar.gz
else
    $(error Unsupported OS: $(OS))
endif

##@ Binaries

.PHONY: apiserver
apiserver: dist/apiserver $(TARGET_BIN) ## Build Instructlab UI API server

# Use go list to find all the go files that make up a binary.
APISERVER_DEPS:=  $(shell go list -deps -f '{{if (and .Module (eq .Module.Path "github.com/instructlab/ui/api-server"))}}{{$$dir := .Dir}}{{range .GoFiles}}{{$$dir}}/{{.}} {{end}}{{end}}' ./)

TAG=$(shell git rev-parse HEAD)

dist:
	$(CMD_PREFIX) mkdir -p $@

dist/apiserver: $(APISERVER_DEPS) | dist
	$(ECHO_PREFIX) printf "  %-12s $@\n" "[GO BUILD]"
	$(CMD_PREFIX) CGO_ENABLED=$(CGO_ENABLED) go build $(APISERVER_BUILD_FLAGS) \
		-gcflags="$(APISERVER_GCFLAGS)" -ldflags="$(APISERVER_LDFLAGS)" -o $@ ./

dist/apiserver-%: $(APISERVER_DEPS) | dist
	$(ECHO_PREFIX) printf "  %-12s $@\n" "[GO BUILD]"
	$(CMD_PREFIX) CGO_ENABLED=$(CGO_ENABLED) GOOS=$(word 2,$(subst -, ,$(basename $@))) GOARCH=$(word 3,$(subst -, ,$(basename $@))) \
		go build $(APISERVER_BUILD_FLAGS) -gcflags="$(APISERVER_GCFLAGS)" \
		-ldflags="$(APISERVER_LDFLAGS)" -o $@ ./
dist/packages: $(TARGET_PACKAGES)

dist/packages/%: apiserver
	$(CMD_PREFIX) mkdir -p $(basename $(basename $@))
	$(CMD_PREFIX) cp dist/apiserver-$(subst apiserver-,,$(basename $(basename $(@F)))) $(basename $(basename $@))/ilab-apiserver
	$(CMD_PREFIX) printf "  %-12s dist/packages/$(@F)\n" "[TAR]" ;
	$(CMD_PREFIX) cd dist/packages && tar -czf $(@F) $(basename $(basename $(@F)));

.PHONY: clean
clean: ## clean built binaries
	$(CMD_PREFIX) rm -rf dist
