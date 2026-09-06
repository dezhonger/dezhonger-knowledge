import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { previewServer } from './preview.mjs'

test('preview serves stable routes and real 404, sitemap and robots responses', async () => {
  const server = previewServer().listen(0, '127.0.0.1')
  await once(server, 'listening')
  try {
    const base = `http://127.0.0.1:${server.address().port}`
    for (const [path, status, type] of [['/', 200, 'text/html'], ['/vocabulary/apple', 200, 'text/html'], ['/sitemap.xml', 200, 'application/xml'], ['/robots.txt', 200, 'text/plain'], ['/not-a-real-page', 404, 'text/html'], ['/topics/junior-02-02.html', 404, 'text/html']]) {
      const response = await fetch(base + path)
      assert.equal(response.status, status, path)
      assert.ok(response.headers.get('content-type').includes(type), path)
    }
  } finally { await new Promise(resolve => server.close(resolve)) }
})
