# Docker Configuration for Outside Project

## Quick Start

```bash
# 1. DNS setup (requires sudo for resolver directory)
./setup-dns.sh

# 2. First-time setup
./dev.sh setup

# 3. Start main development environment
./dev.sh start dev

# 4. Start feature branch environments
./dev.sh start feature1
./dev.sh start feature2

# 5. Check status
./dev.sh status
```

## What This Setup Provides

### 🌐 Hostnames (with HTTPS)

- **Main Dev**: `https://outside.local` (app) / `https://api.outside.local` (server)
- **Feature 1**: `https://feature1.outside.local` / `https://api.feature1.outside.local`
- **Feature 2**: `https://feature2.outside.local` / `https://api.feature2.outside.local`
- **Storybook**: `https://storybook.{env}.outside.local`
- **Traefik Dashboard**: `https://traefik.outside.local`

### 🔧 Architecture

- **Traefik v3**: Reverse proxy with automatic HTTPS
- **Docker Compose**: Orchestrate multiple environments
- **dnsmasq**: Wildcard DNS for `*.outside.local` domains
- **mkcert**: Local trusted certificates
- **Environment Isolation**: Each environment runs in separate containers

### 📁 File Structure

```
outside/
├── docker-compose.traefik.yml     # Base Traefik configuration
├── docker-compose.dev.yml          # Main development environment
├── docker-compose.feature1.yml     # Feature branch 1
├── docker-compose.feature2.yml     # Feature branch 2
├── traefik/
│   ├── traefik.yml                 # Traefik main config
│   ├── acme.json                   # Certificate storage
│   └── dynamic/                    # Dynamic configs (future use)
├── dnsmasq.conf                    # DNS configuration
├── outside.local.resolver          # macOS resolver config
├── _wildcard.outside.local+2.pem   # SSL certificate
├── _wildcard.outside.local+2-key.pem # SSL private key
└── dev.sh                         # Management script
```

## Manual DNS Setup (if needed)

If automatic DNS setup doesn't work, run these commands manually:

```bash
# 1. Run the DNS setup script
./setup-dns.sh

# 2. Or manually:
# Create loopback alias (requires sudo)
sudo ifconfig lo0 alias 10.0.0.1 255.255.255.0

# Create resolver directory and copy config (requires sudo)
sudo mkdir -p /etc/resolver
sudo cp outside.local.resolver /etc/resolver/outside.local

# Start dnsmasq manually
/opt/homebrew/sbin/dnsmasq --keep-in-foreground -C dnsmasq.conf -7 /opt/homebrew/etc/dnsmasq.d,\*.conf &

# Make alias persistent (add to /etc/rc.local or login script)
echo "ifconfig lo0 alias 10.0.0.1 255.255.255.0" | sudo tee -a /etc/rc.local
```

## Environment Management

### Starting Environments

```bash
./dev.sh start dev          # Main development
./dev.sh start feature1     # Feature branch 1
./dev.sh start feature2     # Feature branch 2
```

### Stopping Environments

```bash
./dev.sh stop dev           # Stop main dev
./dev.sh stop feature1      # Stop feature 1
./dev.sh stop feature2      # Stop feature 2
```

### Checking Status

```bash
./dev.sh status             # Show all running services
./dev.sh logs               # Show all logs
./dev.sh logs game-server-dev  # Show specific service logs
```

## HTTPS Certificate Notes

The setup uses `mkcert` for local SSL certificates. These are trusted by your local browser automatically.

- **Wildcard Certificate**: Covers `*.outside.local`
- **Valid Until**: April 19, 2028
- **Auto-renewal**: Required manually when expired

## Troubleshooting

### DNS Issues

```bash
# Test DNS resolution
dig outside.local
dig api.outside.local

# Check dnsmasq is running
ps aux | grep dnsmasq

# Restart dnsmasq manually
pkill dnsmasq
/opt/homebrew/sbin/dnsmasq --keep-in-foreground -C dnsmasq.conf &
```

### Docker Issues

```bash
# Check Docker network
docker network ls | grep traefik-proxy

# Recreate network if needed
docker network rm traefik-proxy
docker network create traefik-proxy
```

### HTTPS Issues

```bash
# Check certificate validity
openssl x509 -in _wildcard.outside.local+2.pem -text -noout

# Regenerate certificates
mkcert "*.outside.local" "outside.local" "traefik.outside.local"
```

## Adding New Environments

To add a new environment (e.g., `feature3`):

1. Create `docker-compose.feature3.yml` (copy existing one)
2. Update container names and hostnames in the compose file
3. Add the environment to the `ENVIRONMENTS` array in `dev.sh`
4. Update the `start_env` and `stop_env` functions in `dev.sh`

## Production-like Features

- **HTTPS Everywhere**: All services use HTTPS with valid certificates
- **Standard Ports**: Services run on ports 443/80 like in production
- **Reverse Proxy**: Traefik handles routing, SSL termination
- **Load Balancing**: Ready for scaling (multiple containers per service)
- **Health Checks**: Traefik monitors service health automatically
