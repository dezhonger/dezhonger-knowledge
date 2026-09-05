import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const contentDirectory = path.join(root, 'content/project-euler')
export const cacheDirectory = path.join(root, '.cache/project-euler')
export const digest = (text) => createHash('sha256').update(text).digest('hex')
export const json = async (file) => JSON.parse(await readFile(file, 'utf8'))
export async function saveJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`)
}

export function request(url) {
  const parsed = new URL(url)
  return new Promise((resolve, reject) => {
    const req = https.get({
      hostname: parsed.hostname === 'projecteuler.net' ? process.env.PROJECT_EULER_IP || parsed.hostname : parsed.hostname,
      servername: parsed.hostname,
      path: `${parsed.pathname}${parsed.search}`,
      headers: { Host: parsed.hostname, 'User-Agent': 'Dezhonger Puzzle Library (noncommercial problem archive)' },
      timeout: 20_000,
    }, (res) => {
      if (res.statusCode !== 200) {
        res.resume()
        reject(new Error(`${url}: HTTP ${res.statusCode}`))
        return
      }
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
    req.on('timeout', () => req.destroy(new Error(`${url}: timeout`)))
    req.on('error', reject)
  })
}

export async function pool(items, processItem, concurrency = 2) {
  let next = 0
  let completed = 0
  let failure
  const results = new Array(items.length)
  await Promise.allSettled(Array.from({ length: concurrency }, async () => {
    while (!failure && next < items.length) {
      const index = next++
      try { results[index] = await processItem(items[index], index) }
      catch (error) { failure = error; break }
      completed++
      if (completed % 25 === 0 || completed === items.length) console.log(`${completed}/${items.length}`)
    }
  }))
  if (failure) throw failure
  return results
}

// Only the public main problem statements are archived. Solutions and member data
// are never requested. Cache each successful response for resumable imports.
export async function fetchStatements(problems, refresh = false) {
  const directory = path.join(cacheDirectory, 'official')
  await mkdir(directory, { recursive: true })
  return pool(problems, async (problem) => {
    const file = path.join(directory, `${problem.id}.html`)
    let html = !refresh ? await readFile(file, 'utf8').catch(() => null) : null
    if (!html) {
      html = (await request(`https://projecteuler.net/minimal=${problem.id}`)).toString('utf8')
      if (!/[a-z]{4}/i.test(html) || /<html|<script|captcha|access denied/i.test(html)) throw new Error(`Invalid statement ${problem.id}`)
      await writeFile(file, html)
    }
    return { id: problem.id, title: problem.title, html, sha256: digest(html) }
  })
}
