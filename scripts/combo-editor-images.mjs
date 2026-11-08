import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const endpoint = '/__combo-editor/image';
const imageFolder = 'img/combo-builder';
const maxBytes = 2 * 1024 * 1024;

function send(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

export function comboEditorImages() {
  return {
    name: 'combo-editor-images',
    configResolved(config) {
      if (config.server.host !== '127.0.0.1') {
        throw new Error('The combo editor must listen on 127.0.0.1.');
      }
    },
    configureServer(server) {
      const folder = join(server.config.publicDir, imageFolder);
      // Vite may not have indexed a newly saved public file when the editor first previews it.
      server.middlewares.use(`/${imageFolder}`, async (request, response, next) => {
        const name = /^\/([a-f0-9]{64}\.webp)$/.exec(request.url.split('?')[0])?.[1];
        if (!name || request.method !== 'GET') return next();
        try {
          const image = await readFile(join(folder, name));
          response.writeHead(200, {
            'Content-Type': 'image/webp',
            'X-Content-Type-Options': 'nosniff',
          });
          response.end(image);
        } catch (error) {
          if (error.code !== 'ENOENT') server.config.logger.error(error.message);
          response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
        }
      });
      server.middlewares.use(endpoint, async (request, response) => {
        const { host, origin } = request.headers;
        if (
          !/^127\.0\.0\.1:\d+$/.test(host || '') ||
          origin !== `http://${host}` ||
          request.socket.remoteAddress !== '127.0.0.1'
        ) {
          send(response, 403, { error: 'Local editor required' });
          return;
        }
        if (request.method !== 'POST' || request.headers['content-type'] !== 'image/webp') {
          send(response, 415, { error: 'Expected a WebP upload' });
          return;
        }
        try {
          const chunks = [];
          let size = 0;
          for await (const chunk of request.iterator({ destroyOnReturn: false })) {
            size += chunk.length;
            if (size > maxBytes) {
              request.resume();
              send(response, 413, { error: 'Image exceeds 2 MB' });
              return;
            }
            chunks.push(chunk);
          }
          const bytes = Buffer.concat(chunks);
          if (
            bytes.length < 16 ||
            bytes.toString('ascii', 0, 4) !== 'RIFF' ||
            bytes.toString('ascii', 8, 12) !== 'WEBP'
          ) {
            send(response, 415, { error: 'Invalid WebP image' });
            return;
          }
          const name = `${createHash('sha256').update(bytes).digest('hex')}.webp`;
          await mkdir(folder, { recursive: true });
          const temporary = join(folder, `.${randomUUID()}.tmp`);
          try {
            await writeFile(temporary, bytes, { flag: 'wx' });
            await rename(temporary, join(folder, name));
          } finally {
            await rm(temporary, { force: true });
          }
          send(response, 201, { path: `/${imageFolder}/${name}` });
        } catch (error) {
          server.config.logger.error(error.message);
          send(response, 500, { error: 'Could not save the image' });
        }
      });
    },
  };
}
