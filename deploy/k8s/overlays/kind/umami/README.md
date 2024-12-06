# Notes

To try to deploy Umami via kind you must first create and apply the manifests 1 directory up. After that, creating umami within kind is very straightforward.
Simply set your `.umami-secret.env` with your values from the template `example.umami-secret.env` in this directory. After this, we need to import the 
container image that we use for the Umami postgresql database.

To do this, we first start by pulling down the image
```bash
PSQL_IMAGE="registry.redhat.io/rhel9/postgresql-15:9.5-1733127512"
docker pull ${PSQL_IMAGE}
```

If you provisioned a default kind cluster, you can load your image onto it as follows: `kind load docker-image ${PSQL_IMAGE}`.
However if you provisioned a kind cluster with the [kind.yaml](../kind.yaml) configuration we provided in the directory above this, then you will need to
specify the name of the cluster as well: `kind load docker-image ${PSQL_IMAGE} --name instructlab-ui`

After that you can apply the Umami manifests: `kustomize build . | kubectl apply -f -`. 
