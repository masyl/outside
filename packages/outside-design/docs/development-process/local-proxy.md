# Local Proxy and Port Forwarding

The `outside` development environment uses **Caddy** as a local reverse proxy (`outside-local-proxy` Docker container) to route local development domains (`*.outside.localhost`) to services running inside the track environments.

The proxy leverages **Docker labels** and the Caddy Docker Proxy feature to dynamically route traffic based on the active track's configuration.

## Managing Parallel Environments (Tracks)

When working on multiple concurrent features, you need isolated, sandboxed environments so they don't fight over the same files or Caddy mapping rules.

We use **native OrbStack Linux machines** managed by a Deno CLI to provision this sandboxed isolation.

1. **Opening a Track:**
   Run `deno run -A packages/devside/main.ts track create <slug>` (e.g., `feat-physics`).
   This provisions a lightweight Linux machine in OrbStack and creates a hidden proxy container that registers the exact `feat-physics` slug with Caddy.

2. **Starting the Environment:**
   You can SSH into or connect VSCode directly to your new OrbStack machine.
   It will automatically claim routes like `doc.feat-physics.outside.localhost`.

3. **Closing a Track:**
   When finished, run `deno run -A packages/devside/main.ts track destroy <slug>` to cleanly tear down the machine and the proxy container.

## How the Routing Works Under the Hood

When a track is created via the Deno CLI, it automatically spins up a lightweight Docker container attached to the `outside-proxy` Docker network. The sole purpose of this container is to hold `--label` arguments telling Caddy exactly which traffic to forward to the native OrbStack machine.

An example dynamically generated configuration from the Docker launch in `packages/devside/docker.ts`:

```shell
docker run -d --name outside-proxy-devops \
    --network outside-proxy \
    --label caddy_0=storybook.devops.outside.localhost \
    --label caddy_0.reverse_proxy=devops.orb.local:6007 \
    --label caddy_1=doc.devops.outside.localhost \
    --label caddy_1.reverse_proxy=devops.orb.local:5173 \
    alpine sleep infinity
```

### What the Labels Mean

- `caddy_<X>`: The exact domain to route traffic from (e.g., `doc.devops.outside.localhost`)
- `caddy_<X>.reverse_proxy=<machine-name>.orb.local:<PORT>`: The destination machine and port where the target service is running (e.g., `5173` for Vitepress).
  - Note: `<machine-name>.orb.local` automatically translates to the OrbStack machine's internal network IP.

## Adding a New Subdomain to the Setup

If you create a new package or service and want to access it via a nice local domain, you must update the Deno CLI tool to proxy those ports:

1. **Find the Template file:** Open `packages/devside/docker.ts`.
2. **Locate the Docker Run Arguments:** Find the args array defining the proxy container launch flags.
3. **Add new labels:** Add two new labels for your service. Increment the index number (e.g., if `caddy_1` is the highest, use `caddy_2`).
   ```typescript
   `--label=caddy_2=newapp.${trackName}.outside.localhost`,
   `--label=caddy_2.reverse_proxy=${orbHostname}:3000`, // Replace 3000 with your app's port
   ```
4. **Important Server Notice:** Make sure your dev server (e.g., Vite) is configured to accept external `Host` headers. For example, Vite requires `--host` when running the dev script so it doesn't block Caddy's inbound proxy requests.
