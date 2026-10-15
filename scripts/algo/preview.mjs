import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { pathToFileURL } from 'node:url'

const directory = resolve(import.meta.dirname, '../../sites/algo')
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' }
export function previewServer() {
  return createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return }
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
      const path = resolve(directory, '.' + pathname)
      if (path !== directory && !path.startsWith(directory + sep)) { response.writeHead(400); response.end(); return }
      let file
      for (const candidate of [path, resolve(path, 'index.html'), path + '.html']) {
        try { if ((await stat(candidate)).isFile()) { file = candidate; break } } catch (error) { if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error }
      }
      if (!file) { response.writeHead(404); response.end('Not found'); return }
      const body = await readFile(file)
      response.writeHead(200, { 'Content-Type': `${mime[extname(file)] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store' })
      response.end(request.method === 'HEAD' ? undefined : body)
    } catch { response.writeHead(400); response.end('Bad request') }
  })
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.ALGO_PREVIEW_PORT || 5177)
  previewServer().listen(port, '127.0.0.1', () => console.log(`Algo Wiki preview: http://127.0.0.1:${port}`))
}
