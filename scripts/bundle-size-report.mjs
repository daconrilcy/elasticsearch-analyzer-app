#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { exec as _exec } from 'child_process';
import { promisify } from 'util';
const exec = promisify(_exec);

const REPO = process.cwd();
const FRONTEND = path.join(REPO, 'frontend');
const DIST = path.join(FRONTEND, 'dist', 'assets');

function toKB(bytes) { return (bytes / 1024).toFixed(2); }

async function sizeOf(file) {
  const st = await fs.stat(file);
  return st.size;
}

async function run() {
  // Build frontend
  await exec('npm run build', { cwd: FRONTEND });
  let files = [];
  try {
    files = await fs.readdir(DIST);
  } catch (e) {
    console.error('No dist found at', DIST);
    process.exit(1);
  }
  const cssFiles = files.filter(f => f.endsWith('.css'));
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssBytes = (await Promise.all(cssFiles.map(f => sizeOf(path.join(DIST, f))))).reduce((a,b)=>a+b,0);
  const jsBytes = (await Promise.all(jsFiles.map(f => sizeOf(path.join(DIST, f))))).reduce((a,b)=>a+b,0);

  const lines = [];
  lines.push('# Bundle Size Report');
  lines.push('');
  lines.push(`- CSS total: ${toKB(cssBytes)} kB`);
  lines.push(`- JS total: ${toKB(jsBytes)} kB`);
  lines.push('');
  lines.push('## Files');
  for (const f of cssFiles) {
    const s = await sizeOf(path.join(DIST, f));
    lines.push(`- CSS \`${f}\`: ${toKB(s)} kB`);
  }
  for (const f of jsFiles) {
    const s = await sizeOf(path.join(DIST, f));
    lines.push(`- JS \`${f}\`: ${toKB(s)} kB`);
  }

  await fs.writeFile(path.join(REPO, 'bundle-size-report.md'), lines.join('\n'), 'utf8');
  console.log('Generated: bundle-size-report.md');
}

run().catch(e => { console.error(e); process.exit(1); });


