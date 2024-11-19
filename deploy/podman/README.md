# Podman deployment

To help support knowledge and skill additions as well as the capabilities to chat with a deployed model, the following Podman files have been included to be used with `podman kube play`.

## Secret

A secret is required to personalize the Instructlab UI.

Two options exist to generate the secret, either using `kubectl` or filling in values in the `secret.yaml` provided.

**NOTE:** It is not required to fill in every field. Double quotes `""` can be used for values that are not used.

### Kubectl secret creation

Using `kubectl`, we will use the `--dry-run -o yaml` flags to generate the secret for us.

```bash
kubectl create secret generic ui-env \
  --from-literal=IL_UI_ADMIN_USERNAME=admin \
  --from-literal=IL_UI_ADMIN_PASSWORD=password \
  --from-literal=OAUTH_GITHUB_ID="" \
  --from-literal=OAUTH_GITHUB_SECRET="" \
  --from-literal=NEXTAUTH_SECRET=your_super_secretdom_string \
  --from-literal=NEXTAUTH_URL=http://localhost:3000 \
  --from-literal=IL_GRANITE_API="" \
  --from-literal=IL_GRANITE_MODEL_NAME="" \
  --from-literal=IL_MERLINITE_API="" \
  --from-literal=IL_MERLINITE_MODEL_NAME="" \
  --from-literal=IL_UI_DEPLOYMENT=dev \
  --from-literal=GITHUB_TOKEN="" \
  --from-literal=TAXONOMY_DOCUMENTS_REPO=github.com/instructlab-public/taxonomy-knowledge-docs \
  --from-literal=NEXT_PUBLIC_AUTHENTICATION_ORG="" \
  --from-literal=NEXT_PUBLIC_TAXONOMY_REPO_OWNER="" \
  --from-literal=NEXT_PUBLIC_TAXONOMY_REPO="" \
  --from-literal=NEXT_PUBLIC_EXPERIMENTAL_FEATURES="false" \
  --from-literal=NEXT_PUBLIC_BASE_CLONE_DIRECTORY="" \
  --from-literal=NEXT_PUBLIC_LOCAL_REPO_PATH="" \
  --dry-run=client -o yaml > secret.yaml
```

### Manual providing values

A file named `secret.yaml` exists to allow for the user to input their values in place. These values must be `base64` encoded.

Here is an example on how to `base64` encode a value.

```bash
echo "password" | base64
```

Using the above fill in the values as it relates to the environment.

## Deploy the secret

Now that the `secret.yaml` has been generated use `podman kube play` to load the secret.

```bash
podman kube play secret.yaml
```

## Launching the UI

Now with the secret in place use `podman kube play` to launch the containers.

```bash
podman kube play instructlab-ui.yaml
```

## Accessing the UI

The Instructlab UI should now be accessible from `http://localhost:3000`
