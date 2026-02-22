# Local Proxy and Port Forwarding

The `outside` development environment uses **Caddy** as a local reverse proxy (`outside-local-proxy` Docker container) to route local development domains (`*.outside.localhost`) to services running inside the VS Code Devcontainers.

Because we use Devcontainers, the proxy leverages **Docker labels** and the Caddy Docker Proxy feature to dynamically route traffic based on the active container's configuration.

## Managing Parallel Environments (Tracks)

When working on multiple concurrent features, you need isolated, sandboxed Devcontainers so they don't fight over the same files or Caddy mapping rules.

To solve this, we use the `./scripts/track` executable, which leverages Git Worktrees.

1. **Opening a Track:**
   Run `./scripts/track open <slug>` (e.g., `feat-physics`).
   This creates a branch, puts it in a hidden `.tracks/feat-physics` worktree folder, and dynamically generates a `.devcontainer` that registers the exact `feat-physics` slug with Caddy.

2. **Starting the Environment:**
   Open the `.tracks/<slug>` folder in VS Code and launch its Devcontainer.
   It will automatically claim routes like `doc.feat-physics.outside.localhost`.

3. **Closing a Track:**
   When finished, run `./scripts/track close <slug>` to clean up the worktree and branch.

## How the Routing Works Under the Hood

When a track Devcontainer starts, it runs a command defined in its `devcontainer.json` to attach itself to the `outside-proxy` Docker network. It uses `--label` arguments in the `runArgs` array to tell Caddy exactly which traffic to forward.

An example dynamically generated configuration from `.tracks/devops/.devcontainer/devcontainer.json`:

```json
"runArgs": [
    "--network=outside-proxy",
    "--label=caddy_0=storybook.devops.outside.localhost",
    "--label=caddy_0.reverse_proxy={{upstreams 6007}}",
    "--label=caddy_1=doc.devops.outside.localhost",
    "--label=caddy_1.reverse_proxy={{upstreams 5173}}"
]
```

### What the Labels Mean

- `caddy_<X>`: The exact domain to route traffic from (e.g., `doc.devops.outside.localhost`)
- `caddy_<X>.reverse_proxy={{upstreams <PORT>}}`: The port *inside* the Devcontainer where the target service is running (e.g., `5173` for Vitepress).
  - Note: `{{upstreams <PORT>}}` automatically translates to the Devcontainer's internal IP and the specified port.

## Adding a New Subdomain to the Template

If you create a new package or service and want to access it via a nice local domain, you must update the base template so future tracks receive the mapping:

1. **Find the Template file:** Open the root `.devcontainer/devcontainer.json`.
2. **Locate `runArgs`:** Find the `runArgs` array.
3. **Add new labels:** Add two new labels for your service, using `*.outside.localhost` as the placeholder for the track script to inject the slug later. Increment the index number (e.g., if `caddy_1` is the highest, use `caddy_2`).
   ```json
   "--label=caddy_2=newapp.*.outside.localhost",
   "--label=caddy_2.reverse_proxy={{upstreams 3000}}" // Replace 3000 with your app's port
   ```
4. **Important Server Notice:** Make sure your dev server (e.g., Vite) is configured to accept external `Host` headers. For example, Vite requires `--host` when running the dev script so it doesn't block Caddy's inbound proxy requests.
