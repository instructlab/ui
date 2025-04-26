# Local Install of InstructLab UI

Instructions on how to install the InstructLab UI on your local development machine such as a MacBook or Linux Machine.

## Installation Prerequisites

To run the UI locally `ilab-ui-native-installer.sh` needs to be downloaded:

```bash
mkdir ui-local
cd ui-local
curl -o ilab-ui-native-installer.sh -fsSL https://raw.githubusercontent.com/instructlab/ui/refs/heads/main/installers/podman/ilab-ui-native-installer.sh
chmod a+x ilab-ui-native-installer.sh
```

The UI has two pre-requisites: Podman and InstructLab.

To install these on a Mac run:

```bash
brew install podman
podman machine init
podman machine start
```

On a Linux (Fedora) run:

```bash
dnf install podman
podman machine init
podman machine start
```

For Instructlab installation and initialization run:

```bash
python3.11 -m venv venv
source ./venv/bin/activate
pip install instructlab
ilab config init --non-interactive
```

Developers of Instructlab can use the virtual environments they already have on their systems.

## Starting the UI

Once the ilab is set up, run `ilab-ui-native-installer.sh` with the username and password of your preference to start the UI up.

```bash
./ilab-ui-native-installer.sh install --username admin --password passw0rd!
```

If you want to install the main branch of the UI project, use the following command

```bash
./ilab-ui-native-installer.sh install --username admin --password passw0rd! --deploy main
```

UI Installer does the following:

- Check if InstructLab is set up on the host.
- Extract the taxonomy repository directory path from the InstructLab configuration file
- Download and install the ilab-apiserver binary. It allows the UI to communicate actions to InstructLab and retrieve the results of the commands.
- Generates the secret.yaml file to fill in all the user-provided information and the discovered information securely.
- Download the InstructLab deployment YAML and update the YAML with the required parameters.
- Deploy the secrets and the deployment YAML on the Podman, to set up the UI.

Once the installation is successfully completed, you can log in to the UI at `http://localhost:3000` with the username and password provided to the installer.

A taxonomy is needed to start the UI. Without providing `--taxonomy-dir` to the script the default taxonomy used is the upstream taxonomy in `~/.local/share/instructlab/taxonomy`.

The custom empty taxonomy can be used. The taxonomy must be an initialized git repository.

```bash
mkdir /home/user/ui-local/taxonomy
cd /home/user/ui-local/taxonomy
git config --global init.defaultBranch main
```

```bash
./ilab-ui-native-installer.sh install --username admin --password passw0rd! --taxonomy-dir /home/user/taxonomy
Checking if ilab (InstructLab CLI) is installed natively...

ilab is natively installed on the host.

NOTE: If you are using python virtual environment for InstructLab setup, you can use --python-venv-dir option to skip the discovery.

Seems like ilab is configured on the host. Discover the taxonomy path...

Discovering ilab configured taxonomy on the host...

ilab configured taxonomy repo is detected under the directory - /home/user/.local/share/instructlab/taxonomy

and it's not same as provided by the user - /home/user/ui-local/taxonomy

It's recommended to use the taxonomy repo configured for the ilab CLI.

In case you do not choose ilab configured taxonomy, data generation and fine tune features will not work.

But skill and knowledge contribution features should work as expected.

Please choose the taxonomy repo you would like to use with InstructLab UI:
1. ilab Taxonomy - /home/user/.local/share/instructlab/taxonomy
2. Provided Taxonomy - /home/user/ui-local/taxonomy
Please choose the taxonomy repo you would like to use with InstructLab UI? (1/2): 2
...
```

## Stopping the UI

To stop the UI, the `uninstall` command can be used with the `ilab-ui-native-installer.sh` script.

```bash
./ilab-ui-native-installer.sh uninstall
Are you sure you want to uninstall the InstructLab UI stack? (yes/no): yes
```

## Troubleshooting

If pod startup times out with:

```text
Error: playing YAML file: encountered while bringing up pod ui-pod: initializing source docker://quay.io/instructlab-ui/ui:latest: pinging container registry quay.io: Get "https://quay.io/v2/": dial tcp: lookup quay.io: no such host
```

If Docker compatibility mode is enabled, try disabling it.
