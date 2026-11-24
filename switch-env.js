#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const IMAGE_NAME = 'aralytics-backend:local';
const DEFAULT_DEV_SECRET = 'dev-only-secret-change-me-in-production-please-0123456789';

const MODES = {
  dev: {
    envFile: '.env',
    exampleFile: '.env.example',
    defaultDb: 'aralytics',
    label: 'dev,seed (testing + Swagger + seeded demo accounts)',
  },
  prod: {
    envFile: '.env.prod',
    exampleFile: '.env.prod.example',
    defaultDb: 'aralytics_prod',
    label: 'prod (schema-only, Swagger disabled, ProductionConfigGuard)',
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: opts.cwd || ROOT_DIR,
    stdio: opts.stdio || 'pipe',
    encoding: 'utf8',
    shell: false,
  });
}

function fail(msg) {
  console.error(`\n[ERROR] ${msg}\n`);
  process.exit(1);
}

function printUsage() {
  console.log(`
Usage:
  node switch-env.js <dev|prod|status|stop> [options]

Commands:
  dev, test   Switch Docker backend to backend/.env (dev,seed -> aralytics DB)
  prod        Switch Docker backend to backend/.env.prod (prod -> aralytics_prod DB)
  status      Show active Docker containers, profile, DB, and API readiness
  stop        Stop backend and postgres containers

Options:
  --reset-db, -r    Drop & recreate ONLY the target mode's DB so Flyway re-runs cleanly
  --build, -b       Force rebuild of the backend Docker image
  --kill-port, -k   Kill any non-Docker host process holding the API port (default 8080)
`);
}

