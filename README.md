# InstructLab Bot UI

This is a [Patternfly](https://www.patternfly.org/get-started/develop/) react deployment for front-ending InstructLab Bot jobs. The framework is based off [patternfloy-react-seed](https://github.com/patternfly/patternfly-react-seed) but upgraded to use the latest React v6+. The data is all read only streaming from redis, via the go-streamer service.

## Quickstart

- Start the bot [compose stack](../deploy/compose).
- Start go-streamer on the same host as the redis server since it will be connecting to `localhost:6379` by default, but can be set with `--redis-server`. The same applies to the listening websocket port `--listen-address` which defaults to `localhost:3000`.

```bash
cd ui/go-stream
./go-stream 
```

- Start [webpack](https://github.com/webpack/webpack).

```bash
cd ui/
npm run start:dev
```

## Authentication

Currently, there is no OAuth implementation, this just supports a user/pass defined at runtime. If no `/ui/.env` file is defined, the user/pass is simply admin/password. To change those defaults, create the `/ui/.env` file and fill in the account user/pass with the following.

```text
REACT_APP_ADMIN_USERNAME=<user>
REACT_APP_ADMIN_PASSWORD=<pass>
```

## Development Scripts

```bash
# Install development/build dependencies
npm install

# Start the development server
npm run start:dev

# Run a production build (outputs to "dist" dir)
npm run build

# Start the express server (run a production build first)
npm run start

# Start storybook component explorer
npm run storybook
```
