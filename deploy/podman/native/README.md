
# InstructLab UI Native mode deployment in Podman

Please follow the below instructions to deploy UI stack with Native mode enabled in Podman.

## Deploy using the installer (Recommended)

Make a temporary directory and download the installer

```shell
mkdir instructlab-ui
cd instructlab-ui

curl -o ilab-ui-native-installer.sh -fsSL https://raw.githubusercontent.com/instructlab/ui/refs/heads/main/installers/podman/ilab-ui-native-installer.sh
```

Give execution permission to the install

```shell
chmod a+x ilab-ui-native-installer.sh
```

Execute the installer and follow the instructions prompted on the terminal.

If your deployment machine has InstructLab (ilab CLI) setup, either on the host or in python virtual environment, use the following command

```shell
./ilab-ui-native-installer.sh install --username <USERNAME> --password <PASSWORD>

e.g ./ilab-ui-native-installer.sh install --username admin --password passw0rd
```

If your deployment machine don't have InstructLab CLI setup, please clone the taxonomy repo and fire the following command.

```shell
./ilab-ui-native-installer.sh install --username <USERNAME> --password <PASSWORD> --taxonomy-dir <TAXONOMY_DIR>

e.g ./ilab-ui-native-installer.sh install --username admin --password passw0rd --taxonomy-dir /Users/johndoe/instructlab/taxonomy
```

>[!NOTE]
> In the absence of InstructLab CLI, UI won't be able to support the synthetic data generation and fine tuning, but skill and knowledge contribution should work as expected.

If you are deploying the UI stack on a remote machine, please provide the auth url in the input

```shell
./ilab-ui-native-installer.sh install --username <USERNAME> --password <PASSWORD> --taxonomy-dir <TAXONOMY_DIR> --auth-url http://<REMOTE-IP>:3000
```

Please use `--help` to see more options supported by the installer.

## Deploy manually

If you would like to install the UI stack manually, it's a two step process

- Generate the secret file with the required input
- Deploy the UI stack manifest file using podman.

A secret is required to provide required input to the UI stack in a secure way.

There are two options to generate the secret's file, either using `kubectl` or filling in values in the `secret.yaml` provided.

### Generate secrets using kubectl

Using `kubectl`, we will use the `--dry-run -o yaml` flags to generate the secret for us.

```bash
cd ./native

kubectl create secret generic ui-env \
  --from-literal=IL_UI_DEPLOYMENT=native \
  --from-literal=IL_UI_ADMIN_USERNAME="<USERNAME_FOR_LOGIN>" \
  --from-literal=IL_UI_ADMIN_PASSWORD="<PASSWORD_FOR_LOGIN>" \
  --from-literal=NEXTAUTH_SECRET=your_super_secret_random_string \
  --from-literal=NEXTAUTH_URL=http://localhost:3000 \
  --from-literal=NEXT_PUBLIC_TAXONOMY_ROOT_DIR="<TAXONOMY_ROOT_DIR>" \
  --from-literal=NEXT_PUBLIC_EXPERIMENTAL_FEATURES="false" \
  --from-literal=IL_ENABLE_DEV_MODE=false \
  --dry-run=client -o yaml > secret.yaml
```

Following are the required inputs that you must set for successful deployment of the InstructLab UI in native mode.

<USERNAME_FOR_LOGIN>: Set the username you want to use to login to the InstructLab UI
<PASSWORD_FOR_LOGIN>: Set the password you want to use to login to the InstructLab UI
<TAXONOMY_ROOT_DIR>: Absolute path of the parent directory where the taxonomy repo is cloned.

### Generate secrets manually

A file named [secret.yaml.example](secret.yaml.example) present in the [native](../native/) directory. Please rename the file to `secret.yaml`. The user can use this file to input their values in place. This file is pre-filled with the default values for the non-mandatory input fields, please set the values of the required input fields as mentioned above. These values must be `base64` encoded.

Here is an example on how to `base64` encode a value.

```bash
echo "password" | base64
```

Using the above to fill in all the required input fields.

### Deploy the secret

Now that the `secret.yaml` has been generated, use `podman kube play` to load the secret.

```bash
podman kube play secret.yaml
```

### Deploy the InstructLab UI Stack

One last step before you launch the InstructLab UI. A file named [instructlab-ui.yaml](instructlab-ui.yaml) present in the [native](../native/) directory. Search for <TAXONOMY_ROOT_DIR> in the yaml file and replace it with the same value that is used while creating the secret.yaml file. Now with the secret in place and deployment yaml updated, use `podman kube play` to launch the containers. UI will look for the taxonomy repo in this directory to submit the skill and knowledge contributions.

```bash
podman kube play instructlab-ui.yaml
```

> [!NOTE]
> When you deploy the UI stack on a rootless Podman and SELinux enabled system, please make sure to do the following configurations
>
> 1. Uncomment the `securityContext` in the `instructlab-ui.yaml` file and set the value of `runAsGroup` to the value of the host user's group id.
> `id` command should give you the `gid` of the host user.
>
> 2. Make sure cpu and cpusets cgroup controllers are enabled for the user. To check if the cgroup controllers are enabled, run the following command:
> ```cat "/sys/fs/cgroup/user.slice/user-$(id -u).slice/user@$(id -u).service/cgroup.controllers"```
>
> If the output of the above command does not contain `cpu` and `cpuset`, then you need to enable these cgroup controllers for the user. To enable these cgroup controllers, create the following file `/etc/systemd/system/user@.service.d/delegate.conf` with the following content:
>
>```[Service]
> Delegate=memory pids cpu cpuset```
> Save the file and run `sudo systemctl daemon-reload` followed by `sudo systemctl restart user@$(id -u).service` to apply the changes.

## Accessing the UI

The Instructlab UI should now be accessible from `http://localhost:3000` or `http://<host-ip>:3000` depending on where the UI stack is deployed.

## Cleaning up

If you used installer to install the UI stack, fire the following command

```shell
./ilab-ui-native-installer.sh uninstall
```

To clean up the deployment, use `podman kube down` to delete the deployment.

```bash
podman kube down instructlab-ui.yaml
podman kube down secret.yaml
```
