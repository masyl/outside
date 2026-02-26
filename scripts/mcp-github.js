const { spawnSync } = require('child_process');
const { existsSync } = require('fs');
const { join, resolve, dirname } = require('path');

// Try to find the root directory where .env.local lives, looking up to 3 levels up
let projectRoot = process.cwd();
for (let i = 0; i < 3; i++) {
    if (existsSync(join(projectRoot, '.env')) || existsSync(join(projectRoot, '.env.local'))) {
        break;
    }
    projectRoot = dirname(projectRoot);
}

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