function parseEnvFile(filePath) {
  const vars = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    vars[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return vars;
}

function ensureEnvFile(modeKey) {
  const cfg = MODES[modeKey];
  const envPath = path.join(BACKEND_DIR, cfg.envFile);
  const examplePath = path.join(BACKEND_DIR, cfg.exampleFile);

  if (!fs.existsSync(envPath)) {
    if (!fs.existsSync(examplePath)) {
      fail(`Missing both ${envPath} and template ${examplePath}.`);
    }
    fs.copyFileSync(examplePath, envPath);
    console.log(`[..] Created backend/${cfg.envFile} from ${cfg.exampleFile}`);
  }

  let content = fs.readFileSync(envPath, 'utf8');
  let vars = parseEnvFile(envPath);
  const secret = vars.JWT_SECRET || '';
  if (Buffer.byteLength(secret, 'utf8') < 32 || secret === DEFAULT_DEV_SECRET) {
    const generated = crypto.randomBytes(32).toString('hex');
    if (/^JWT_SECRET=.*$/m.test(content)) {
      content = content.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${generated}`);
    } else {
      content += `\nJWT_SECRET=${generated}\n`;
    }
    fs.writeFileSync(envPath, content, 'utf8');
    vars = parseEnvFile(envPath);
    console.log(`[OK] Generated 64-char JWT_SECRET in backend/${cfg.envFile}`);
  }
  return vars;
}

async function ensureDocker() {
  if (run('docker', ['info']).status === 0) return;

  if (process.platform === 'win32') {
    console.log('[..] Docker daemon not reachable; starting Docker Desktop...');
    run('docker', ['desktop', 'start'], { stdio: 'inherit' });
    for (let i = 0; i < 45; i++) {
      if (run('docker', ['info']).status === 0) {
        console.log('[OK] Docker daemon ready');
        return;
      }
      await sleep(2000);
    }
  }
  fail('Docker daemon is not running. Start Docker Desktop and try again.');
}

function isPortListening(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: 'localhost', port });
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    const doneFalse = () => {
      socket.destroy();
      resolve(false);
    };
    socket.once('timeout', doneFalse);
    socket.once('error', doneFalse);
  });
}

function killHostPort(port) {
  if (process.platform === 'win32') {
    const psCmd = `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }`;
    run('powershell', ['-NoProfile', '-Command', psCmd]);
  } else {
    run('sh', ['-c', `lsof -ti :${port} | xargs kill -9 2>/dev/null || true`]);
  }
}

async function prepareBackendPort(port, killPort) {
  const removed = run('docker', ['rm', '-f', 'aralytics-backend']).status === 0;
  if (removed) {
    // Docker Desktop on Windows can take a brief moment to unbind the forwarded host port after `docker rm -f`.
    for (let i = 0; i < 15; i++) {
      if (!(await isPortListening(port))) return;
      await sleep(200);
    }
  } else if (!(await isPortListening(port))) {
    return;
  }

  if (!killPort) {
    fail(`Port ${port} is held by a non-Docker host process. Stop it or re-run with --kill-port.`);
  }
  console.log(`[..] Stopping host process on port ${port}...`);
  killHostPort(port);
  await sleep(1200);
  if (await isPortListening(port)) {
    fail(`Could not free port ${port}. Stop the process manually and retry.`);
  }
}

async function ensurePostgres(envFile) {
  console.log('[..] Ensuring aralytics-postgres is running...');
  const up = run('docker', ['compose', '--env-file', envFile, 'up', '-d', 'postgres'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
  });
  if (up.status !== 0) fail('Failed to start postgres container.');

  for (let i = 0; i < 30; i++) {
    const inspect = run('docker', ['inspect', '--format', '{{.State.Health.Status}}', 'aralytics-postgres']);
    if (inspect.status === 0 && inspect.stdout.trim() === 'healthy') {
      console.log('[OK] PostgreSQL 16 is healthy');
      return;
    }
    await sleep(2000);
  }
  fail('PostgreSQL container did not become healthy in time.');
}

function ensureDatabase(dbName, dbUser, resetDb) {
  if (!/^[a-zA-Z0-9_]+$/.test(dbName) || !/^[a-zA-Z0-9_]+$/.test(dbUser)) {
    fail(`Invalid database or user identifier: db="${dbName}", user="${dbUser}"`);
  }

  const psqlBase = ['exec', 'aralytics-postgres', 'psql', '-U', dbUser, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'];

  if (resetDb) {
    console.log(`[..] Dropping and recreating database "${dbName}"...`);
    const drop = run('docker', [...psqlBase, '-c', `DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE);`]);
    if (drop.status !== 0) fail(`Failed to drop database "${dbName}": ${drop.stderr}`);
    const create = run('docker', [...psqlBase, '-c', `CREATE DATABASE "${dbName}";`]);
    if (create.status !== 0) fail(`Failed to create database "${dbName}": ${create.stderr}`);
    console.log(`[OK] Database "${dbName}" reset cleanly`);
    return;
  }

  const exists = run('docker', [
    'exec', 'aralytics-postgres', 'psql', '-U', dbUser, '-d', 'postgres', '-tAc',
    `SELECT 1 FROM pg_database WHERE datname='${dbName}'`,
  ]);
  if (exists.stdout.trim() !== '1') {
    console.log(`[..] Creating missing database "${dbName}"...`);
    const create = run('docker', [...psqlBase, '-c', `CREATE DATABASE "${dbName}";`]);
    if (create.status !== 0) fail(`Failed to create database "${dbName}": ${create.stderr}`);
    console.log(`[OK] Created database "${dbName}"`);
  }
}

async function waitForReadiness(port) {
  const url = `http://localhost:${port}/actuator/health/readiness`;
  for (let i = 0; i < 60; i++) {
    const running = run('docker', ['inspect', '--format', '{{.State.Running}}', 'aralytics-backend']);
    if (running.status === 0 && running.stdout.trim() === 'false') {
      const logs = run('docker', ['logs', '--tail', '40', 'aralytics-backend']);
      fail(`aralytics-backend exited during startup:\n${logs.stdout}\n${logs.stderr}`);
    }
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const body = await res.json();
        if (body.status === 'UP') return;
      }
    } catch {
      // still booting
    }
    await sleep(1000);
  }
  fail(`Timed out waiting for ${url} to report UP.`);
}

