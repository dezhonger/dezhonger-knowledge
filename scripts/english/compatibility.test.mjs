import test from 'node:test'
import assert from 'node:assert/strict'
import { load } from 'cheerio'
import { loadContent, SITE } from './model.mjs'
import { home, layout } from './render.mjs'
import { legacyVocabularyData } from './practice-data.mjs'
import { fetchContentData, DATA_FILES, compatibleDataPath } from './assets/content-data.js'

const model = await loadContent()
test('the legacy /vocabulary.json consumer can read every supported exam pool', () => {
  const legacy = legacyVocabularyData(model)
  for (const exam of ['cet4', 'cet6', 'ielts', 'toefl']) {
    const selected = legacy.lists[exam].slice(0, 200).map(index => legacy.words[index])
    assert.equal(selected.length, 200)
    for (const [word, phonetic, pos, translation, tags] of selected) {
      assert.ok(word); assert.equal(typeof phonetic, 'string'); assert.ok(pos); assert.ok(translation); assert.ok(Array.isArray(tags))
    }
  }
  const apple = legacy.words.find(word => word[0] === 'apple')
  assert.equal(apple.length, 5)
  assert.ok(apple[3].includes('苹果'))
  assert.ok(!apple[1].startsWith('/'), 'Old UI already wraps phonetics in slashes')
})
test('data fetches use schema-versioned root URLs and revalidate cached data', async () => {
  const calls = []
  const request = async (url, options) => { calls.push({ url, options }); return new Response(JSON.stringify({ success: true })) }
  for (const kind of ['practice', 'search']) {
    assert.deepEqual(await fetchContentData(kind, request), { success: true })
    const call = calls.at(-1)
    assert.equal(call.url.pathname, '/' + DATA_FILES[kind])
    assert.equal(call.options.cache, 'no-cache')
    assert.ok(!call.url.pathname.includes('/assets/'))
  }
  await assert.rejects(() => fetchContentData('practice', async () => new Response('', { status: 404 })), /HTTP 404/)
  assert.deepEqual(await fetchContentData('practice', request), { success: true })
})
test('old release hashes can resolve only the known JSON contracts', () => {
  assert.equal(compatibleDataPath('/assets/135bbd073fa4/practice-data.json'), '/' + DATA_FILES.practice)
  assert.equal(compatibleDataPath('/assets/aaaaaaaaaaaa/search-index.json'), '/' + DATA_FILES.search)
  assert.equal(compatibleDataPath('/assets/aaaaaaaaaaaa/unknown.json'), '/assets/aaaaaaaaaaaa/unknown.json')
})
test('homepage contains only three main categories and a small search entry', () => {
  const $ = load(layout({ title: SITE.name, description: '学习英语', path: '/', body: home(), assets: '/assets/test' }))
  assert.deepEqual($('main a').map((_, a) => $(a).attr('href')).get(), ['/vocabulary', '/grammar', '/expressions'])
  assert.equal($('main .module-card').length, 3)
  assert.equal($('main .practice-banner,main .level-grid,main .popular-topics,main form').length, 0)
  assert.equal($('.desktop-nav,.header-practice,.menu-toggle').length, 0)
  assert.equal($('.header-search').attr('href'), '/search')
  assert.equal($('h1').length, 1)
  assert.equal($('main h2').length, 3)
  assert.ok(!$('body').text().includes('数学'))
})
