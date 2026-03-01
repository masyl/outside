#!/usr/bin/env node

/**
 * Wrapper for the Github MCP server that loads local environment variables.
 * This ensures that GITHUB_PERSONAL_ACCESS_TOKEN is injected from .env.local 
 * without checking secrets into version control or crashing if the file is missing.
 */
const { spawnSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

const projectRoot = join(process.cwd());

// Safely load env files using native Node > 20.6 loadEnvFile if available
const envLocal = join(projectRoot, '.env.local');
const envRoot = join(projectRoot, '.env');

if (existsSync(envLocal)) {
    process.loadEnvFile(envLocal);
} else if (existsSync(envRoot)) {
    process.loadEnvFile(envRoot);
}

// Spawn the actual GitHub MCP Server natively relying on inherited environment
spawnSync('npx', ['-y', '@modelcontextprotocol/server-github'], {
    stdio: 'inherit',
    env: process.env,
});
