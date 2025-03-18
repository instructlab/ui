#!/bin/bash

set -e

# Colors
green="\033[32m"
red="\033[31m"
blue="\033[34m"
reset="\033[0m"

declare UI_DEPLOYMENT="native"
declare USERNAME
declare PASSWORD
declare USER_TAXONOMY_DIR
declare AUTH_URL="http://localhost:3000"
declare AUTH_SECRET="your_super_secret_random_string"
declare DEV_MODE="false"
declare EXPERIMENTAL_FEATURES=""
declare PYENV_DIR=""
declare API_SERVER_URL=""
declare DEPLOY="released"

BINARY_INSTALL_DIR=./
IS_ILAB_INSTALLED="true"
DISCOVERED_TAXONOMY_DIR=""
SELECTED_TAXONOMY_DIR=""
ILAB_APISERVER_LOG_FILE="ilab-apiserver.log"
DISCOVERED_PYENV_DIR=""

# Usage function
usage() {
	echo -e "${green}Usage: $0 COMMAND [OPTIONS]...${reset}\n"
	echo -e "${green}Installer to install the InstructLab UI in the Native Mode on Podman.${reset}\n"
	echo -e "${green}Commands:${reset}"
	echo -e "${green}  install${reset}         Configures and install the InstructLab UI stack."
	echo -e "${green}  uninstall${reset}       Uninstalls the InstructLab UI stack and removes temporary files.\n"
	echo -e "${green}Options:${reset}"
	echo -e "${green}  --help${reset}          Show this message and exit.\n"
	exit 1
}

usage_install() {
	echo -e "${green}Usage: $0 install [OPTIONS]...${reset}\n"
	echo -e "${green}Installs the InstructLab UI stack in Native mode on Podman.${reset}"
	echo -e "${green}This command installs one binary on the host and few containers on Podman.${reset}\n"
	echo -e "${green}Options:${reset}"
	echo -e "${green}  --username TEXT${reset}              (Required) Set username for authentication."
	echo -e "${green}  --password TEXT${reset}              (Required) Set password for authentication."
	echo -e "${green}  --taxonomy-dir PATH${reset}          (Optional) Path of the taxonomy repo directory."
	echo -e "                                        e.g /var/home/cloud-user/.local/share/instructlab/taxonomy."
	echo -e "${green}  --auth-url URL${reset}               (Optional) Authentication URL. (default: https://localhost:3000)."
	echo -e "${green}  --auth-secret TEXT${reset}           (Optional) Authentication secret."
	echo -e "${green}  --dev-mode ${reset}                  (Optional)Enable development mode. Deploys assistive features for Developers."
	echo -e "${green}  --experimental-features ${reset}     (Optional)Enable experimental features available in Native mode."
	echo -e "                                         Installer auto enable these features if InstructLab is setup on host."
	echo -e "${green}  --python-venv-dir ${reset}           (Optional)Path to the InstructLab Python virtual environment directory."
	echo -e "                                         e.g /var/home/cloud-user/instructlab/venv \n"
	echo -e "${green}  --deploy TEXT${reset}                (Optional)Version of UI to install."
	echo -e "                               \"main\" for deploying latest UI"
	echo -e "                               \"released\" for deploying the latest released version of ui. (Default: released)"
	exit 1
}

usage_uninstall() {
	echo -e "${green}Usage: $0 uninstall [OPTIONS]...${reset}\n"
	echo -e "${green}Uninstalls the InstructLab UI stack and removes temporary files downloaded during installation.${reset}\n"
	echo -e "${green}Options:${reset}"
	echo -e "${green}  --help${reset}          Show this message and exit.\n"
	exit 1
}

# Check if Podman is installed
check_podman() {
	if ! command -v podman &>/dev/null; then
		echo -e "${red}Podman is not installed!. Podman is mandatory requirement for UI.${reset}\n"
		exit 1
	fi
}

check_git() {
	if ! command -v git &>/dev/null; then
		echo -e "${red}Git is not installed!. Git is mandatory requirement for UI${reset}\n"
		exit 1
	fi
}

# Find host ip address
find_hostip() {
	OS=$(uname -s)

	ip_address=""
	if [ "$OS" == "Darwin" ]; then
		ip_address=$(ipconfig getifaddr en0)
	elif [ "$OS" == "Linux" ]; then
		if command -v ip &>/dev/null; then
			ip_address=$(ip -4 addr show scope global | awk '/inet / {print $2}' | cut -d/ -f1 | head -n 1)
		fi
	else
		echo -e "${red}Unsupported OS: $OS ${reset}"
		exit 1
	fi
	API_SERVER_URL=${ip_address}
}

