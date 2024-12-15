# Podman deployment

To help support knowledge and skill additions as well as the capabilities to chat with a deployed model, the following Podman files have been included to be used with `podman kube play`. UI stack supports two mode of deployments:

- Github mode: This mode is used to deploy the UI stack with Github integration. Users can create skill and knowledge and push it to the taxonomy repository present in instructlab org or their own personal clone of the taxonomy repository.
- Native mode: This mode is used to deploy the UI stack without Github integration. User created skill and knowledge contributions are local to the machine where UI stack is deployed. Users can publish their contribution to any taxonomy repository present on the machine for data generation or training of the model.

## Secret

A secret is required to personalize the Instructlab UI for both the above mentioned modes.

Two options exist to generate the secret, either using `kubectl` or filling in values in the `secret.yaml` provided.

> [!NOTE]
> It is not required to fill in every field. Double quotes `""` can be used for values that are not used.

### Kubectl secret creation

Using `kubectl`, we will use the `--dry-run -o yaml` flags to generate the secret for us.

#### For Github mode

```bash
cd ./github

kubectl create secret generic ui-env \
  --from-literal=IL_UI_DEPLOYMENT=github \
  --from-literal=OAUTH_GITHUB_ID="" \
  --from-literal=OAUTH_GITHUB_SECRET="" \
  --from-literal=GITHUB_TOKEN="" \
  --from-literal=NEXTAUTH_SECRET=your_super_secretdom_string \
  --from-literal=NEXTAUTH_URL=http://localhost:3000 \
  --from-literal=NEXT_PUBLIC_AUTHENTICATION_ORG="" \
  --from-literal=NEXT_PUBLIC_TAXONOMY_REPO_OWNER="" \
  --from-literal=NEXT_PUBLIC_TAXONOMY_REPO="" \
  --from-literal=NEXT_PUBLIC_TAXONOMY_DOCUMENTS_REPO=github.com/instructlab-public/taxonomy-knowledge-docs \
  --from-literal=NEXT_PUBLIC_EXPERIMENTAL_FEATURES="false" \
  --from-literal=IL_GRANITE_API="" \
  --from-literal=IL_GRANITE_MODEL_NAME="" \
  --from-literal=IL_MERLINITE_API="" \
  --from-literal=IL_MERLINITE_MODEL_NAME="" \
  --from-literal=IL_ENABLE_DEV_MODE=false \
  --dry-run=client -o yaml > secret.yaml
```

#### For Native mode

```bash
cd ./native

kubectl create secret generic ui-env \
  --from-literal=IL_UI_DEPLOYMENT=native \
  --from-literal=IL_UI_ADMIN_USERNAME="" \
  --from-literal=IL_UI_ADMIN_PASSWORD="" \
  --from-literal=NEXTAUTH_SECRET=your_super_secretdom_string \
  --from-literal=NEXTAUTH_URL=http://localhost:3000 \
  --from-literal=NEXT_PUBLIC_TAXONOMY_ROOT_DIR="" \
  --from-literal=NEXT_PUBLIC_EXPERIMENTAL_FEATURES="false" \
  --from-literal=IL_ENABLE_DEV_MODE=false \
  --dry-run=client -o yaml > secret.yaml
```

### Manual providing values

A file named `secret.yaml.example` exists for both the modes. Please rename the file to `secret.yaml`. The user can use this file to input their values in place.These values must be `base64` encoded.

Here is an example on how to `base64` encode a value.

```bash
echo "password" | base64
```

Using the above fill in the values as it relates to the environment.

## Deploy the secret

Now that the `secret.yaml` has been generated, use `podman kube play` to load the secret.

```bash
podman kube play secret.yaml
```

## Launching the UI

Now with the secret in place, use `podman kube play` to launch the containers. If you are deploying the Native mode, please replace the `<TAXONOMY_REPO_ROOT_DIR>` variable in `native/instructlab-ui.yaml` with the absolute path of the directory where the taxonomy repository is present. UI will look for the taxonomy repo in this directory to submit the skill and knowledge contributions.

```bash
podman kube play instructlab-ui.yaml
```

> [!NOTE]
> If you are deploying the UI stack (Native mode) on a rootless Podman and SELinux enabled system, please make sure of the following two issues
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

To clean up the deployment, use `podman kube down` to delete the deployment.

```bash
podman kube down instructlab-ui.yaml
podman kube down secret.yaml
```
