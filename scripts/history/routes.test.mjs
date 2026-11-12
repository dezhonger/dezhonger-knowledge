import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../../sites/history')
const html = file => readFile(resolve(root, file), 'utf8')
const exists = async file => { try { await access(resolve(root, file)); return true } catch { return false } }

test('HISTORY ATLAS is the only history site and all navigation points to built pages', async () => {
  const home = await html('index.html')
  const explore = await html('explore/index.html')
  assert.match(home, /HISTORY ATLAS/)
  assert.match(home, /href="\/explore\//)
  assert.match(explore, /timeline-plot/)
  for (const page of [home, explore, await html('explore/people/song-zhenzong/index.html')]) {
    assert.doesNotMatch(page, /href="\/learning\/|href="[^\"]*\/topics\//)
  }
})

test('retired course pages and private course assets are absent', async () => {
  for (const file of [
    'learning', 'topics', 'learning-base.css', 'learning.js',
    'subject.css', 'subject.js', 'themes.css', 'explore/explore.css',
  ]) assert.equal(await exists(file), false, `${file} must not be published`)
  assert.equal((await readdir(root)).filter(name => /^(learning|topics)$/.test(name)).length, 0)
})

test('real Atlas details, data and assets remain available', async () => {
  for (const file of [
    'explore/index.html', 'explore/data/atlas.json', 'assets/world-land.svg',
    'assets/summer-mountains-met.jpg', 'explore/political-entities/liao/index.html',
    'explore/people/liao-shengzong/index.html', 'explore/events/gniezno-meeting/index.html',
  ]) assert.equal(await exists(file), true, `${file} must remain`)
})
