#!/bin/bash

# Manual setup script for resolver directory (requires sudo)

echo "Setting up resolver directory for wildcard DNS..."
echo "This command requires sudo privileges."
echo

# Create resolver directory
echo "Creating /etc/resolver directory..."
sudo mkdir -p /etc/resolver

# Copy the resolver configuration
echo "Copying outside.local resolver configuration..."
sudo cp "$(dirname "$0")/outside.local.resolver" /etc/resolver/outside.local

# Set proper permissions
echo "Setting permissions..."
sudo chmod 644 /etc/resolver/outside.local

# Test DNS resolution
echo "Testing DNS resolution..."
echo "Testing outside.local (should resolve to 127.0.0.1):"
dig outside.local +short

echo
echo "✅ Resolver setup complete!"
echo "You can now run: ./dev.sh setup"