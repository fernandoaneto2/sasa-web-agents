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
    const startsDir = path.join(dataDir, '.starts');
    fs.mkdirSync(startsDir, { recursive: true });
    fs.writeFileSync(path.join(startsDir, agentId), String(Date.now()));
  } catch {
    // Best-effort logging must never block the session.
  }

  process.exit(0);
}

main();
