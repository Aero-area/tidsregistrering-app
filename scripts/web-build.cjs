#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function parseEnv(contents) {
  const result = {};
  const lines = contents.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

const isWindows = process.platform === 'win32';
const runner = isWindows ? 'npx.cmd' : 'npx';

const env = { ...process.env };

const envFile = path.resolve(__dirname, '..', '.env.e2e');
if (fs.existsSync(envFile)) {
  const parsed = parseEnv(fs.readFileSync(envFile, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) {
    if (!env[key]) {
      env[key] = value;
    }
  }
}

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