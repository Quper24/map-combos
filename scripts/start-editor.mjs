import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  if (process.platform === 'darwin')
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (process.platform !== 'win32') return 'google-chrome';
  return (
    [process.env.LOCALAPPDATA, process.env.ProgramFiles, process.env['ProgramFiles(x86)']]
      .filter(Boolean)
      .map((root) => join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'))
      .find(existsSync) || 'chrome.exe'
  );
}

const server = await createServer({ mode: 'editor' });
try {
  await server.listen();
} catch (error) {
  await server.close();
  throw error;
}
const url = new URL('combos/builder/editor', server.resolvedUrls.local[0]).href;
console.log(`Combo editor: ${url}`);

if (!process.argv.includes('--no-open')) {
  const chrome = spawn(chromePath(), [url], { detached: true, stdio: 'ignore' });
  chrome.once('error', (error) => {
    console.warn(`Could not open Chrome (${error.message}). Open ${url} manually.`);
  });
  chrome.unref();
}
