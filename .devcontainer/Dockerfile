FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bullseye

# Install Caddy as a Reverse Proxy for Local FQDN Routing
RUN apt-get update && apt-get install -y debian-keyring debian-archive-keyring apt-transport-https \
    && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg \
    && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list \
    && apt-get update \
    && apt-get install -y caddy libcap2-bin \
    && setcap cap_net_bind_service=+ep /usr/bin/caddy \
    && rm -rf /var/lib/apt/lists/*
