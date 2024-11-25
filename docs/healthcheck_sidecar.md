# Healthcheck Sidecar

The healthcheck-sidecar is a simple python based container image to help monitor the model endpoints, to help maintainers identify outages.

## How Does It Work?

The sidecar continually polls the `/health` and `/v1/models` enpdoints on the address stored in the `IL_GRANITE_API` env variable.
It the serves those results to `http://localhost:8080/health`. In this way it can get picked up by other containers in the pod,
or could forward thes datapoints to anywhere in your cluster by backing its deployment with a `service`. Whenever the sidecar can
no longer recieves a `200` status code on either of those endpoints (`/health` and `/v1/models`), it will parse the status data
into a slack notification template and posted to the `SLACK_WEBHOOK_URL`.

You can get a `SLACK_WEBHOOK_URL` for yourself by [creating a slack application](https://api.slack.com/apps/new), installing and
authorizing the app, and then enabling incoming webhooks. This process is a lot easier than it sounds, Slack does a fantastic job
[documenting this process](https://api.slack.com/quickstart), and providing tools such as the
[block kit builder](https://app.slack.com/block-kit-builder) to help you design the message templates, if you want extend them further.

The UI container now has the [healthcheck-probe.sh](../src/healthcheck-probe.sh) built into it. This script will run as a readiness
probe, IE. the UI container will not come online if it determines its dependent model endpoints are down.

## What Does It Require?

The script requires 2 values, `IL_GRANITE_API` and `IL_GRANITE_MODEL_NAME`. These should be set in your `.env` file at the root of the
repo and `source`d into your environment. There is also an optional `SLACK_WEBHOOK_URL` environment variable. If you set the
`SLACK_WEBHOOK_URL` env variable, the healthcheck-sidecar will post to slack channel or user backed by that webhook on `outage` and
`resolution` incidents.

## Building the image

The simplest way to build the image is to use the `make healthcheck-sidecar-image` make target from the root of the repo, or you
can build it from the source:

```bash
podman build  \
    --platform "linux/$(uname -m)" \
    -f healthcheck-sidecar/Containerfile \
    -t quay.io/instructlab-ui/healthcheck-sidecar:main \
    healthcheck-sidecar
```

And you can run the image with:

```bash
podman run \
    --platform "linux/$(uname -m)" \
    -e SLACK_NOTIFICATION_WEBHOOK="$(SLACK_NOTIFICATION_WEBHOOK)" \
    -e IL_GRANITE_API="$(IL_GRANITE_API)" \
    -e IL_GRANITE_MODEL_NAME="$(IL_GRANITE_MODEL_NAME)" \
    --user 1001750000 \
    quay.io/instructlab-ui/healthcheck-sidecar:main
```

You don't have run with user `1001750000`, in fact the default user for the container image is `default`. However in Openshift, it will
run with an ephemeral user in the valid range due to the `restricted-v2` scc. As such I find it helpful to include for testing purposes.

## Local Development

In particular, the process of testing the outage and resolution incidents feature was quite difficult. To expedite development, there
is a [stubbed python model server](../healthcheck-sidecar/stubbed_model_server.py) that is complient with the OpenAI spec, and with
serving runtimes like llamacpp and vllm. You can have either one, or both running at the time, it should not break either script.
Since this script is only meant for debugging purposes, it was not included in the contianer image.

However this process generates a lot of noise in the way of slack messages so if you do want to work with this I suggest you
[comment out the notification publishing logic](../healthcheck-sidecar/sidecar_script.py#L247-254).

We currently do not support this in `kind` for local development at this time. If there is interest we could update the deployments
to support that.

## Prod and QA Deployment

The `kustomization.yaml` files in the Prod and QA overlays both contain 2 patches realted to the healthcheck sidecar. The first
will patch in the `readinessProbe` into the UI container, ensuring that it is dependendnt on the results of the
[healthcheck-probe.sh](../src/healthcheck-probe.sh) script. They next patch the sidecar itself into the UI deployment. Finally,
both Openshift overlay kustomizations also include a reference to the common directory, which will add the healthcheck-sidecar
`service` to the manifest list.

## Testing the Slack Notification Feature

Begin by setting your `SLACK_NOTIFICATION_WEBHOOK`, as the server can run without, just won't report outages.
You can start a stubbed model server at `http://localhost:8001` through the make target: `make start-stubbed-model-server-local`
Make sure to then set your `IL_GRANITE_API` env variable to match that as displayed below.

```bash
export IL_GRANITE_API="http://localhost:8001"
```

> Note:
> You must include the protocal (`http://`) otherwise it will hit the exceptions and not function properly.

Now you can bring up your Healthcheck-Sidecar service, use the `make start-healthcheck-sidecar-local` target.
Once that comes online, it should start polling the stubbed model server. Simply stop the stubbed model server
(`make stop-stubbed-model-server-local`) to simulate an outage. Finally, bringing the stubbed model server
back online will simulate a resolution incident (one more, `make start-stubbed-model-server-local`).

To switch back to the default prod deployment use:

```bash
export IL_GRANITE_API="https://proxy.nexodus.io/chat/granite"
```
