#!/bin/bash

# Development environment management script for Outside project
# Usage: ./dev.sh [command] [environment]

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVIRONMENTS=("dev" "feature1" "feature2")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Setup functions
setup_network() {
    log "Setting up Docker network..."
    docker network create traefik-proxy 2>/dev/null || true
    success "Docker network ready"
}

setup_dnsmasq() {
    log "Setting up dnsmasq for wildcard DNS..."
    
    # Check if resolver directory exists
    if [[ ! -d "/etc/resolver" ]]; then
        error "/etc/resolver directory does not exist"
        echo "Please run: ./setup-dns.sh"
        exit 1
    fi
    
    # Copy resolver config (requires sudo)
    log "Updating resolver config..."
    sudo cp "$PROJECT_DIR/outside.local.resolver" /etc/resolver/outside.local
    
    # Stop any existing dnsmasq processes
    sudo pkill -f "dnsmasq.*$PROJECT_DIR" 2>/dev/null || true
    
    # Start dnsmasq with sudo to allow binding to port 53
    log "Starting dnsmasq (requires sudo for port 53)..."
    sudo /opt/homebrew/sbin/dnsmasq -C "$PROJECT_DIR/dnsmasq.conf"
    
    sleep 2
    
    # Check if dnsmasq started successfully
    if pgrep -f "dnsmasq.*$PROJECT_DIR" > /dev/null; then
        success "dnsmasq started successfully"
    else
        error "Failed to start dnsmasq. Check if another process is using port 53:"
        sudo lsof -i :53
        exit 1
    fi
}

setup() {
    log "Setting up development environment..."
    
    setup_network
    setup_dnsmasq
    
    success "Setup complete! Try: ./dev.sh start"
}

# Docker Compose commands
start_traefik() {
    log "Starting Traefik reverse proxy..."
    cd "$PROJECT_DIR"
    docker-compose -f docker-compose.traefik.yml up -d
    success "Traefik started"
}

stop_traefik() {
    log "Stopping Traefik reverse proxy..."
    cd "$PROJECT_DIR"
    docker-compose -f docker-compose.traefik.yml down
    success "Traefik stopped"
}

start_env() {
    local env=$1
    if [[ ! " ${ENVIRONMENTS[@]} " =~ " ${env} " ]]; then
        error "Unknown environment: $env. Available: ${ENVIRONMENTS[*]}"
        exit 1
    fi
    
    log "Starting environment: $env"
    cd "$PROJECT_DIR"
    
    # Start Traefik if not running
    if ! docker ps --format "table {{.Names}}" | grep -q "^traefik$"; then
        start_traefik
    fi
    
    # Start the specific environment
    case $env in
        "dev")
            docker-compose -f docker-compose.traefik.yml -f docker-compose.dev.yml up -d
            success "Development environment started"
            show_urls $env
            ;;
        "feature1")
            docker-compose -f docker-compose.traefik.yml -f docker-compose.feature1.yml up -d
            success "Feature 1 environment started"
            show_urls $env
            ;;
        "feature2")
            docker-compose -f docker-compose.traefik.yml -f docker-compose.feature2.yml up -d
            success "Feature 2 environment started"
            show_urls $env
            ;;
    esac
}

stop_env() {
    local env=$1
    if [[ ! " ${ENVIRONMENTS[@]} " =~ " ${env} " ]]; then
        error "Unknown environment: $env. Available: ${ENVIRONMENTS[*]}"
        exit 1
    fi
    
    log "Stopping environment: $env"
    cd "$PROJECT_DIR"
    
    case $env in
        "dev")
            docker-compose -f docker-compose.traefik.yml -f docker-compose.dev.yml down
            ;;
        "feature1")
            docker-compose -f docker-compose.traefik.yml -f docker-compose.feature1.yml down
            ;;
        "feature2")
            docker-compose -f docker-compose.traefik.yml -f docker-compose.feature2.yml down
            ;;
    esac
    
    success "Environment $env stopped"
}

