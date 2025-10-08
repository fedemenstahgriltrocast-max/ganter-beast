#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const manifestPath = path.resolve(projectRoot, 'config/build-manifest.json');

const EXPORT_REPLACERS = [
  [/export\s+function\s+/g, 'function '],
  [/export\s+const\s+/g, 'const '],
  [/export\s+let\s+/g, 'let '],
  [/export\s+class\s+/g, 'class '],
  [/export\s+default\s+/g, ''],
  [/export\s+\{[^}]+\};?/g, ''],
  [/import[^;]+;\s*/g, ''],
];

async function loadManifest() {
  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);

    if (!Array.isArray(manifest.modules) || manifest.modules.length === 0) {
      throw new Error('`modules` must be a non-empty array in build manifest.');
    }

    const output = typeof manifest.output === 'string' && manifest.output.trim().length > 0
      ? manifest.output.trim()
      : 'main.js';

    const banner = typeof manifest.banner === 'string' ? manifest.banner : '';

    return { modules: manifest.modules, banner, output };
  } catch (error) {
    throw new Error(`Unable to read build manifest at ${manifestPath}: ${error.message}`);
  }
}

async function readModule(modulePath) {
  const absolutePath = path.resolve(projectRoot, modulePath);
  try {
    const contents = await fs.readFile(absolutePath, 'utf8');
    return EXPORT_REPLACERS.reduce(
      (accumulator, [pattern, replacement]) => accumulator.replace(pattern, replacement),
      contents,
    );
  } catch (error) {
    throw new Error(`Unable to read module ${modulePath}: ${error.message}`);
  }
}

async function build() {
  const manifest = await loadManifest();
  const chunks = await Promise.all(manifest.modules.map(readModule));
  const body = chunks.join('\n\n');
  const banner = manifest.banner || '';
  const output = path.resolve(projectRoot, manifest.output);

  await fs.writeFile(output, `${banner}${body}`, 'utf8');
  console.log(`Build complete: ${path.relative(projectRoot, output)}`);
}

build().catch((error) => {
  console.error('Build failed');
  console.error(error.message);
  process.exitCode = 1;
});
