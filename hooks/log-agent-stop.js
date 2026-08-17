#!/usr/bin/env node
'use strict';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

function csvEscape(value) {
  const s = String(value == null ? '' : value);
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function main() {
  const fs = require('fs');
  const path = require('path');

  const raw = await readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const agentId = input.agent_id;
  const dataDir = process.env.CLAUDE_PLUGIN_DATA;
  if (!agentId || !dataDir) {
    process.exit(0);
  }

  try {
    const startFile = path.join(dataDir, '.starts', agentId);
    const now = Date.now();
    let start = now;
    if (fs.existsSync(startFile)) {
      const parsed = parseInt(fs.readFileSync(startFile, 'utf8'), 10);
      if (Number.isFinite(parsed)) start = parsed;
    }
    const durationSeconds = Math.max(0, Math.round((now - start) / 1000));

    const csvPath = path.join(dataDir, 'agent-durations.csv');
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, 'timestamp,agent_type,agent_id,session_id,cwd,duration_seconds\n');
    }

    const row = [
      new Date(now).toISOString(),
      input.agent_type,
      agentId,
      input.session_id,
      input.cwd,
      durationSeconds,
    ].map(csvEscape).join(',') + '\n';

    fs.appendFileSync(csvPath, row);

    if (fs.existsSync(startFile)) {
      fs.unlinkSync(startFile);
    }
  } catch {
    // Best-effort logging must never block the session.
  }

  process.exit(0);
}

main();
