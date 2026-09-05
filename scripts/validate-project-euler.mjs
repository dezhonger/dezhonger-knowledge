import assert from 'node:assert/strict'
import { readFile, access, readdir } from 'node:fs/promises'
import path from 'node:path'
import { load } from 'cheerio'
import { FindTeX } from 'mathjax-full/js/input/tex/FindTeX.js'
import { root, json, digest } from './project-euler-source.mjs'

const englishOnly = process.argv.includes('--english-only')
const built = process.argv.includes('--built')
const official = await json(path.join(root, 'content/project-euler/official.json'))
const catalog = await json(path.join(root, 'content/project-euler/catalog.json'))
const zh = englishOnly ? {} : await json(path.join(root, 'content/project-euler/zh.json'))
const tex = new FindTeX({ inlineMath: [['$', '$'], ['\\(', '\\)']], displayMath: [['$$', '$$'], ['\\[', '\\]']] })
const isFormula = (item) => typeof item.display === 'boolean'
const math = (html) => tex.findMath([load(html, {}, false).text()]).filter(isFormula).map((item) => item.open + item.math + item.close)
function prose(html) {
  const text = load(html, {}, false).text()
  let result = '', cursor = 0
  for (const item of tex.findMath([text])) {
    result += text.slice(cursor, item.start.n) + (isFormula(item) ? '' : item.math)
    cursor = item.end.n
  }
  return result + text.slice(cursor)
}
const errors = []
const assets = {}
if (built) {
  for (const locale of ['en', 'zh']) {
    const directory = path.join(root, 'puzzle/.vitepress/dist/project-euler/statements', locale)
    const files = await readdir(directory)
    assert.equal(files.length, catalog.length, 'Wrong number of statement navigation assets')
    assets[locale] = new Map(files.map((name) => [Number(name.split('.')[0]), path.join(directory, name)]))
    assert.equal(assets[locale].size, catalog.length, 'Duplicate statement navigation assets')
  }
}
let resources = new Set()
for (const [index, problem] of official.problems.entries()) {
  try {
    assert.equal(problem.id, index + 1, 'Non-contiguous problem ID')
    assert.equal(problem.title, catalog[index].title, 'Title differs from catalog')
    assert.equal(digest(problem.html), problem.sha256, 'Official HTML checksum mismatch')
    const en = load(problem.html, {}, false)
    en('[src], [href]').each((_, el) => {
      const url = new URL(en(el).attr('src') || en(el).attr('href'), 'https://projecteuler.net/')
      if (url.hostname === 'projecteuler.net' && url.pathname.startsWith('/resources/')) resources.add(url.pathname)
    })
    if (!englishOnly) {
      const translated = zh[problem.id]
      assert.ok(translated?.title && translated?.html, 'Missing translation')
      assert.equal(translated.sourceSha256, problem.sha256, 'Outdated translation')
      assert.equal(translated.sourceTitle, problem.title, 'Outdated translated title')
      assert.match(translated.html, /[\u3400-\u9fff]/u, 'No Chinese statement text')
      assert.deepEqual(math(translated.html).sort(), math(problem.html).sort(), 'Formula content or count changed')
      const cn = load(translated.html, {}, false)
      // Chinese word order can move emphasis and change purely visual wrappers.
      // Preserve the structures carrying examples, lists and external resources.
      const structure = ($) => $('table,thead,tbody,tfoot,tr,td,th,ul,ol,li,img,a').toArray().map((el) => [el.name, Object.fromEntries(Object.entries(el.attribs).filter(([key]) => !['title', 'alt'].includes(key)).sort())])
      assert.deepEqual(structure(cn), structure(en), 'Table, list, or resource structure changed')
      assert.equal(cn('script, iframe, form, object, embed').length, 0, 'Active HTML in translation')
      if (problem.id === 836) {
        assert.deepEqual(cn('b').toArray().map((el) => cn(el).text()), en('b').toArray().map((el) => en(el).text()), 'Bold English words are the input of this letter puzzle')
      }
    }
    if (built) {
      for (const locale of ['en', 'zh']) {
        const file = path.join(root, 'puzzle/.vitepress/dist', locale === 'zh' ? 'zh' : '', `project-euler/${problem.id}.html`)
        const html = await readFile(file, 'utf8')
        const $ = load(html)
        assert.equal($('.pe-statement').length, 1, 'Missing rendered problem statement')
        assert.ok(!html.includes('<!--pe-statement:'), 'Statement placeholder was not replaced')
        const asset = await json(assets[locale].get(problem.id))
        assert.equal(load(asset.html, {}, false).html(), $('.pe-statement').html(), 'Navigation asset differs from the initial HTML')
        const sourceHtml = locale === 'zh' ? zh[problem.id].html : problem.html
        const normalize = (text) => text.replace(/\s+/g, ' ').trim()
        const expectedText = normalize(prose(sourceHtml))
        const statement = $('.pe-statement').clone()
        statement.find('mjx-container').remove()
        assert.equal(normalize(statement.text()), expectedText, 'Rendered statement wording differs from source')
        assert.equal($('.pe-writeup-entry__link').length, catalog[index].articleSlug ? 1 : 0, 'Wrong write-up status')
        assert.equal($('link[rel="canonical"]').attr('href'), `https://puzzle.dezhonger.com${locale === 'zh' ? '/zh' : ''}/project-euler/${problem.id}`, 'Wrong canonical URL')
        assert.equal($('link[hreflang="zh-CN"]').attr('href'), `https://puzzle.dezhonger.com/zh/project-euler/${problem.id}`, 'Wrong Chinese alternate URL')
        assert.ok(!html.includes('data-mjx-error'), 'Rendered math error')
      }
    }
  } catch (error) { errors.push({ id: problem.id, error: error.message.split('\n')[0] }) }
}
assert.equal(official.problems.length, catalog.length, 'Catalog size mismatch')
if (!englishOnly) assert.equal(Object.keys(zh).length, catalog.length, 'Chinese catalog size mismatch')
for (const resource of resources) {
  const file = path.join(root, 'puzzle/public/project-euler', resource)
  try {
    assert.ok((await readFile(file)).length > 0, 'Empty resource')
    if (built) await access(path.join(root, 'puzzle/.vitepress/dist/project-euler', resource))
  } catch (error) { errors.push({ resource, error: error.message }) }
}
if (built) {
  for (const locale of ['', 'zh/']) {
    const html = await readFile(path.join(root, 'puzzle/.vitepress/dist', `${locale}collections/project-euler.html`), 'utf8')
    const $ = load(html)
    assert.equal($('a.pe-problem-card').length, catalog.length, 'Not all index items are links')
    for (const problem of catalog) assert.equal($(`a.pe-problem-card[href="/${locale}project-euler/${problem.id}"]`).length, 1, `Wrong index link: ${problem.id}`)
    const counts = { article: catalog.filter((p) => p.articleSlug).length, solved: catalog.filter((p) => p.solvedAt && !p.articleSlug).length, open: catalog.filter((p) => !p.solvedAt && !p.articleSlug).length }
    for (const [status, count] of Object.entries(counts)) assert.equal($(`.pe-problem-card--${status}`).length, count, `Wrong ${status} count`)
  }
}
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2))
  process.exitCode = 1
} else console.log(`Validated ${catalog.length} ${englishOnly ? 'English' : 'bilingual'} statements and ${resources.size} local resources${built ? ', all rendered pages and index links' : ''}`)
