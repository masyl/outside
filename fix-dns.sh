#!/bin/bash

# Fix DNS configuration

echo "Fixing DNS configuration..."
echo

# Update resolver file
echo "Updating /etc/resolver/outside.local..."
sudo mkdir -p /etc/resolver
sudo cp "$(dirname "$0")/outside.local.resolver" /etc/resolver/outside.local

# Restart dnsmasq
echo "Restarting dnsmasq on port 5333..."
pkill -f "dnsmasq.*outside" || true
/opt/homebrew/sbin/dnsmasq -C "$(dirname "$0")/dnsmasq.conf"

# Restart DNS service
echo "Flushing DNS cache..."
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

echo
echo "✅ DNS configuration fixed!"
echo
echo "Testing DNS resolution..."
echo "Testing outside.local (dig outside.local):"
dig outside.local +short || echo "DNS not working yet"
