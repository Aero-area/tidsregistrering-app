#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const isWindows = process.platform === 'win32';
const runner = isWindows ? 'npx.cmd' : 'npx';

const env = { ...process.env };
if (!env.EXPO_PUBLIC_E2E) {
  env.EXPO_PUBLIC_E2E = '1';
}

const result = spawnSync(runner, ['expo', 'export', '-p', 'web'], {
  stdio: 'inherit',
  env,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);