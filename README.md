# InstructLab Bot UI

This is a [Patternfly](https://www.patternfly.org/get-started/develop/) react
deployment for front-ending InstructLab Bot jobs. The framework is based off
[patternfly-react-seed](https://github.com/patternfly/patternfly-react-seed) but
upgraded to use the latest React v6+. The data is all read only from redis, via
the api-server service.

## Quickstart

- Build the ui and apiserver images and set the `/ui/.env`. That .env file will
  be copied into the container at build time, it needs to be edited before
  building the image.

> Note: Since the UI and API server need to be reachable via host networking in
> this compose file configuration, this needs to be run on Linux since OSX
> container runtimes are userspace and don't support host networking.

```shell
podman build -f ui/apiserver/Containerfile -t ghcr.io/instructlab/instructlab-bot/apiserver:main .
podman build -f ui/Containerfile -t ghcr.io/instructlab/instructlab-bot/bot-ui:main .
```

- Run the [compose.ui](compose.ui).

## Manually Running the API Server

To start the api server manually, run the following with some example values.
The client needs to be able to reach the apiserver. If running in a container
and trying to reach the host from a remote site, bind to `--listen-address :3000`.
If all connections are local you could use `--listen-address localhost:3000`.

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

To start the UI manually instead of in a container, set the .env in the ui
directory and run the following:

```bash
cd ui/
npm run dev
# or for prod
npm run build
npm run start
```

## Authentication

You can either set up the Oauth app in your
[GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
account or use the user/pass defined in `.env`. To change those defaults, create
the `/ui/.env` file and fill in the account user/pass with the following. The
same applies to the websocket address of the api-server service.

Example [.env](.env.example) file.

```text
IL_UI_ADMIN_USERNAME=admin
IL_UI_ADMIN_PASSWORD=password
IL_UI_API_SERVER_USERNAME=
IL_UI_API_SERVER_PASSWORD=
IL_UI_API_SERVER_URL=http://<IP>:<PORT>
IL_UI_API_CHAT_URL=http:///<IP>:<PORT>
GITHUB_ID=
GITHUB_SECRET=
NEXTAUTH_SECRET=<super_secret>
NEXTAUTH_URL=http://<SERVER_ADDRESS>:<PORT>
```

## Development Scripts

```bash
# Install development/build dependencies
npm install

# Start the development server
npm run dev

# Run a production build (outputs to ".next" dir)
npm run build

# Start the Next.js server (run a production build)
npm run start

# Lint the project
npm run lint

# Automatically fix linting issues
npm run lint:fix

# Format code using Prettier
npm run pretty
```

### Summary of Server-Side Rendering and Client-Side Data Handling for Jobs and Chat Routes

We are leveraging Next.js's app router to handle
[server-side rendering](https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering)
(SSR) and client-side data interactions for both jobs and chat functionalities.
Below is a summary of how we manage server-side rendering and client-side data
handling for these routes.

#### Server-Side Rendering (SSR)

**API Routes**:

- We have dedicated API routes for both jobs and chat functionalities that
  handle data fetching from the backend. These routes ensure that the data is
  sourced from the server.
- The API routes use environment variables to authenticate and interact with the
  backend services securely.

**Server Components**:

- Components within the `app` directory are treated as server components by
  default. These components handle the initial rendering on the server side.
- For pages like jobs and chat, the main page components are designed to be
  server components, ensuring that the initial data rendering is performed on
  the server.

#### Client-Side Data Handling

**Client Components**:

- Components that utilize client-side hooks (`useState`, `useEffect`, `useRef`,
  etc.) are explicitly marked with `'use client'` to indicate they should be
  executed on the client side.
- These components are responsible for interacting with the API routes to fetch
  and update data dynamically after the initial server-side rendering.

**Custom Hooks**:

- Custom hooks, such as `useFetchJobs` and `usePostChat`, encapsulate the logic
  for API interactions. These hooks handle the state management and side effects
  associated with fetching or posting data.
- By using these hooks, we maintain a clean separation of concerns, keeping the
  components focused on rendering and user interaction.

#### Jobs Functionality

- **API Route**: The jobs API route fetches job data from the backend and
  provides it to the front-end components.
- **Server Component**: The jobs page component fetches the job data server-side
  during the initial render.
- **Client Component**: The jobs list component, marked as a client component,
  uses the `useFetchJobs` hook to handle dynamic data fetching and updating in
  real-time.

#### Chat Functionality

- **API Route**: The chat API route handles posting chat messages to the backend
  and retrieving responses.
- **Server Component**: The chat page component sets up the overall layout and
  structure, rendered server-side initially.
- **Client Component**: The chat form component, marked as a client component,
  uses the `usePostChat` hook to handle user interactions, sending messages to
  the API, and displaying responses dynamically.

### Key Points

- **Separation of Concerns**: By distinguishing between server and client
  components, we ensure that server-side rendering is leveraged for the initial
  load, while client-side components manage dynamic data interactions.
- **API Integration**: The use of API routes ensures secure and efficient
  communication between the front-end and back-end services.
- **Custom Hooks**: Encapsulating data fetching and state management logic in
  custom hooks promotes code reusability and maintainability.
- **Explicit Client Components**: Marking components with `'use client'` where
  necessary clarifies their role and ensures correct execution context, avoiding
  common pitfalls in SSR and CSR (client-side rendering) integration.

This setup ensures that our application benefits from the performance advantages
of server-side rendering, while still providing a responsive and dynamic user
experience through client-side interactions.

1. **API Route**: The API route fetches job data from the backend and provides it
   to the client. This is already handled correctly with server-side logic.

2. **Hook for Fetching Jobs**: The `useFetchJobs` hook fetches data from the API.
   This is used within a client component since it utilizes React hooks like
   `useState` and `useEffect`.

3. **Jobs Component**: The `AllJobs` component fetches job data using the
   `useFetchJobs` hook. This component is a client component.

4. **Jobs Page Component**: The `AllJobsPage` component renders the `AllJobs`
   component within the `AppLayout`. This component is a server component to
   leverage SSR.

The same pattern applies to chat calls to the apiserver.