# Check if the ports required by UI stacks are free
check_ports() {
	ports=(3000 4000 5001 8080)
	for port in "${ports[@]}"; do
		if lsof -i :"$port" &>/dev/null || netstat -an 2>/dev/null | grep -q ":$port "; then
			echo -e "${red}Warning: Port $port is required by the InstructLab UI and it's currently in use.${reset}"
			echo -e "${red}Warning: Please ensure that $port is free before attempting the insatllation again.${reset}"
			exit 1
		fi
	done
}

# Check if UI stack is already running
check_ui_stack() {
	# Check if UI containers are already running
	containers=("ui-pod-ui" "doclingserve-pod-doclingserve" "pathservice-pod-pathservice")

	# Check each container
	for container in "${containers[@]}"; do
		if podman ps --format "{{.Names}}" | grep -q "^$container\$"; then
			echo -e "${red}UI stack container '$container' is already running.${reset}\n"
			echo -e "${red}Please uninstall the UI stack before reinstalling.${reset}\n"
			exit 0
		fi
	done
}

# Verify user provide python environment
verify_user_pyenv() {
	venv_ilab="$PYENV_DIR/bin/ilab"
	if [ ! -e "$venv_ilab" ]; then
		echo -e "${green}Seems like ilab is not installed in the provided virtual environment:$PYENV_DIR${reset}\n"
		read -r -p "Do you want to discover the existing ilab installation on the host? (yes/no): " CONFIRM
		if [[ "$CONFIRM" == "yes" || "$CONFIRM" == "y" ]]; then
			discover_ilab
			if [[ "$DISCOVERED_PYENV_DIR" != "" ]]; then
				PYENV_DIR="$DISCOVERED_PYENV_DIR"
				return
			fi
		fi
		IS_ILAB_INSTALLED="false"
	fi
}

# Check if the ilab set up exist, the taxonomy location is configured is same as user provided
verify_user_taxonomy() {
	if [[ "$IS_ILAB_INSTALLED" == "true" ]]; then
		echo -e "${green}Seems like ilab is configured on the host. Discover the taxonomy path...${reset}\n"

		discover_taxonomy_path
		if [[ "$DISCOVERED_TAXONOMY_DIR" != "" ]]; then
			if [[ "$USER_TAXONOMY_DIR" != "$DISCOVERED_TAXONOMY_DIR" ]]; then
				echo -e "${red}ilab configured taxonomy repo is detected under the directory - $DISCOVERED_TAXONOMY_DIR${reset}\n"
				echo -e "${red}and it's not same as provided by the user - $USER_TAXONOMY_DIR${reset}\n"
				echo -e "${blue}It's recommended to use the taxonomy repo configured for the ilab CLI.${reset}\n"
				echo -e "${blue}In case you do not choose ilab configured taxonomy, data generation and fine tune features will not work.${reset}\n"
				echo -e "${blue}But skills and knowledge contribution features should work as expected.${reset}\n"
				echo -e "${red}Please choose the taxonomy repo you would like to use with InstructLab UI:${reset}"
				echo -e "${red}1. ilab Taxonomy - $DISCOVERED_TAXONOMY_DIR${reset}"
				echo -e "${red}2. User provided Taxonomy - $USER_TAXONOMY_DIR${reset}"
				read -r -p "Use following taxonomy repo with InstructLab UI (1/2): " CHOICE
				if [[ "$CHOICE" == "1" ]]; then
					SELECTED_TAXONOMY_DIR=$DISCOVERED_TAXONOMY_DIR
				else
					SELECTED_TAXONOMY_DIR=$USER_TAXONOMY_DIR
				fi
			else
				echo -e "${green}User provided taxonomy and the ilab configured taxonomy directory is same.${reset}\n"
			fi
			return
		fi
	fi
	SELECTED_TAXONOMY_DIR=$USER_TAXONOMY_DIR
}

