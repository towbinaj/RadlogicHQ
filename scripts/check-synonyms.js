#!/usr/bin/env node
/**
 * Check synonym coverage for a tool's definition.
 *
 * Usage:
 *   node scripts/check-synonyms.js <toolId>
 *   node scripts/check-synonyms.js --all
 *
 * Scans the tool's definition.js, extracts all option labels, and reports
 * which labels have synonym matches in parser.js and which don't.
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Import SYNONYMS and getSynonyms logic inline (parser.js uses ESM export)
const parserSrc = readFileSync(resolve(root, 'src/core/parser.js'), 'utf8');
const synMatch = parserSrc.match(/const SYNONYMS = \{([\s\S]*?)^\};/m);
if (!synMatch) { console.error('Could not parse SYNONYMS from parser.js'); process.exit(1); }

// Reconstruct SYNONYMS by evaluating the object (safe — it's our own code)
const SYNONYMS = new Function(`return {${synMatch[1]}};`)();

function getSynonyms(label) {
  const lower = label.toLowerCase();
  const extras = [];
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (lower.includes(key) || lower === key) {
      extras.push(...syns);
    }
  }
  return extras;
}

/** Extract all option labels from a definition source file. */
function extractLabels(src) {
  const labels = [];
  // Match label: 'text' or label: "text"
  const re = /label:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    labels.push(m[1]);
  }
  return [...new Set(labels)];
}

/** Check if parseRules has hand-written rules (non-empty). */
function countParseRuleKeys(src) {
  // Match parseRules: { ... } but exclude empty {}
  const match = src.match(/parseRules:\s*\{([\s\S]*?)\n\s*\}/);
  if (!match || match[1].trim().length === 0) return 0;
  // Count top-level keys (lines with unquoted identifier followed by colon or quoted key)
  const keys = match[1].match(/^\s+['"]?\w+['"]?\s*:\s*\{/gm);
  return keys ? keys.length : 0;
}

function checkTool(toolId) {
  const defPath = resolve(root, `src/tools/${toolId}/definition.js`);
  let src;
  try { src = readFileSync(defPath, 'utf8'); } catch {
    console.error(`  ✗ No definition.js found for "${toolId}"`);
    return null;
  }

  const labels = extractLabels(src);
  if (labels.length === 0) {
    console.log(`  (no labels found in definition.js)`);
    return null;
  }

  const withSyn = [];
  const withoutSyn = [];

  for (const label of labels) {
    const syns = getSynonyms(label);
    if (syns.length > 0) {
      withSyn.push({ label, synonyms: syns });
    } else {
      withoutSyn.push(label);
    }
  }

  const parseRuleCount = countParseRuleKeys(src);

  return { labels, withSyn, withoutSyn, parseRuleCount };
}

function printResult(toolId, result) {
  if (!result) return;
  const { labels, withSyn, withoutSyn, parseRuleCount } = result;
  const pct = Math.round((withSyn.length / labels.length) * 100);

  const parseNote = parseRuleCount > 0 ? ` + ${parseRuleCount} hand-written parseRules` : '';
  console.log(`\n  ${toolId}: ${withSyn.length}/${labels.length} labels have synonyms (${pct}%)${parseNote}`);

  if (withSyn.length > 0) {
    console.log(`  ┌─ With synonyms:`);
    for (const { label, synonyms } of withSyn) {
      console.log(`  │  "${label}" → ${synonyms.join(', ')}`);
    }
  }

  if (withoutSyn.length > 0) {
    console.log(`  ├─ Without synonyms:`);
    for (const label of withoutSyn) {
      console.log(`  │  "${label}"`);
    }
  }
  console.log(`  └─`);
}

// --- Main ---
const arg = process.argv[2];

if (!arg) {
  console.log('Usage: node scripts/check-synonyms.js <toolId>');
  console.log('       node scripts/check-synonyms.js --all');
  process.exit(0);
}

if (arg === '--all') {
  const toolsDir = resolve(root, 'src/tools');
  const dirs = readdirSync(toolsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  let totalLabels = 0;
  let totalWithSyn = 0;

  for (const toolId of dirs) {
    const result = checkTool(toolId);
    if (result) {
      printResult(toolId, result);
      totalLabels += result.labels.length;
      totalWithSyn += result.withSyn.length;
    }
  }

  const pct = totalLabels > 0 ? Math.round((totalWithSyn / totalLabels) * 100) : 0;
  console.log(`\n  Summary: ${totalWithSyn}/${totalLabels} labels have synonyms (${pct}%)\n`);
} else {
  const result = checkTool(arg);
  printResult(arg, result);
}
