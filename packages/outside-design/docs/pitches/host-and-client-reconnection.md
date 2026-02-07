---
Title: Client Connection Stability
Category: Core
DeliveryLink: /deliveries/2026-01-09-1020-client-reconnection/
---

# Client Connection Stability

## Motivation

When a client disconnects, it should wait and try to reconnect and.

## Solution

- When the connection is lost, show a small modal popup to warn the user.
- The message should read: Connection lost! Trying to reconnect in 4s
- Once reconnected, the client should refresh its state from the host.

## Pre-requisites

- None
