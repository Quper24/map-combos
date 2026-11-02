import { copyFile } from 'node:fs/promises';
// Temporary compatibility for direct URLs while still hosted on GitHub Pages.
// Linux hosting should serve index.html with HTTP 200 for valid application routes.
await copyFile('dist/index.html', 'dist/404.html');
console.log('Static hosting fallback generated.');
