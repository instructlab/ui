# InstructLab UI Technical Overview

This is a [NextJS](https://nextjs.org) framework with [Patternfly](https://www.patternfly.org/get-started/develop/) UI library components.

## Manually Running the React UI

Set the .env in the ui directory and run the following:

```bash
cd ui/
npm install
npm run dev
# or for prod
npm run build
npm run start
```

## Other helpful NPM Commands

```bash
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

# Run type checking
npm run type-check

```

## Make scripts

Podman is a requirement. Install and init instructions [here](https://podman.io/docs/installation).

```bash
# Run markdown linter
make md-lint
```

## Deploying the UI stack on your local machine

Set the .env in the ui directory and make sure you uncomment the `IL_UI_DEPLOYMENT=dev`. Once .env file is setup, run the following:

```bash
make start-dev-local
```

This will start the UI and the dependent pathservice locally on the machine.

> [!NOTE]
> It might ask for permission to allow to listen on port 4000.

To stop the the local dev environment run the following:

```bash
make stop-dev-local
```

## Deploying the UI stack in KIND cluster

Set the .env in the ui directory and run the following:

```bash
make start-dev-kind
```

This will start the Kind cluster and deploy the UI stack related manifest files in the cluster.

To stop the Kind cluster and delete the UI stack related resources, run the following:

```bash
make stop-dev-kind
```

Use `make help` to see all the available commands.

## OAuth Configuration

You can either set up the Oauth app in your
[GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
account or use the user/pass defined in `.env`. To change those defaults, create
the `/ui/.env` file and fill in the account user/pass with the following.

Example [.env](../.env.example) file.

## Local Dev Chat Environment

### 1) Using the ilab command line tool

For the chat functionality to work you need a ilab model chat instance. To run this locally:

`cd server`

[https://github.com/instructlab/instructlab?tab=readme-ov-file#-getting-started](https://github.com/instructlab/instructlab?tab=readme-ov-file#-getting-started)

After you use the `ilab serve` command you should have, by default, a chat server instance running on port 8000.

### 2) Using Podman

#### Current issues

- The docker image that runs the server does not utilise Mac Metal GPU and therefore is very slow when answering prompts
- The docker image is very large as it contains the model itself. Potential to have the model incorporated via a docker volume to reduce the size of the actual image.

`docker run -p 8000:8000 aevo987654/instructlab_chat_8000:v2`

This should run a server on port 8000

### Configuring the chat environment to use a local ilab model chat instance

Return to the root of the repo (ui) and run `npm run dev` and visit [http://localhost:3000/playground/endpoints](http://localhost:3000/playground/endpoints).

Click the `Add Endpoint` button and a popup modal will appear.

![enter image description here](../public/dev-local-chat-server/add-endpoint.png)

- URL - add `http://127.0.0.1:8000`
- Model Name - add `merlinite-7b-lab-Q4_K_M.gguf`
- API Key - add some random characters

Click the `Save` button

![enter image description here](../public/dev-local-chat-server/added-endpoint.png)

Go to the chat interface [http://localhost:3000/playground/chat](http://localhost:3000/playground/chat) and select the `merlinite-7b-lab-Q4_K_M.gguf` model.

![enter image description here](../public/dev-local-chat-server/select-the-correct-model.png)

The chat interface should now use the server.

![enter image description here](../public/dev-local-chat-server/successful-chat.png)

### How to Cherry-Pick a Merged PR to `release-1.0`

Until we finish automating releases, you may be asked to cherry-pick your PR after it is merged. Here are instructions for cherry-picking a merged Pull Request to the `release-1.0` branch.

Example:

1. Identify the Commit Hash:

- After a PR is merged, navigate to the `main` branch or the branch where the PR was merged.
- Find the commit(s) related to the PR. You can identify the commit hash from the commit history in the GitHub UI or by using the `git log` command.

   Example:

   ```bash
   git log --oneline
   ```

Copy the commit hash of the PR that you want to cherry-pick.

{:start="2"}
2. Check Out the Release Branch:

- Ensure you are working on the correct release branch (`release-1.0` in this case).

   ```bash
   git checkout release-1.0
   ```

{:start="3"}
3. Create a New Branch:

- Create a new branch based on the `release-1.0` branch for your cherry-pick changes.

   ```bash
   git checkout -b cherry-pick-pr-<PR-number>-release-1.0
   ```

{:start="4"}
4. Cherry-Pick the Commit:

- Use the `git cherry-pick` command to apply the specific commit to your new branch.

   ```bash
   git cherry-pick <commit-hash>
   ```

If there are multiple commits associated with the PR, repeat this command for each commit hash, or use the commit range if they are consecutive:

   ```bash
   git cherry-pick <commit-hash-start>^..<commit-hash-end>
   ```

{:start="5"}
5. Resolve Conflicts (If Any):

- If there are conflicts, Git will pause the cherry-pick process and allow you to resolve them manually.
- After resolving, add the resolved files and continue the cherry-pick process:

   ```bash
   git add <resolved-file>
   git cherry-pick --continue
   ```

   If for some reason you need to abort the cherry-pick, you can use:

   ```bash
   git cherry-pick --abort
   ```

{:start="6"}
6. Push the New Branch:

- After successfully cherry-picking and resolving any conflicts, push your new branch to GitHub.

   ```bash
   git push origin cherry-pick-pr-<PR-number>-release-1.0
   ```

{:start="7"}
7. Create a Pull Request:

- Navigate to your GitHub repository and create a new Pull Request from your cherry-pick branch (`cherry-pick-pr-<PR-number>-release-1.0`) into the `release-1.0` branch.

### How to Run Playwright tests locally

As a developer, you can add more integration (end to end tests) after you develop your feature. We use [playwright](https://playwright.dev/) as the automation test runner for executing integration tests on our app. To execute playwright tests locally run the following command:

```
npm run test:e2e
```

Make sure to export `USERNAME` and `PASSWORD` on your local development environment since we authenticate into the application using the auth credentials provided by the user from process.env variables. For example:

```
export USERNAME=foo
export PASSWORD=***
```

There are some configuration options that you can use while developing tests locally. Following feature flags provide certain functionalities out of the box:

- Use `--trace` flag to on to record a trace during development mode.
- Use `--ui` flag to run tests in UI mode.
- Use `--headed` flag to run tests in headed mode.
- Use `--debug` flag to launch debugging for all tests.
- Use `--last-failed` to run only the tests that failed in the last test run.

In our tests since we want to authenticate into the application, there is a shared account that is used across the tests. This `user.json` is generated on the first test run under `playwright/.auth` folder, and is saved as an  authentication state to apply and reuse across every test as an already authenticated user. 

The configuration for playwright tests is defined in `playwright.config` file and we're running these tests on Chromium, WebKit and Firefox browsers. Playwright will run all projects by default, but you can use the `--project` command line option to run a single project.

If you'd like to run a specific single test, use the following command with the appropriate folder path to your test. Example: `npx playwright test tests/routing.spec.ts`. To get a detailed report of the completed tests, run `npx playwright show-report` and you'll get a detailed view. 