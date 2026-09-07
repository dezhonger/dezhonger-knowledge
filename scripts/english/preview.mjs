import { createServer } from 'node:http'
import { stat, readFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { compatibleDataPath } from './assets/content-data.js'
import { root } from './model.mjs'

const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml' }
export function previewServer(directory = resolve(root, 'sites/english')) {
  return createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return }
    try {
      const original = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
      if (original === '/index.html') { response.writeHead(302, { Location: '/', 'Cache-Control': 'no-store' }); response.end(); return }
      const path = compatibleDataPath(original)
      const file = resolve(directory, '.' + path)
      if (file !== directory && !file.startsWith(directory + sep)) { response.writeHead(400); response.end(); return }
      let found
      for (const candidate of [file, file + '.html', resolve(file, 'index.html')]) {
        try { if ((await stat(candidate)).isFile()) { found = candidate; break } } catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error }
      }
      const body = await readFile(found || resolve(directory, '404.html'))
      response.writeHead(found ? 200 : 404, { 'Content-Type': (mime[extname(found || '404.html')] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
      response.end(request.method === 'HEAD' ? undefined : body)
    } catch { response.writeHead(400); response.end('Bad request') }
  })
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.ENGLISH_PREVIEW_PORT || 5176)
  previewServer().listen(port, '127.0.0.1', () => console.log(`English preview: http://127.0.0.1:${port}`))
}