show_urls() {
    local env=$1
    echo
    success "Environment URLs:"
    case $env in
        "dev")
            echo "  🌐 Main App:       https://outside.local"
            echo "  🔧 API Server:     https://api.outside.local"
            echo "  📚 Storybook:      https://storybook.outside.local"
            echo "  📊 Traefik Dashboard: https://traefik.outside.local"
            ;;
        "feature1")
            echo "  🌐 Main App:       https://feature1.outside.local"
            echo "  🔧 API Server:     https://api.feature1.outside.local"
            echo "  📚 Storybook:      https://storybook.feature1.outside.local"
            ;;
        "feature2")
            echo "  🌐 Main App:       https://feature2.outside.local"
            echo "  🔧 API Server:     https://api.feature2.outside.local"
            echo "  📚 Storybook:      https://storybook.feature2.outside.local"
            ;;
    esac
    echo
}

status() {
    log "Checking status..."
    echo
    
    # Check dnsmasq
    if pgrep -f "dnsmasq.*$PROJECT_DIR" > /dev/null; then
        success "dnsmasq: running"
    else
        warning "dnsmasq: not running"
    fi
    
    # Check Docker containers
    echo
    log "Docker containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}" --filter "name=traefik\|game\|storybook" || echo "No containers running"
    
    echo
    log "Active environments:"
    for env in "${ENVIRONMENTS[@]}"; do
        case $env in
            "dev")
                if docker ps --format "{{.Names}}" | grep -q "game-server-dev\|game-client-dev\|storybook-dev"; then
                    echo "  ✅ dev"
                fi
                ;;
            "feature1")
                if docker ps --format "{{.Names}}" | grep -q "game-server-feature1\|game-client-feature1\|storybook-feature1"; then
                    echo "  ✅ feature1"
                fi
                ;;
            "feature2")
                if docker ps --format "{{.Names}}" | grep -q "game-server-feature2\|game-client-feature2\|storybook-feature2"; then
                    echo "  ✅ feature2"
                fi
                ;;
        esac
    done
    echo
}

logs() {
    local service=$1
    if [[ -z "$service" ]]; then
        log "Showing all environment logs..."
        cd "$PROJECT_DIR"
        docker-compose -f docker-compose.traefik.yml -f docker-compose.dev.yml logs -f
    else
        log "Showing logs for: $service"
        docker logs -f "$service"
    fi
}

# Help function
help() {
    cat << EOF
Outside Development Environment Manager

Usage: ./dev.sh [command] [options]

Commands:
  setup                    Setup the development environment (first-time)
  start [env]             Start specific environment (dev|feature1|feature2)
  stop [env]              Stop specific environment (dev|feature1|feature2)
  start-traefik           Start only Traefik reverse proxy
  stop-traefik            Stop only Traefik reverse proxy
  status                  Show current status
  logs [service]          Show logs (optional: specific service)
  help                    Show this help

Examples:
  ./dev.sh setup                   # First-time setup
  ./dev.sh start dev              # Start main development environment
  ./dev.sh start feature1         # Start feature branch environment
  ./dev.sh stop feature1          # Stop feature branch environment
  ./dev.sh status                 # Check what's running
  ./dev.sh logs game-server-dev   # Show logs for specific service

Environments:
  dev        - Main development branch
  feature1   - First feature branch environment  
  feature2   - Second feature branch environment

URLs:
  Main dev app:      https://outside.local
  Feature 1 app:     https://feature1.outside.local
  Feature 2 app:     https://feature2.outside.local
  Traefik dashboard: https://traefik.outside.local
EOF
}

# Main command router
case "${1:-help}" in
    "setup")
        setup
        ;;
    "start")
        if [[ -z "$2" ]]; then
            error "Please specify an environment: dev, feature1, or feature2"
            exit 1
        fi
        start_env "$2"
        ;;
    "stop")
        if [[ -z "$2" ]]; then
            error "Please specify an environment: dev, feature1, or feature2"
            exit 1
        fi
        stop_env "$2"
        ;;
    "start-traefik")
        start_traefik
        ;;
    "stop-traefik")
        stop_traefik
        ;;
    "status")
        status
        ;;
    "logs")
        logs "$2"
        ;;
    "help"|*)
        help
        ;;
esac