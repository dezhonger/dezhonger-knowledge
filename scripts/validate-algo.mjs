import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { load } from 'cheerio'

const directory = resolve(import.meta.dirname, '../sites/algo')
const origin = 'https://algo.dezhonger.com'
const files = (await readdir(directory, { recursive: true })).filter(file => file.endsWith('.html'))
const pages = new Map()
for (const file of files) pages.set(file, load(await readFile(resolve(directory, file), 'utf8')))
const categories = ['算法竞赛', '工程算法', '机器学习', '大模型', '计算机视觉']
const sitemap = load(await readFile(resolve(directory, 'sitemap.xml'), 'utf8'), { xmlMode: true })
assert.equal(sitemap('loc').length, pages.size, 'Sitemap must cover every HTML page')
let checkedLinks = 0
for (const [file, $] of pages) {
  assert.equal($('main h1').length, 1, `${file}: one article title required`)
  assert.deepEqual($('.top-tabs a').map((_, node) => $(node).text()).get(), categories, `${file}: missing category`)
  assert.equal($('.sidebar').length, 1, `${file}: missing chapter tree`)
  assert.equal($('.page-toc').length, 1, `${file}: missing page outline`)
  const ids = $('[id]').map((_, node) => $(node).attr('id')).get()
  assert.equal(ids.length, new Set(ids).size, `${file}: duplicate anchors`)
  for (const node of $('a[href], link[href], script[src]').toArray()) {
    const href = $(node).attr('href') || $(node).attr('src')
    const url = new URL(href, `${origin}/${file}`)
    if (url.origin !== origin) continue
    let target = resolve(directory, '.' + decodeURIComponent(url.pathname))
    assert.ok(target === directory || target.startsWith(directory + sep), 'Path escaped site root')
    if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html')
    assert.ok((await stat(target)).isFile(), `${file}: missing ${href}`)
    if (url.hash && target.endsWith('.html')) {
      const targetKey = target.slice(directory.length + 1)
      assert.ok(pages.get(targetKey)?.('[id]').toArray().some(element => pages.get(targetKey)(element).attr('id') === decodeURIComponent(url.hash.slice(1))), `${file}: missing anchor ${href}`)
    }
    checkedLinks++
  }
}
for (const [prefix, chapters] of [['competitive', 8], ['engineering', 4], ['ai', 6]]) {
  for (let chapter = 1; chapter <= chapters; chapter++) {
    for (let topic = 1; topic <= 4; topic++) {
      assert.ok(pages.has(`topics/${prefix}-${String(chapter).padStart(2, '0')}-${String(topic).padStart(2, '0')}.html`), 'Missing legacy URL')
    }
  }
}
const home = pages.get('index.html')
const indexPath = home('#algo-search').attr('data-search-index')
const records = JSON.parse(await readFile(resolve(directory, '.' + indexPath), 'utf8'))
assert.equal(records.length, 96, 'Search must cover all 96 topics')
assert.equal(new Set(records.map(record => record.url)).size, 96, 'Duplicate search records')
assert.equal(files.filter(file => file.startsWith('topics/vision-')).length, 24, 'Expected 24 vision topics')
for (const record of records) {
  const $ = pages.get(record.url.slice(1))
  assert.equal($('main h1').text(), record.title, `Search title mismatch: ${record.url}`)
  assert.ok(record.text.includes(record.title), `Missing search text: ${record.url}`)
}
console.log(`Algo Wiki validation passed: ${pages.size} pages, 72 legacy URLs, 24 vision topics, ${records.length} search records, ${checkedLinks} internal links/assets`)
