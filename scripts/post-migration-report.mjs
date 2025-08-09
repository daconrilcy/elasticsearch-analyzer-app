#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(process.cwd());
const FRONTEND = path.join(REPO_ROOT, 'frontend');
const SRC = path.join(FRONTEND, 'src');

async function walk(dir, predicate = () => true, acc = []) {
  let ents = [];
  try { ents = await fs.readdir(dir, { withFileTypes: true }); } catch { return acc; }
  await Promise.all(ents.map(async ent => {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) return walk(full, predicate, acc);
    if (ent.isFile() && predicate(full)) acc.push(full);
  }));
  return acc;
}

function toPosix(p) { return p.split(path.sep).join('/'); }

async function read(file) { return fs.readFile(file, 'utf8'); }

async function main() {
  const moduleScss = await walk(SRC, f => f.endsWith('.module.scss'));
  const tsxFiles = await walk(SRC, f => /\.(tsx|jsx)$/.test(f));
  const globalScss = await walk(path.join(SRC, 'styles'), f => f.endsWith('.scss'));

  // Find TSX files that import CSS modules
  const tsxWithModuleImports = [];
  await Promise.all(tsxFiles.map(async f => {
    const c = await read(f);
    if (/from\s+['"].*\.module\.scss['"]/.test(c)) tsxWithModuleImports.push(f);
  }));

  // Find SCSS files marked as moved
  const movedGlobals = [];
  await Promise.all(globalScss.map(async f => {
    const c = await read(f);
    if (/moved to CSS Module:/i.test(c)) movedGlobals.push(f);
  }));

  // Tokens: variables and mixins
  const variablesFile = path.join(SRC, 'styles', 'abstracts', '_variables.scss');
  const mixinsFile = path.join(SRC, 'styles', 'abstracts', '_mixins.scss');
  const varsContent = await read(variablesFile).catch(() => '');
  const mixinsContent = await read(mixinsFile).catch(() => '');
  const varNames = Array.from(varsContent.matchAll(/\$([A-Za-z_][A-Za-z0-9_-]*)\s*:/g)).map(m => m[1]);
  const mixinNames = Array.from(mixinsContent.matchAll(/@mixin\s+([A-Za-z_][A-Za-z0-9_-]*)/g)).map(m => m[1]);

  // Build inventory
  const lines = [];
  lines.push('# Post Migration Inventory');
  lines.push('');
  lines.push('## CSS Module files (added)');
  for (const f of moduleScss.sort()) lines.push(`- \`${toPosix(path.relative(REPO_ROOT, f))}\``);
  lines.push('');
  lines.push('## Components importing CSS Modules');
  for (const f of tsxWithModuleImports.sort()) lines.push(`- \`${toPosix(path.relative(REPO_ROOT, f))}\``);
  lines.push('');
  lines.push('## Global SCSS marked as moved');
  for (const f of movedGlobals.sort()) lines.push(`- \`${toPosix(path.relative(REPO_ROOT, f))}\``);
  lines.push('');
  lines.push('## Tokens (final)');
  lines.push(`- Variables (${varNames.length}): ${varNames.map(v => '$'+v).join(', ')}`);
  lines.push(`- Mixins (${mixinNames.length}): ${mixinNames.map(m => '@mixin '+m).join(', ')}`);
  lines.push('');
  lines.push('## Technical debt (remaining)');
  lines.push('- Review `styles/index.scss` imports and remove legacy bundles once all consumers are migrated.');
  lines.push('- Normalize shared button styles into a shared module if reused across components.');
  lines.push('- Re-run style audit to identify unused classes and orphans.');

  await fs.writeFile(path.join(REPO_ROOT, 'post-migration-inventory.md'), lines.join('\n'), 'utf8');

  // Visual regression checklist
  const checklist = [];
  checklist.push('# Visual Regression Checklist');
  checklist.push('');
  checklist.push('## Pages');
  checklist.push('- Auth: Login, Register');
  checklist.push('- Analyzer: Editor (flows, Sidebar, Header, IconSidebar, ConfigurationPanel, ResultPanel)');
  checklist.push('- Datasets: List, Detail (FileList, MappingList, UploadButton, CreateMappingModal)');
  checklist.push('');
  checklist.push('## Viewports');
  checklist.push('- 360x640 (mobile)');
  checklist.push('- 768x1024 (tablet)');
  checklist.push('- 1440x900 (desktop)');
  checklist.push('');
  checklist.push('## Quick fixes to watch');
  checklist.push('- Spacing regressions due to scope changes (margins within modules).');
  checklist.push('- z-index/panel stacking for overlays and panels.');
  checklist.push('- Font/color tokens applied consistently from variables.');
  checklist.push('- Specificity: consider using :where() wrappers to lower specificity where needed.');

  await fs.writeFile(path.join(REPO_ROOT, 'visual-regression-checklist.md'), checklist.join('\n'), 'utf8');

  console.log('Generated:\n- post-migration-inventory.md\n- visual-regression-checklist.md');
}

main().catch(err => { console.error(err); process.exit(1); });


