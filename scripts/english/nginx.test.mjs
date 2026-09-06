import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { get } from 'node:http'
import { once } from 'node:events'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { root } from './model.mjs'

test('production Nginx rules serve English with real 404s and hashed asset caching', async t => {
  if (spawnSync('nginx', ['-v']).error) return t.skip('Local nginx executable unavailable')
  const reservation = createServer().listen(0, '127.0.0.1')
  await once(reservation, 'listening')
  const port = reservation.address().port
  await new Promise(resolve => reservation.close(resolve))
  await mkdir(resolve(root, '.cache'), { recursive: true })
  const temp = await mkdtemp(resolve(root, '.cache/english-nginx-'))
  const config = (await readFile(resolve(root, 'deploy/nginx.conf'), 'utf8'))
    .replaceAll('listen 80', `listen 127.0.0.1:${port}`)
    .replaceAll('/usr/share/nginx/html/', resolve(root, 'sites') + '/')
  const main = `daemon off;\npid ${temp}/nginx.pid;\nerror_log stderr;\nevents {}\nhttp { access_log off; types { text/html html; text/css css; application/javascript js; application/json json; application/xml xml; text/plain txt; image/svg+xml svg; } ${config} }\n`
  const file = resolve(temp, 'nginx.conf')
  await writeFile(file, main)
  const validation = spawnSync('nginx', ['-t', '-p', temp, '-c', file], { encoding: 'utf8' })
  assert.equal(validation.status, 0, validation.stderr)
  const process = spawn('nginx', ['-p', temp, '-c', file], { stdio: ['ignore', 'ignore', 'pipe'] })
  let errors = ''
  process.stderr.on('data', data => { errors += data })
  const base = `http://127.0.0.1:${port}`
  const request = path => new Promise((resolve, reject) => {
    get(base + path, { headers: { Host: 'english.dezhonger.com' } }, response => {
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: response.statusCode, headers: response.headers })))
      response.on('error', reject)
    }).on('error', reject)
  })
  try {
    let ready = false
    for (let i = 0; i < 50; i += 1) {
      try { await request('/'); ready = true; break } catch { await new Promise(resolve => setTimeout(resolve, 20)) }
    }
    assert.ok(ready, errors)
    for (const [path, code, type] of [['/', 200, 'text/html'], ['/vocabulary/apple', 200, 'text/html'], ['/grammar/present-simple', 200, 'text/html'], ['/robots.txt', 200, 'text/plain'], ['/sitemap.xml', 200, 'application/xml'], ['/unknown-english-path', 404, 'text/html'], ['/topics/junior-02-02.html', 404, 'text/html']]) {
      const response = await request(path)
      assert.equal(response.status, code, path + "\n" + errors)
      assert.ok(response.headers.get('content-type').includes(type), path)
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    }
    const html = await (await request('/')).text()
    const css = html.match(/href="([^\"]+english\.css)"/)[1]
    const asset = await request(css)
    assert.equal(asset.status, 200)
    assert.ok(asset.headers.get('cache-control').includes('31536000'))
    assert.equal(asset.headers.get('x-content-type-options'), 'nosniff')
  } finally {
    if (process.exitCode === null) { process.kill('SIGQUIT'); await once(process, 'exit') }
    await rm(temp, { recursive: true, force: true })
  }
})
