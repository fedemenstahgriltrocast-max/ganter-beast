import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '..', '..');

const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'tests']);

async function collectJavaScriptFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJavaScriptFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function syntaxCheckFile(filePath) {
  try {
    await execFileAsync(process.execPath, ['--check', filePath]);
    return { filePath, ok: true };
  } catch (error) {
    return {
      filePath,
      ok: false,
      error: error.stderr?.toString() || error.message,
    };
  }
}

test('project JavaScript compiles cleanly under Node syntax check', async () => {
  const roots = ['src', 'scripts', 'workers-directory', 'standalone', 'calc'];
  const candidates = new Set();

  for (const root of roots) {
    const absolute = path.join(projectRoot, root);
    try {
      const stats = await fs.stat(absolute);
      if (!stats.isDirectory()) {
        continue;
      }
      const files = await collectJavaScriptFiles(absolute);
      files.forEach((file) => candidates.add(file));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  ['main.js', 'consent-page.js'].forEach((file) => {
    candidates.add(path.join(projectRoot, file));
  });

  const results = await Promise.all(Array.from(candidates).map(syntaxCheckFile));
  const failed = results.filter((result) => !result.ok);

  assert.equal(
    failed.length,
    0,
    failed.length ? `Syntax check failed for: ${failed.map((result) => result.filePath).join(', ')}` : undefined,
  );
});
