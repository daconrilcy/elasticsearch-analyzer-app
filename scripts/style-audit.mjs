#!/usr/bin/env node
// Style audit and migration planner for SCSS → CSS Modules
// Generates:
// - styles-usage-report.md (classes ↔ components, unused classes, orphan variables/mixins, duplicates)
// - styles-migration-plan.md (component → module mapping and target tree)

import { promises as fs } from 'fs';
import path from 'path';

/** CONFIG **/
const REPO_ROOT = path.resolve(process.cwd());
const FRONTEND_ROOT = path.join(REPO_ROOT, 'frontend');
const SRC_ROOT = path.join(FRONTEND_ROOT, 'src');
const STYLES_ROOT = path.join(SRC_ROOT, 'styles');
const OUTPUT_USAGE = path.join(REPO_ROOT, 'styles-usage-report.md');
const OUTPUT_PLAN = path.join(REPO_ROOT, 'styles-migration-plan.md');

/** UTIL **/
async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function walk(dir, filterFn = () => true, results = []) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  await Promise.all(entries.map(async (ent) => {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(full, filterFn, results);
    } else if (ent.isFile()) {
      if (filterFn(full)) results.push(full);
    }
  }));
  return results;
}

function normalizeWhitespace(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

/**
 * Naive SCSS block parser for top-level class selectors only.
 * Returns list of { selector, declarations, file, startIndex, endIndex }
 */
function parseScssTopLevelClassBlocks(content, file) {
  const results = [];
  const len = content.length;
  let i = 0;
  while (i < len) {
    // Find next '{'
    const open = content.indexOf('{', i);
    if (open === -1) break;
    // Find preceding selector text
    let selectorStart = open - 1;
    while (selectorStart >= 0 && /[^{}/]/.test(content[selectorStart])) selectorStart--;
    const selectorRaw = content.slice(selectorStart + 1, open).trim();
    // Skip @ rules and non-class selectors
    if (selectorRaw.startsWith('@') || !/\.[A-Za-z_][A-Za-z0-9_-]*/.test(selectorRaw)) {
      i = open + 1;
      // move to matching close to avoid O(n^2) scanning
      let depth = 1;
      let j = open + 1;
      while (j < len && depth > 0) {
        if (content[j] === '{') depth++;
        else if (content[j] === '}') depth--;
        j++;
      }
      i = j;
      continue;
    }
    // Find matching '}'
    let depth = 1;
    let j = open + 1;
    while (j < len && depth > 0) {
      if (content[j] === '{') depth++;
      else if (content[j] === '}') depth--;
      j++;
    }
    const close = j;
    const block = content.slice(open + 1, close - 1);
    const selector = selectorRaw.split(',').map(s => s.trim()).filter(Boolean);
    // Heuristic: only include selectors that start with a class at top-level
    const classSelectors = selector.filter(sel => sel.startsWith('.') && !sel.startsWith('..'));
    if (classSelectors.length > 0) {
      classSelectors.forEach(sel => {
        results.push({ selector: sel, declarations: block, file, startIndex: open + 1, endIndex: close - 1 });
      });
    }
    i = close + 1;
  }
  return results;
}

function extractScssSymbols(content) {
  const variables = new Set();
  const mixins = new Set();
  const includes = new Set();
  const variableDefRegex = /\$([A-Za-z_][A-Za-z0-9_-]*)\s*:/g;
  const mixinDefRegex = /@mixin\s+([A-Za-z_][A-Za-z0-9_-]*)/g;
  const includeRegex = /@include\s+([A-Za-z_][A-Za-z0-9_-]*)/g;
  let m;
  while ((m = variableDefRegex.exec(content))) variables.add(m[1]);
  while ((m = mixinDefRegex.exec(content))) mixins.add(m[1]);
  while ((m = includeRegex.exec(content))) includes.add(m[1]);
  return { variables, mixins, includes };
}

function extractClassTokensFromJsx(content) {
  const tokens = new Set();
  // className="..." or className='...'
  const literalClassRegex = /className\s*=\s*(["'])([\s\S]*?)\1/g;
  let m;
  while ((m = literalClassRegex.exec(content))) {
    const classes = m[2]
      .replace(/\{\{.*?\}\}/g, ' ') // strip jsx objects inside strings if any
      .split(/\s+/)
      .map(s => s.trim())
      .filter(Boolean);
    classes.forEach(c => tokens.add(c));
  }
  // className={`... ${var} ...`}
  const templateRegex = /className\s*=\s*\{\s*`([\s\S]*?)`\s*\}/g;
  while ((m = templateRegex.exec(content))) {
    const raw = m[1].replace(/\$\{[\s\S]*?\}/g, ' ');
    raw.split(/\s+/).map(s => s.trim()).filter(Boolean).forEach(c => tokens.add(c));
  }
  // className={styles.something} → record logical token name for mapping later (camelCase)
  const modulesRegex = /className\s*=\s*\{\s*styles\.([A-Za-z_][A-Za-z0-9_]*)\s*\}/g;
  while ((m = modulesRegex.exec(content))) tokens.add(`styles.${m[1]}`);
  return tokens;
}

function getComponentNameFromPath(filePath) {
  const base = path.basename(filePath, path.extname(filePath));
  return base;
}

function toCamelCase(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function toKebabCase(s) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

async function main() {
  const hasFrontend = await exists(FRONTEND_ROOT);
  if (!hasFrontend) {
    console.error('frontend/ not found. Run from repo root.');
    process.exit(1);
  }

  const scssFiles = await walk(FRONTEND_ROOT, (f) => f.endsWith('.scss'));
  const tsxFiles = await walk(SRC_ROOT, (f) => /\.(tsx|jsx)$/.test(f));

  // Read contents
  const [scssContents, tsxContents] = await Promise.all([
    Promise.all(scssFiles.map(async (f) => ({ file: f, content: await fs.readFile(f, 'utf8') }))),
    Promise.all(tsxFiles.map(async (f) => ({ file: f, content: await fs.readFile(f, 'utf8') }))),
  ]);

  // Extract SCSS symbols and blocks
  const allVariables = new Map(); // var -> Set(files)
  const allMixins = new Map(); // mixin -> Set(files)
  const allIncludes = new Map(); // include -> Set(files)
  const allBlocks = []; // { selector, declarations, file }

  for (const { file, content } of scssContents) {
    const { variables, mixins, includes } = extractScssSymbols(content);
    variables.forEach(v => {
      if (!allVariables.has(v)) allVariables.set(v, new Set());
      allVariables.get(v).add(file);
    });
    mixins.forEach(m => {
      if (!allMixins.has(m)) allMixins.set(m, new Set());
      allMixins.get(m).add(file);
    });
    includes.forEach(i => {
      if (!allIncludes.has(i)) allIncludes.set(i, new Set());
      allIncludes.get(i).add(file);
    });
    parseScssTopLevelClassBlocks(content, file).forEach(b => allBlocks.push(b));
  }

  // Selector → files
  const selectorToFiles = new Map();
  allBlocks.forEach(({ selector, file }) => {
    const key = selector;
    if (!selectorToFiles.has(key)) selectorToFiles.set(key, new Set());
    selectorToFiles.get(key).add(file);
  });

  // Duplicate rules detection (normalized declarations hash)
  const declHashToOccurrences = new Map();
  for (const b of allBlocks) {
    const lines = b.declarations
      .split(/;\s*\n?|\n/)
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('//'))
      .map(l => l.replace(/\s*:\s*/g, ':'));
    const normalized = lines.sort().join(';');
    const hash = `${normalized}`;
    if (!declHashToOccurrences.has(hash)) declHashToOccurrences.set(hash, []);
    declHashToOccurrences.get(hash).push({ selector: b.selector, file: b.file });
  }

  // Extract class usage from TSX components
  const classToComponents = new Map(); // '.class' -> Set(componentFile)
  const rawClassUsage = new Map(); // 'class' (no dot) -> Set(componentFile)
  const componentToClasses = new Map();
  for (const { file, content } of tsxContents) {
    const comp = toPosix(path.relative(SRC_ROOT, file));
    const tokens = extractClassTokensFromJsx(content);
    for (const t of tokens) {
      if (t.startsWith('styles.')) continue; // CSS modules already
      const cls = t.replace(/^\./, '');
      if (!rawClassUsage.has(cls)) rawClassUsage.set(cls, new Set());
      rawClassUsage.get(cls).add(comp);
      if (!componentToClasses.has(comp)) componentToClasses.set(comp, new Set());
      componentToClasses.get(comp).add(cls);
    }
  }

  // Compute defined class names from SCSS selectors
  const definedClasses = new Set(Array.from(selectorToFiles.keys()).map(k => k.replace(/^\./, '')));

  // Used but not defined (likely third-party or missing)
  const usedButUndefined = [];
  for (const [cls, comps] of rawClassUsage.entries()) {
    if (!definedClasses.has(cls)) usedButUndefined.push({ cls, components: Array.from(comps).sort() });
  }

  // Defined but not used
  const classUsedSet = new Set(rawClassUsage.keys());
  const definedButUnused = Array.from(definedClasses)
    .filter(cls => !classUsedSet.has(cls))
    .sort();

  // Orphan variables/mixins (defined but never referenced)
  const referencedVariables = new Set();
  const referencedMixins = new Set(allIncludes.keys());
  for (const { content } of scssContents) {
    // Reference variables by $name usage
    for (const v of allVariables.keys()) {
      if (new RegExp(`\\$${v}\\b`).test(content)) referencedVariables.add(v);
    }
  }
  const orphanVariables = Array.from(allVariables.keys()).filter(v => !referencedVariables.has(v));
  const orphanMixins = Array.from(allMixins.keys()).filter(m => !referencedMixins.has(m));

  // Duplicates: different files sharing identical declaration hash
  const duplicates = [];
  for (const [hash, occ] of declHashToOccurrences.entries()) {
    const files = new Set(occ.map(o => o.file));
    if (occ.length > 1 && files.size > 1) {
      duplicates.push(occ);
    }
  }

  // Build usage mapping classes ↔ components
  const classUsageMapping = [];
  for (const [cls, comps] of rawClassUsage.entries()) {
    const sel = `.${cls}`;
    classUsageMapping.push({ className: cls, selectorsFiles: Array.from(selectorToFiles.get(sel) || []), components: Array.from(comps).sort() });
  }
  classUsageMapping.sort((a, b) => a.className.localeCompare(b.className));

  // Write styles-usage-report.md
  const usageLines = [];
  usageLines.push('# Styles Usage Report');
  usageLines.push('');
  usageLines.push('## Classes used ↔ components');
  usageLines.push('');
  for (const entry of classUsageMapping) {
    const files = entry.selectorsFiles.map(f => '`' + toPosix(path.relative(FRONTEND_ROOT, f)) + '`').join(', ') || '_not found in SCSS_';
    const comps = entry.components.map(c => '`' + c + '`').join(', ');
    usageLines.push(`- ${'**' + entry.className + '**'}: selectors in ${files} → components: ${comps}`);
  }
  usageLines.push('');
  usageLines.push('## Classes defined but not used');
  usageLines.push('');
  for (const cls of definedButUnused) usageLines.push(`- ${cls}`);
  if (definedButUnused.length === 0) usageLines.push('- None');
  usageLines.push('');
  usageLines.push('## Classes used but not defined in local SCSS');
  usageLines.push('');
  for (const u of usedButUndefined) usageLines.push(`- ${'**' + u.cls + '**'} → components: ${u.components.map(c => '`' + c + '`').join(', ')}`);
  if (usedButUndefined.length === 0) usageLines.push('- None');
  usageLines.push('');
  usageLines.push('## Variables');
  usageLines.push('');
  usageLines.push(`- Total defined: ${allVariables.size}`);
  usageLines.push(`- Orphan variables (defined never referenced): ${orphanVariables.length}`);
  if (orphanVariables.length) usageLines.push(orphanVariables.map(v => `  - $${v}`).join('\n'));
  usageLines.push('');
  usageLines.push('## Mixins');
  usageLines.push('');
  usageLines.push(`- Total mixins: ${allMixins.size}`);
  usageLines.push(`- Orphan mixins (defined never @include): ${orphanMixins.length}`);
  if (orphanMixins.length) usageLines.push(orphanMixins.map(m => `  - @mixin ${m}`).join('\n'));
  usageLines.push('');
  usageLines.push('## Duplicate rules across different files (same declarations)');
  usageLines.push('');
  if (duplicates.length === 0) {
    usageLines.push('- None');
  } else {
    for (const occ of duplicates) {
      const line = occ.map(o => `(${o.selector} in \`${toPosix(path.relative(FRONTEND_ROOT, o.file))}\`)`).join(' ↔ ');
      usageLines.push(`- ${line}`);
    }
  }

  await fs.writeFile(OUTPUT_USAGE, usageLines.join('\n'), 'utf8');

  // Build migration plan
  // Component → set of classes used
  const componentPlan = [];
  for (const [comp, classes] of componentToClasses.entries()) {
    const compName = getComponentNameFromPath(comp);
    const classList = Array.from(classes).sort();
    componentPlan.push({ componentPath: comp, componentName: compName, classes: classList });
  }
  componentPlan.sort((a, b) => a.componentPath.localeCompare(b.componentPath));

  // Shared classes used by ≥ 2 components
  const classUsageCount = new Map();
  for (const [cls, comps] of rawClassUsage.entries()) classUsageCount.set(cls, (classUsageCount.get(cls) || 0) + comps.size);
  const sharedClasses = Array.from(rawClassUsage.entries())
    .filter(([_, comps]) => comps.size >= 2)
    .map(([cls, comps]) => ({ className: cls, components: Array.from(comps).sort() }));

  // Target tree proposal
  const targetTree = [
    'frontend/src/',
    '  components/  # UI shared modules (used by ≥2 components)',
    '  styles/',
    '    utils/_variables.scss',
    '    utils/_mixins.scss',
    '    base/_reset.scss',
  ];

  const planLines = [];
  planLines.push('# Styles Migration Plan');
  planLines.push('');
  planLines.push('## Target tree (proposed)');
  planLines.push('');
  planLines.push('```');
  planLines.push(targetTree.join('\n'));
  planLines.push('```');
  planLines.push('');
  planLines.push('## Component → Module mapping');
  planLines.push('');
  for (const c of componentPlan) {
    const mod = toPosix(path.join(path.dirname(c.componentPath), `${c.componentName}.module.scss`));
    planLines.push(`- **${c.componentName}** (${ '`' + c.componentPath + '`' }): → \`${mod}\``);
    if (c.classes.length) planLines.push(`  - classes: ${c.classes.map(x => '`.' + x + '`').join(', ')}`);
  }
  planLines.push('');
  planLines.push('## Shared styles (used by ≥ 2 components) → `src/components/`');
  planLines.push('');
  if (sharedClasses.length === 0) {
    planLines.push('- None');
  } else {
    for (const s of sharedClasses) {
      planLines.push(`- ${'**.' + s.className + '**'} → components: ${s.components.map(c => '`' + c + '`').join(', ')}`);
    }
  }
  planLines.push('');
  planLines.push('## Tokens');
  planLines.push('');
  planLines.push('- Move variables to `src/styles/utils/_variables.scss`');
  planLines.push('- Move mixins/functions to `src/styles/utils/_mixins.scss`');
  planLines.push('- Keep reset in `src/styles/base/_reset.scss` (if needed)');
  planLines.push('');
  planLines.push('## Conventions');
  planLines.push('');
  planLines.push('- SCSS: kebab-case');
  planLines.push('- TSX (CSS Modules): camelCase with `localsConvention: "camelCase"`');

  await fs.writeFile(OUTPUT_PLAN, planLines.join('\n'), 'utf8');

  console.log(`Generated:\n- ${toPosix(path.relative(REPO_ROOT, OUTPUT_USAGE))}\n- ${toPosix(path.relative(REPO_ROOT, OUTPUT_PLAN))}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


