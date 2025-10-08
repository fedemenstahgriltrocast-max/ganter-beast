import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const manifestPath = path.resolve(projectRoot, 'config/build-manifest.json');

const loadManifest = async () => {
  const raw = await fs.readFile(manifestPath, 'utf8');
  return JSON.parse(raw);
};

test('build manifest modules resolve to readable files', async () => {
  const manifest = await loadManifest();
  assert.ok(Array.isArray(manifest.modules), '`modules` should be an array');
  assert.ok(manifest.modules.length > 0, 'manifest should include at least one module');

  for (const modulePath of manifest.modules) {
    const resolved = path.resolve(projectRoot, modulePath);
    const stats = await fs.stat(resolved);
    assert.ok(stats.isFile(), `${modulePath} should be a file`);
  }
});

test('build manifest banner matches output bundle header', async () => {
  const manifest = await loadManifest();
  const outputPath = path.resolve(projectRoot, manifest.output || 'main.js');
  const [banner = '', bundle = ''] = await Promise.all([
    Promise.resolve(typeof manifest.banner === 'string' ? manifest.banner : ''),
    fs.readFile(outputPath, 'utf8').catch(() => ''),
  ]);

  if (!banner) {
    assert.equal(banner, '', 'banner should default to empty string');
    return;
  }

  assert.ok(
    bundle.startsWith(banner),
    `Bundle at ${manifest.output} should start with configured banner`,
  );
});