# Check if the selected taxonomy is empty. If not, make sure it's git initialized repository.
check_taxonomy_readiness() {
	local TAXONOMY_DIR="$1"
	# Check if the directory exists
	if [ ! -d "$TAXONOMY_DIR" ]; then
		echo -e "${red}Selected taxonomy repository directory does not exist. Taxonomy repository is a mandatory requirement for UI installation.${reset}\n"
		exit 1
	fi

	# Check if the directory is empty
	if [ -z "$(ls -A "$TAXONOMY_DIR" 2>/dev/null)" ]; then
		echo -e "${red}Selected taxonomy repository directory is empty. Seems like taxonomy repository is not cloned?.${reset}\n"
		exit 1
	fi

	# Check if the directory is a Git repository
	if git -C "$TAXONOMY_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
		echo -e "${green}Selected taxonomy repository directory is properly setup and ready for use.${reset}\n"
	else
		echo -e "${red}Selected taxonomy repository directory is not a git repository. Seems like taxonomy repository is not cloned?.${reset}\n"
		exit 1
	fi
}

# Discover python virtual environments on host
discover_pyenv() {
	echo -e "${green}Discovering python virtual environment present on the host...${reset}\n"
	results=()
	while IFS= read -r line; do
		# Skip paths containing "containers/storage/overlay"
		if [[ "$line" != *"containers/storage/overlay"* ]]; then
			results+=("$line")
		fi
	done < <(find "$HOME" -type d -name "bin" -exec test -f {}/activate \; -print 2>/dev/null)

	# Check if any results were found
	if [ ${#results[@]} -eq 0 ]; then
		echo -e "${red}No python virtual environment found.${reset}\n"
		return
	fi

	# Display results as a numbered list
	echo -e "${green}Following python virtual environments found on the host.${reset}\n"
	echo -e "${green}Select a python virtual environment that is running InstructLab:${reset}"
	echo -e "${green}0. Don't want to use InstructLab set up in python virtual environment${reset}"
	for i in "${!results[@]}"; do
		echo -e "${green}$((i + 1)). $(dirname "${results[i]}")${reset}"
	done

	# Get user selection
	read -r -p "Enter your choice (0-${#results[@]}): " choice

	# Validate input
	if [[ "$choice" =~ ^[0-9]+$ ]] && ((choice >= 1 && choice <= ${#results[@]})); then

		DISCOVERED_PYENV_DIR=$(dirname "${results[choice - 1]}")
	elif [[ "$choice" =~ ^[0-9]+$ ]] && ((choice == 0)); then
		IS_ILAB_INSTALLED="false"
	else
		echo "Invalid choice. Exiting."
		exit 1
	fi
}

# Discover the taxonomy path if ilab is set up on the host
discover_taxonomy_path() {
	echo -e "${green}Discovering ilab configured taxonomy on the host...${reset}\n"
	taxonomy_path=""
	if [[ "$IS_ILAB_INSTALLED" == "true" ]]; then
		if [[ "$PYENV_DIR" == "" && "$DISCOVERED_PYENV_DIR" == "" ]]; then
			taxonomy_path=$(ilab config show 2>/dev/null | grep "taxonomy_path" | head -n 1 | cut -d ':' -f 2 | sed 's/^ *//;s/ *$//' | tr -d '\r\n')
		else
			# Always use discovered python virtual environment,
			venv_ilab="$DISCOVERED_PYENV_DIR/bin/ilab"
			taxonomy_path=$($venv_ilab config show 2>/dev/null | grep "taxonomy_path" | head -n 1 | cut -d ':' -f 2 | sed 's/^ *//;s/ *$//' | tr -d '\r\n')
		fi
	else
		echo -e "${red}ilab is not set up on the host. Skip taxonomy path discovery.${reset}\n"
		return
	fi
	if [[ -n "$taxonomy_path" ]]; then
		DISCOVERED_TAXONOMY_DIR="$taxonomy_path"
	fi
}

discover_ilab() {
	# Check if ilab is installed natively or in the python virtual environment
	echo -e "${green}Cheking if ilab (InstructLab CLI) is installed natively...${reset}\n"
	if ! command -v ilab &>/dev/null; then
		echo -e "${red}ilab (InstructLab) is not installed natively on the host!.${reset}\n"

		discover_pyenv
	else
		echo -e "${green}ilab is natively installed on the host.${reset}\n"
	fi

}

normalize_taxonomy_path() {
	if [[ "$USER_TAXONOMY_DIR" != /* ]]; then
		if ! command -v realpath &>/dev/null; then
			USER_TAXONOMY_DIR=$(realpath "$USER_TAXONOMY_DIR" 2>/dev/null)
		else
			USER_TAXONOMY_DIR="$(cd "$(dirname "$USER_TAXONOMY_DIR")" && pwd)/$(basename "$USER_TAXONOMY_DIR")"
		fi
		echo -e "${blue} Taxonomy path normalized to absolute path $USER_TAXONOMY_DIR${reset}\n"
	fi
}

# Parse input arguments
if [[ $# -lt 1 ]]; then
	usage
fi

COMMAND=$1
shift

if [[ "$COMMAND" == "install" ]]; then
	while [[ $# -gt 0 ]]; do
		case "$1" in
		--username)
			USERNAME="$2"
			shift 2
			;;
		--password)
			PASSWORD="$2"
			shift 2
			;;
		--taxonomy-dir)
			USER_TAXONOMY_DIR=$(echo "$2" | sed 's/^ *//;s/ *$//')
			normalize_taxonomy_path
			shift 2
			;;
		--auth-url)
			AUTH_URL="$2"
			shift 2
			;;
		--auth-secret)
			AUTH_SECRET="$2"
			shift 2
			;;
		--dev-mode)
			DEV_MODE="true"
			shift 2
			;;
		--experimental-features)
			EXPERIMENTAL_FEATURES="true"
			shift 2
			;;
		--python-venv-dir)
			PYENV_DIR=$(echo "$2" | sed 's/^ *//;s/ *$//')
			shift 2
			;;
		--deploy)
			DEPLOY="$2"
			shift 2
			;;
		--help)
			usage_install
			;;
		*)
			usage_install
			;;
		esac
	done

	if [[ -z "$USERNAME" || -z "$PASSWORD" ]]; then
		usage_install
	fi

	check_podman
	check_git
	check_ports
	check_ui_stack

	# Verify user provided python virtual environment
	if [[ -n "$PYENV_DIR" ]]; then
		verify_user_pyenv
	else
		discover_ilab
		if [[ "$DISCOVERED_PYENV_DIR" == "" ]]; then
			IS_ILAB_INSTALLED="false"
		else
			echo -e "\n${blue}NOTE: If you are using python virtual environment for InstructLab setup, you can use --python-venv-dir option to skip the discovery.${reset}\n"
		fi
	fi

	# ilab is not set up and the user didn't provide that taxonomy info as well. Exit with warning info.
	if [[ "$IS_ILAB_INSTALLED" == "false" ]]; then
		if [[ "$USER_TAXONOMY_DIR" == "" ]]; then
			echo -e "${red}Given that ilab is not set up on the host, taxonomy repo is not discovered.${reset}\n"
			echo -e "${red}To proceed with the installation please do one of the following:${reset}"
			echo -e "${red}1. Clone the taxonomy repo and provide the absolute path to the directory using '--taxonomy-dir' option.${reset}"
			echo -e "${red}2. Set up the ilab. If using virtual environment to set up the ilab, use --python-venv-dir option to provide virtual environment directory.${reset}"
			exit 1
		fi
	fi

	if [[ -n "$USER_TAXONOMY_DIR" ]]; then
		verify_user_taxonomy
	else
		discover_taxonomy_path
		if [[ "$DISCOVERED_TAXONOMY_DIR" != "" ]]; then
			SELECTED_TAXONOMY_DIR="$DISCOVERED_TAXONOMY_DIR"
		fi
		echo -e "${blue}NOTE: To skip taxonomy path discovery, you can provide the taxonomy directory path using --taxonomy-dir option ${reset}\n"
	fi

	# ilab is installed but not configured.
	if [[ "$IS_ILAB_INSTALLED" == "true" ]]; then
		if [[ "$DISCOVERED_TAXONOMY_DIR" == "" ]]; then
			echo -e "${red}Seems like ilab is not initialized and configured on the host!.${reset}\n"
			echo -e "${red}If ilab is not initialized, some of the UI features like synthetic data generation and fine tuning will not be available.${reset}\n"
			read -r -p "Are you sure you want to continue with the UI installation? (yes/no): " CONFIRM
			if [[ "$CONFIRM" != "yes" && "$CONFIRM" != "y" ]]; then
				echo -e "${green}Installation aborted. Please initialize and configure ilab and attempt the installation again.${reset}\n"
				exit 1
			fi
			IS_ILAB_INSTALLED="false"
		fi
	fi

	echo -e "${green}Check readiness for taxonomy repository directory : $SELECTED_TAXONOMY_DIR${reset}\n"
	check_taxonomy_readiness "$SELECTED_TAXONOMY_DIR"

	echo -e "${green}Starting InstructLab UI installation...${reset}\n"
	echo -e "${green}InstructLab UI will be set up with taxonomy present in $SELECTED_TAXONOMY_DIR.${reset}\n"

	# Encode credentials in base64
	UI_DEPLOYMENT_B64=$(echo -n "$UI_DEPLOYMENT" | base64)
	USERNAME_B64=$(echo -n "$USERNAME" | base64)
	PASSWORD_B64=$(echo -n "$PASSWORD" | base64)
	taxonomyInPath=$(basename "$SELECTED_TAXONOMY_DIR")
	if [[ "$taxonomyInPath" == "taxonomy" ]]; then
		SELECTED_TAXONOMY_DIR_B64=$(echo -n "$(dirname "$SELECTED_TAXONOMY_DIR")" | base64)
	else
		SELECTED_TAXONOMY_DIR_B64=$(echo -n "$SELECTED_TAXONOMY_DIR" | base64)
	fi

	AUTH_URL_B64=$(echo -n "$AUTH_URL" | base64)
	AUTH_SECRET_B64=$(echo -n "$AUTH_SECRET" | base64)
	DEV_MODE_B64=$(echo -n "$DEV_MODE" | base64)

	if [[ "$EXPERIMENTAL_FEATURES" == "" ]]; then
		if [[ "$IS_ILAB_INSTALLED" == "true" ]]; then
			echo -e "${green}InstructLab is set up on the host, enabling experimental features.${reset}\n"
			EXPERIMENTAL_FEATURES_B64=$(echo -n "true" | base64)
		else
			echo -e "${green}InstructLab is not set up on the host, not enabling experimental features.${reset}\n"
			EXPERIMENTAL_FEATURES_B64=$(echo -n "false" | base64)
		fi
	elif [[ "$EXPERIMENTAL_FEATURES" == "true" ]]; then
		if [[ "$IS_ILAB_INSTALLED" == "true" ]]; then
			echo -e "${green}InstructLab is set up on the host, enabling experimental features.${reset}\n"
		else
			echo -e "${red}InstructLab is not set up on the host, enabling experimental features but they might not work as expected.${reset}\n"

		fi
		EXPERIMENTAL_FEATURES_B64=$(echo -n "true" | base64)
	else
		EXPERIMENTAL_FEATURES_B64=$(echo -n "false" | base64)
	fi

	find_hostip

	API_SERVER_URL_B64=$(echo -n "http://$API_SERVER_URL:8080" | base64)

	# Download secret.yaml file
	echo -e "${green}Downloading the secret.yaml sample file...${reset}\n"
	curl -o secret.yaml https://raw.githubusercontent.com/instructlab/ui/main/deploy/podman/native/secret.yaml.example

	# Detect OS and architecture
	OS=$(uname -s | tr '[:upper:]' '[:lower:]')
	ARCH=$(uname -m)
	BINARY_URL=""

	# Replace placeholders with encoded values
	echo -e "${green}Configuring the secrets for UI stack installation...${reset}\n"
	if [[ "$OS" == "darwin" ]]; then
		sed -i "" "s|<UI_DEPLOYMENT>|$UI_DEPLOYMENT_B64|g" secret.yaml
		sed -i "" "s|<USERNAME>|$USERNAME_B64|g" secret.yaml
		sed -i "" "s|<PASSWORD>|$PASSWORD_B64|g" secret.yaml
		sed -i "" "s|<TAXONOMY_ROOT_DIR>|$SELECTED_TAXONOMY_DIR_B64|g" secret.yaml
		sed -i "" "s|<AUTH_URL>|$AUTH_URL_B64|g" secret.yaml
		sed -i "" "s|<AUTH_SECRET>|$AUTH_SECRET_B64|g" secret.yaml
		sed -i "" "s|<DEV_MODE>|$DEV_MODE_B64|g" secret.yaml
		sed -i "" "s|<EXPERIMENTAL_FEATURES>|$EXPERIMENTAL_FEATURES_B64|g" secret.yaml
		sed -i "" "s|<API_SERVER_URL>|$API_SERVER_URL_B64|g" secret.yaml
	else
		sed -i "s|<UI_DEPLOYMENT>|$UI_DEPLOYMENT_B64|g" secret.yaml
		sed -i "s|<USERNAME>|$USERNAME_B64|g" secret.yaml
		sed -i "s|<PASSWORD>|$PASSWORD_B64|g" secret.yaml
		sed -i "s|<TAXONOMY_ROOT_DIR>|$SELECTED_TAXONOMY_DIR_B64|g" secret.yaml
		sed -i "s|<AUTH_URL>|$AUTH_URL_B64|g" secret.yaml
		sed -i "s|<AUTH_SECRET>|$AUTH_SECRET_B64|g" secret.yaml
		sed -i "s|<DEV_MODE>|$DEV_MODE_B64|g" secret.yaml
		sed -i "s|<EXPERIMENTAL_FEATURES>|$EXPERIMENTAL_FEATURES_B64|g" secret.yaml
		sed -i "s|<API_SERVER_URL>|$API_SERVER_URL_B64|g" secret.yaml
	fi

	if [[ "$IS_ILAB_INSTALLED" == "true" ]]; then
		echo -e "${green}Downloading the api server binary for OS: $OS and ARCH: $ARCH ${reset}\n"
		if [[ "$OS" == "darwin" && "$ARCH" == "x86_64" ]]; then
			BINARY_URL="https://instructlab-ui.s3.us-east-1.amazonaws.com/apiserver/apiserver-darwin-amd64.tar.gz"
		elif [[ "$OS" == "darwin" && "$ARCH" == "arm64" ]]; then
			BINARY_URL="https://instructlab-ui.s3.us-east-1.amazonaws.com/apiserver/apiserver-darwin-arm64.tar.gz"
		elif [[ "$OS" == "linux" && "$ARCH" == "x86_64" ]]; then
			BINARY_URL="https://instructlab-ui.s3.us-east-1.amazonaws.com/apiserver/apiserver-linux-amd64.tar.gz"
		elif [[ "$OS" == "linux" && "$ARCH" == "aarch64" ]]; then
			BINARY_URL="https://instructlab-ui.s3.us-east-1.amazonaws.com/apiserver/apiserver-linux-arm64.tar.gz"
		else
			echo -e "${red}Unsupported OS/Architecture: $OS/$ARCH${reset}\n"
			exit 1
		fi

		# Download the api-server binary
		curl -o apiserver.tar.gz "$BINARY_URL"
		tar -xvzf apiserver.tar.gz -C "$BINARY_INSTALL_DIR" --strip-components 1
		chmod +x ./ilab-apiserver

		echo -e "${green}API server binary is downloaded and configured.${reset}\n"

		# Start the api-server
		if [[ "$OS" == "darwin" ]]; then
			echo -e "${green}Starting API server on OS: $OS running on arch $ARCH ${reset}\n"
			nohup ./ilab-apiserver --base-dir "$DISCOVERED_PYENV_DIR" --taxonomy-path "$SELECTED_TAXONOMY_DIR" --osx --pipeline simple >$ILAB_APISERVER_LOG_FILE 2>&1 &
		else
			CUDA_FLAG=""
			if [ "$(command -v nvcc)" ] && [ -n "$(nvcc --version)" ]; then
				CUDA_FLAG="--cuda"
			fi
			# Check if /etc/os-release exists
			# shellcheck source=/etc/os-release
			# shellcheck disable=SC1091
			source /etc/os-release
			echo "VARIANT_ID: $VARIANT_ID"
			# Check if VARIANT_ID is "rhel_ai"
			if [ "$VARIANT_ID" == "rhel_ai" ]; then
				echo -e "${green}Starting API server on OS: RHEL AI running on arch $ARCH ${reset}\n"
				nohup ./ilab-apiserver --taxonomy-path "$SELECTED_TAXONOMY_DIR" --rhelai --vllm "$CUDA_FLAG" >$ILAB_APISERVER_LOG_FILE 2>&1 &
			else
				echo -e "${green}Starting API server on OS: $OS running on arch $ARCH ${reset}\n"
				nohup ./ilab-apiserver --base-dir "$DISCOVERED_PYENV_DIR" --taxonomy-path "$SELECTED_TAXONOMY_DIR" "$CUDA_FLAG" >$ILAB_APISERVER_LOG_FILE 2>&1 &
			fi

		fi
		echo -e "${green}API server service is started in background. Logs are available in $ILAB_APISERVER_LOG_FILE file.${reset}\n"
	fi

	# Download instructlab-ui.yaml
	echo -e "${green}Downloading the UI stack manifest file (instructlab-ui.yaml)...${reset}\n"
	curl -o instructlab-ui.yaml https://raw.githubusercontent.com/instructlab/ui/main/deploy/podman/native/instructlab-ui.yaml

	# Replace placeholders in instructlab-ui.yaml
	taxonomyInPath=$(basename "$SELECTED_TAXONOMY_DIR")
	if [[ "$taxonomyInPath" == "taxonomy" ]]; then
		if [[ "$OS" == "darwin" ]]; then
			sed -i "" "s|<TAXONOMY_ROOT_DIR>|$(dirname "$SELECTED_TAXONOMY_DIR")|g" instructlab-ui.yaml
		else
			sed -i "s|<TAXONOMY_ROOT_DIR>|$(dirname "$SELECTED_TAXONOMY_DIR")|g" instructlab-ui.yaml
		fi
	else
		if [[ "$OS" == "darwin" ]]; then
			sed -i "" "s|<TAXONOMY_ROOT_DIR>|$SELECTED_TAXONOMY_DIR|g" instructlab-ui.yaml
		else
			sed -i "s|<TAXONOMY_ROOT_DIR>|$SELECTED_TAXONOMY_DIR|g" instructlab-ui.yaml
		fi
	fi

	echo -e "${green}UI stack manifest file (instructlab-ui.yaml) is configured with required parameters${reset}\n"

	# Run Podman commands
	echo -e "${green}Deploying the secrets in Podman...${reset}\n"
	podman kube play secret.yaml

	# Replace image tags in the manifest file
	if [[ "$DEPLOY" == "main" ]]; then
		if [[ "$OS" == "darwin" ]]; then
			sed -i "" "s|<IMAGE_TAG>|main|g" instructlab-ui.yaml
		else
			sed -i "s|<IMAGE_TAG>|main|g" instructlab-ui.yaml
		fi
	else
		if [[ "$OS" == "darwin" ]]; then
			sed -i "" "s|<IMAGE_TAG>|latest|g" instructlab-ui.yaml
		else
			sed -i "s|<IMAGE_TAG>|latest|g" instructlab-ui.yaml
		fi
	fi

	echo -e "\n${green}Deploying the UI stack containers in Podman...${reset}\n"
	podman kube play instructlab-ui.yaml

	# Print running pods
	echo -e "\n${green}Containers deployed for UI stack...${reset}\n"
	podman ps

	echo -e "${green}InstructLab UI is successfully installed. You can access the UI at the following $AUTH_URL${reset}\n"

