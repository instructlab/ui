# Umami metrics

Umami is an open-source, privacy-focused web analytics tool that serves as an alternative to Google Analytics. It provides essential insights into website traffic,
user behavior, and performance, all while prioritizing data privacy. We chose to use Umami as our perfered method of metrics collection and visualisation due to
ability to support for self-hosted deployments, open-source nature, and ease of use. Check out [their docs](https://umami.is/docs) for more information.

## Deployment

Umami is meant to work with either a `mysql` or `postgresql` DB backend. For now we only provide manifests and options for PostgreSQL,
but if the need arises we will extend this to work with either.

### Required ENV values

To deploy the stack, there are some ENV values you must set. Technically speaking the `UMAMI_APP_SECRET` is not required, because the stack
[will use the `DATABASE_URL` instead](https://github.com/umami-software/umami/blob/master/src/lib/crypto.ts#L6) if an `APP_SECRET` is not provided
but best security practices are to set it.

Also, we have chosen to use `UMAMI_APP_SECRET` in the `.env` file but in the deployment process this gets mapped to `APP_SECRET`. We chose this
pattern because it brings clarity to what the variable does in the context of the `.env` file.

| Variable                | Description                                                               | Example Value                                      |
|-------------------------|---------------------------------------------------------------------------|----------------------------------------------------|
| UMAMI_APP_SECRET        | Used as Hash Salt for the Database                                        | YbSbtb                                             |
| DATABASE_TYPE           | Type of Database to use with Umami. Only `postgresql` currently supported | postgresql                                         |
| UMAMI_DATABASE_NAME     | Name of the database backend for Umami                                    | db-name                                            |
| UMAMI_DATABASE_USER     | Name of the user of the database for Umami                                | db-user                                            |
| UMAMI_DATABASE_PASSWORD | Password for the user of the database for Umami                           | db-pass                                            |
| DATABASE_URL            | The URL the Umami pod will use to access the DB                           | postgresql://db-user:db-pass@umami-db:5432/db-name |

> [!IMPORTANT]
> The `DATABASE_URL` is derrived from the other variables plus the [name of the service](../deploy/k8s/base/umami/postgresql-service.yaml#L4) used in deployment.
> The env variables `UMAMI_DATABASE_NAME`, `UMAMI_DATABASE_USER` and `UMAMI_DATABASE_PASSWORD` get mapped to the environment variables for the container image
> used based the environment.
> For `kind` these are `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD` respectively.
> For `openshift` environment these are `POSTGRESQL_DATABASE`, `POSTGRESQL_NAME` and `POSTGRESQL_PASSWORD` respectively.

Place those required variables in the `.env` file in the root of the repo.

### Deployment Manifest Notes

In the [base deployment mainfest](../deploy/k8s/base/umami/deployment.yaml) the command is provided to the `umami` container to delay its start. This is
because the `umami` container crashloops while it waits for the `postgresql` container to come online. Ideally it woudl use a `livelinessProbe` or
`readinessProbe` but the `umami` container lacks proper networking tools, and there are no endpoints  for `/health` or `/metrics` on that contianer to do
a vanila `curl`. In my testing with this `sleep` there are no crashes, but if your cluster is slower this may restart once or twice. In future we should
create our own image from the `ghcr.io/umami-software/umami:postgresql-latest` and add networking tools to detect if the psql container is up to avoid
annoying restart crashloops.

It should also be noted that deployment times for Umami vary between environment. Deployments to `kind` can sometimes take up to 5 minutes, although
this is certainly unusual. Deployments on `openshift` are typically a bit faster, taking up to 3 minutes at most.

### Make Targets

Make targets are our prefered method of deployment.

This section will cover how the make targets work and how they differ per environment. The umami deployment `make` targets for all 3 environments use a
[conversion script](./deploy/k8s/overlays/kind/umami/umami-secret.yaml) to parse values out of the `.env` file, into their own secret created in the
respective overlay directory (`deploy/k8s/overlays`). These secrets will be ignored in `git` and are not included in their respective `kustomization.yaml`
overlay files - they must be applied indivdually. This is done because for the Ilab-teams hosted deployments ([ui.instructlab.ai](https://ui.instructlab.ai/)
and [qa.ui.instructlab.ai](https://qa.ui.instructlab.ai/)) we want to track those manifests in `git` via an encrypted sealed-secret, but also allow the
deployment to work out of the box for people trying to self-deploy the stack.This creates a straightforward experience for both developers and maintainers.

#### Kind

Pre-requisite: `make setup-kind`
Command: `make deploy-umami-kind`

After your kind cluster has been started (`make setup-kind`), you can use `make deploy-umami-kind`, which will take care of everything.
The umami-secret will be created at path `deploy/k8s/overlays/kind/umami/umami-secret.yaml`, and deploy it, along with the `./deploy/k8s/overlays/kind/umami`
overlay manifests. Finally it will wait for the pods to rollout and then preform portforwarding on port `3001` for the Umami service.

It should be noted that `kind` deployment uses the base manifest's `postgres:15-alpine` database image, with its respective `env` values: `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`.

#### QA

Command: `make deploy-umami-qa-openshift`

This will create the umami-secret at path `deploy/k8s/overlays/openshift/umami/umami-secret.yaml`. This is very similar to the `kind` umami deployment target
except that it will deploy a `route` instead of an ingress.

It should be noted that `qa-openshift` deployment uses the base manifest's `registry.redhat.io/rhel9/postgresql-15:9.5-1733127512` database image, with its respective `env` values: `POSTGRESQL_DATABASE`, `POSTGRESQL_NAME`, and `POSTGRESQL_PASSWORD`.

#### Prod

Command: `make deploy-umami-prod-openshift`

This will use the same secret path as QA `deploy/k8s/overlays/openshift/umami/umami-secret.yaml`. However, instead of applying the secret, it will pipe
that secret to the `kubeseal` binary, which will pass it to the sealed secrets operator deployed in the cluster. If you have a custom namespace or sealed
secrets controller name, make sure to update the `SEALED_SECRETS_CONTROLLER_NAMESPACE` and `SEALED_SECRETS_CONTROLLER_NAME` values at the top of the
[Makefile](../Makefile#L27-28). If successful, this will encrypt the secret to create the
[umami-secret.sealedsecret.yaml](../deploy/k8s/overlays/openshift/umami/umami-secret.sealedsecret.yaml) which can safely get tracked in `git`. Finally,
it will apply the sealed secret and the rest of the manifests.

It should be noted that `prod-openshift` deployment uses the base manifest's `registry.redhat.io/rhel9/postgresql-15:9.5-1733127512` database image, with its respective `env` values: `POSTGRESQL_DATABASE`, `POSTGRESQL_NAME`, and `POSTGRESQL_PASSWORD`.

## Administration

When Umami gets deployed, it will have no configurations. The admin will have to login with the default Umami credentials, setup users and teams for access,
and change the default admin password. For information on how this works, refer to [that section of the Umami docs](https://umami.is/docs/login). Currently
there is no way to apply manifests for operations and configurations like this, so this is a manual process, and would need to be redone if the deployment
goes down.

Once teams and users are properly setup, setup a `site` for each environment we want to deploy. Once created it will provision a script tag to inject
into the typescript code to start tracking metrics.

To access the portal, navigate to the correct endpoint based on your deployment method:
`kind`: `http://umami.localhost:80`
`openshift`: `umami-umami.<cluster_domain>`. You can find the exact value by running: `oc get route umami -n umami -o jsonpath='{.spec.rules[*].host}'`
