
# InstructLab UI Github mode deployment in Podman

Please follow the below instructions to deploy UI stack with Github mode enabled in Podman.

## Generate Secret

A secret is required to provide required input to the UI stack in a secure way.

Two options exist to generate the secret, either using `kubectl` or filling in values in the `secret.yaml` provided.

### Generate secrets using kubectl

Using `kubectl`, we will use the `--dry-run -o yaml` flags to generate the secret for us.

```bash
cd ./github

kubectl create secret generic ui-env \
  --from-literal=IL_UI_DEPLOYMENT=github \
  --from-literal=OAUTH_GITHUB_ID="<OAUTH_APP_GITHUB_ID>" \
  --from-literal=OAUTH_GITHUB_SECRET="<OAUTH_APP_GITHUB_SECRET>" \
  --from-literal=GITHUB_TOKEN="<GITHUB_PAT_TOKEN>" \
  --from-literal=NEXTAUTH_SECRET=your_super_secret_random_string \
  --from-literal=NEXTAUTH_URL=http://localhost:3000 \
  --from-literal=NEXT_PUBLIC_AUTHENTICATION_ORG="<OAUTH_APP_GITHUB_ID>" \
  --from-literal=NEXT_PUBLIC_TAXONOMY_REPO_OWNER="<GITHUB_TAXONOMY_OWNER_ORG>" \
  --from-literal=NEXT_PUBLIC_TAXONOMY_REPO="<TAXONOMY_REPO_NAME>" \
  --from-literal=NEXT_PUBLIC_EXPERIMENTAL_FEATURES="false" \
  --from-literal=IL_GRANITE_API="" \
  --from-literal=IL_GRANITE_MODEL_NAME="" \
  --from-literal=IL_MERLINITE_API="" \
  --from-literal=IL_MERLINITE_MODEL_NAME="" \
  --from-literal=IL_ENABLE_DEV_MODE=false \
  --dry-run=client -o yaml > secret.yaml
```

Following are the required inputs that you must set for successful deployment of the InstructLab UI in Github mode. Github mode has a prerequisite to setup an OAuth App in the Github under user owned organization. Please follow the github documentation [here](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) to set up a Github OAuth App.

<OAUTH_APP_GITHUB_ID>: OAuth app ID generated after setting up the OAuth Github app.

<OAUTH_APP_GITHUB_SECRET>: OAuth app secret (it needs to be explicitly created once OAuth app is setup)

<GITHUB_TAXONOMY_OWNER_ORG>: Name of the organization under which the user is cloning the [taxonomy](https://github.com/instructlab/taxonomy) repo.

<TAXONOMY_REPO_NAME>: If you rename the [taxonomy](https://github.com/instructlab/taxonomy) repo while cloning it under the organization, please set it to the new name, otherwise use `taxonomy`

<GITHUB_PAT_TOKEN>: Generate a Personal Access Token in your profile that allows read/write access to the organization and the cloned taxonomy repo.

### Generate secrets manually

A file named [secret.yaml.example](secret.yaml.example) present in the [Github](../github/) directory. Please rename the file to `secret.yaml`. The user can use this file to input their values in place. This file is pre-filled with the default values for the non-mandatory input fields, please set the values of the required input fields as mentioned above. These values must be `base64` encoded.

Here is an example on how to `base64` encode a value.

```bash
echo "password" | base64
```

Using the above to fill in all the required input fields.

## Deploy the secret

Now that the `secret.yaml` has been generated, use `podman kube play` to load the secret.

```bash
podman kube play secret.yaml
```

## Deploying the InstructLab UI Stack

 With the secrets in place, use the following command to launch the UI stack containers. [instructlab-ui.yaml](./instructlab-ui.yaml) file is present in the [Github](../github/) directory.

```bash
podman kube play instructlab-ui.yaml
```

Once the UI stack is up and running, all the skill and knowledge contributions will be pushed to the cloned repository present in the user's organization.

## Upstream contributor

If you are playing with Github mode deployment for making upstream contributions to InstructLab UI project, please reach out to the project maintainers in the [InstructLab UI slack channel or Join the Upstream UI Meeting](../../../README.md). Maintainers already have an existing setup in place that upstream contributors can use. They will be able to provide the secrets file that can be used to deploy the UI stack with Github mode in the matters of minutes.

> [!NOTE]
> When you deploy the UI stack on a rootless Podman and SELinux enabled system, please make sure to do the following configurations
>
> 1. Uncomment the `securityContext` in the `instructlab-ui.yaml` file and set the value of `runAsGroup` to the value of the host user's group id.
> `id` command should give you the `gid` of the host user.
>

## Accessing the UI

The Instructlab UI should now be accessible from `http://localhost:3000` or `http://<host-ip>:3000` depending on where the UI stack is deployed.

## Cleaning up

To clean up the deployment, use `podman kube down` to delete the deployment.

```bash
podman kube down instructlab-ui.yaml
podman kube down secret.yaml
```