elif [[ "$COMMAND" == "uninstall" ]]; then
	while [[ $# -gt 0 ]]; do
		case "$1" in
		--help)
			usage_uninstall
			;;
		*)
			usage
			;;
		esac
	done

	read -r -p "Are you sure you want to uninstall the InstructLab UI stack? (yes/no): " CONFIRM
	if [[ "$CONFIRM" != "yes" && "$CONFIRM" != "y" ]]; then
		echo -e "${red}Uninstallation aborted.${reset}\n"
		exit 0
	fi

	check_podman
	echo -e "${green}Uninstalling InstructLab UI stack...${reset}\n"

	if ! command -v podman &>/dev/null; then
		echo -e "${red}Podman is not installed!. are you sure you installed InstructLab UI?${reset}\n"
	else
		# Run Podman commands to uninstall UI containers
		echo -e "${green}Deleting the UI stack containers from Podman...${reset}\n"
		if [ -f "instructlab-ui.yaml" ]; then
			podman kube down instructlab-ui.yaml
		else
			echo -e "${red}instructlab-ui.yaml file does not exist, can't stop the relevant containers (if running). Continuing with cleanup...${reset}\n"
		fi
		echo -e "${green}Deleting the UI stack secrets from Podman...${reset}\n"
		if [ -f "secret.yaml" ]; then
			podman kube down secret.yaml
		else
			echo -e "${red}secret.yaml file does not exist, can't unload the podman secrets. Continuing with cleanup...${reset}\n"
		fi
	fi

	echo -e "${green}Stopping API server (if installed)...${reset}\n"
	pkill -f ilab-apiserver || true
	echo -e "${green}Cleaning up all the downloaded and temporary files${reset}\n"
	rm -f secret.yaml instructlab-ui.yaml apiserver.tar.gz ilab-apiserver*
	echo -e "${green}Uninstallation successfully completed.${reset}\n"
else
	usage
fi