async function showStatus() {
  await ensureDocker();
  const ps = run('docker', ['ps', '-a', '--filter', 'name=aralytics-', '--format', 'table {{.Names}}\t{{.Status}}\t{{.Ports}}']);
  console.log(ps.stdout.trim() || 'No aralytics containers found.');

  const envInspect = run('docker', ['inspect', '--format', '{{range .Config.Env}}{{println .}}{{end}}', 'aralytics-backend']);
  if (envInspect.status !== 0) return;

  const envMap = {};
  for (const line of envInspect.stdout.split(/\r?\n/)) {
    const eq = line.indexOf('=');
    if (eq > 0) envMap[line.slice(0, eq)] = line.slice(eq + 1);
  }
  const port = Number(envMap.SERVER_PORT || 8080);
  let readiness = 'DOWN';
  try {
    const res = await fetch(`http://localhost:${port}/actuator/health/readiness`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) readiness = (await res.json()).status || 'UNKNOWN';
  } catch {
    readiness = 'UNREACHABLE';
  }

  console.log(`\nActive profile : ${envMap.SPRING_PROFILES_ACTIVE || '(default)'}`);
  console.log(`Database URL   : ${envMap.DB_URL || '(unknown)'}`);
  console.log(`Readiness      : ${readiness} (http://localhost:${port}/actuator/health/readiness)`);
}

async function switchMode(modeKey, opts) {
  const cfg = MODES[modeKey];
  await ensureDocker();
  const vars = ensureEnvFile(modeKey);
  const port = Number(vars.SERVER_PORT || 8080);
  const dbName = vars.DB_NAME || cfg.defaultDb;
  const dbUser = vars.DB_USERNAME || 'postgres';

  await prepareBackendPort(port, opts.killPort);
  await ensurePostgres(cfg.envFile);
  ensureDatabase(dbName, dbUser, opts.resetDb);

  const hasImage = run('docker', ['image', 'inspect', IMAGE_NAME]).status === 0;
  const needBuild = opts.build || !hasImage;
  if (needBuild) {
    console.log(`[..] Building ${IMAGE_NAME} Docker image...`);
  }
  console.log(`[..] Starting aralytics-backend in ${modeKey.toUpperCase()} mode (${cfg.envFile} -> ${dbName})...`);

  const composeArgs = ['compose', '--env-file', cfg.envFile, 'up', '-d', ...(needBuild ? ['--build'] : []), 'backend'];
  const up = run('docker', composeArgs, { cwd: BACKEND_DIR, stdio: 'inherit' });
  if (up.status !== 0) fail('docker compose up failed for backend.');

  await waitForReadiness(port);

  console.log(`\n[OK] Switched to ${modeKey.toUpperCase()} — ${cfg.label}`);
  console.log(`     Database  : ${dbName}`);
  console.log(`     API       : http://localhost:${port}`);
  console.log(`     Readiness : http://localhost:${port}/actuator/health/readiness`);
  if (modeKey === 'dev') {
    console.log(`     Swagger   : http://localhost:${port}/swagger-ui.html`);
  } else {
    console.log('     Swagger   : disabled in prod');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('-')).map((a) => a.toLowerCase()));
  const cmd = (args.find((a) => !a.startsWith('-')) || '').toLowerCase();

  if (!cmd || cmd === 'help' || flags.has('-h') || flags.has('--help')) {
    printUsage();
    return;
  }

  const opts = {
    resetDb: flags.has('--reset-db') || flags.has('-r') || flags.has('-resetdb'),
    build: flags.has('--build') || flags.has('-b'),
    killPort: flags.has('--kill-port') || flags.has('-k'),
  };

  if (cmd === 'dev' || cmd === 'test') {
    await switchMode('dev', opts);
  } else if (cmd === 'prod' || cmd === 'production') {
    await switchMode('prod', opts);
  } else if (cmd === 'status') {
    await showStatus();
  } else if (cmd === 'stop' || cmd === 'down') {
    await ensureDocker();
    run('docker', ['compose', 'stop'], { cwd: BACKEND_DIR, stdio: 'inherit' });
    console.log('[OK] Stopped Aralytics Docker containers.');
  } else {
    printUsage();
    fail(`Unknown command: "${cmd}"`);
  }
}

main().catch((err) => fail(err.message || String(err)));
