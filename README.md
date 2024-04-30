# InstructLab Bot UI

This is a [Patternfly](https://www.patternfly.org/get-started/develop/) react deployment for front-ending InstructLab Bot jobs. The framework is based off [patternfloy-react-seed](https://github.com/patternfly/patternfly-react-seed) but upgraded to use the latest React v6+. The data is all read only from redis, via the api-server service.

## Quickstart

- Build the ui and apiserver images and set the `/ui/.env`. That .env file will be copied into the container at build time, it needs to be edited before building the image.

> Note: Since the UI and API server need to be reachable via host networking in this compose file configuration, this needs to be run on Linux since OSX container runtimes are userspace and don't support host networking.

```shell
podman build -f ui/apiserver/Containerfile -t ghcr.io/instructlab/instructlab-bot/apiserver:main .
podman build -f ui/Containerfile -t ghcr.io/instructlab/instructlab-bot/bot-ui:main .
```

- Run the [compose.ui](compose.ui).

## Manually Running the API Server

To start the api server manually, run the following with some example values. The client needs to be able to reach the apiserver. If running in a container and trying to reach the host from a remote site, bind to `--listen-address :3000`. If all connections are local you could use `--listen-address localhost:3000`.

```bash
cd ui/apiserver
go run apiserver.go \
  --redis-server localhost:6379 \
  --listen-address :3000 \
  --api-user kitteh \
  --api-pass floofykittens \
  --debug
```

## Manually Running the React UI

To start the UI manually instead of in a container, set the .env in the ui directory and run the following:

```bash
cd ui/
npm run start:dev
```

## Authentication

Currently, there is no OAuth implementation, this just supports a user/pass defined at runtime. If no `/ui/.env` file is defined, the user/pass is simply admin/password. To change those defaults, create the `/ui/.env` file and fill in the account user/pass with the following. The same applies to the websocket address of the api-server service.

Example [.env](.env.example) file.

```text
IL_UI_ADMIN_USERNAME=admin
IL_UI_ADMIN_PASSWORD=pass
IL_UI_API_SERVER_USERNAME=kitteh
IL_UI_API_SERVER_PASSWORD=floofykittens
IL_UI_API_SERVER_URL=http://<PUBLIC_IP>:3000/jobs
```

## Development Scripts

```bash
# Install development/build dependencies
npm install

# Start the development server
npm run start:dev

# Run a production build (outputs to "dist" dir)
npm run build

# Start the express server (run a production build)
npm run start

# Start storybook component explorer
npm run storybook
```
