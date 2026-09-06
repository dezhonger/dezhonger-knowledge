import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { load } from 'cheerio'
import { FindTeX } from 'mathjax-full/js/input/tex/FindTeX.js'
import { root, directory, readJson, digest, cleanStatement } from './rosecode-source.mjs'
import { renderRoseCode } from './rosecode-pages.mjs'

const built = process.argv.includes('--built')
const source = await readJson(path.join(directory, 'source.json'))
const zh = await readJson(path.join(directory, 'zh.json'))
const resources = await readJson(path.join(directory, 'resources.json'))
const tex = new FindTeX({ inlineMath: [['$', '$'], ['\\(', '\\)']], displayMath: [['$$', '$$'], ['\\[', '\\]']] })
const formulas = (html) => {
  const $ = load(html, {}, false)
  $('pre,code,.rc-original-clue').remove()
  return tex.findMath([$.text()]).filter((item) => typeof item.display === 'boolean').map((item) => item.open + item.math + item.close).sort()
}
const structure = ($) => $('*').toArray().map((element) => [element.name, element.attribs])
const normalize = (text) => text.replace(/\s+/g, ' ').trim()
const errors = []
assert.equal(source.problems.length, 570)
assert.equal(Object.keys(zh).length, 570)
assert.equal(source.excluded.length, 1)
assert.equal(source.excluded[0].title, 'General Mod Forum')
assert.equal(new Set(source.problems.map((p) => p.archiveNumber)).size, 570)
const indexSource = await readFile(path.join(root, 'puzzle/.vitepress/theme/data/rosecode.ts'), 'utf8')
const index = JSON.parse(indexSource.split('export const roseCodeProblems = ')[1])
assert.equal(index.length, 570)
for (const [position, problem] of source.problems.entries()) {
  try {
    assert.equal(problem.id, position + 1, 'Problem number is not contiguous')
    assert.ok(problem.title && problem.html && problem.author && problem.publishedAt)
    assert.equal(digest(problem.html), problem.sha256, 'English checksum mismatch')
    const cleaned = cleanStatement(problem, resources, source.problems)
    assert.equal(cleaned.html, problem.html, 'Source normalization is not reproducible')
    assert.deepEqual(cleaned.limitations, problem.limitations)
    const translated = zh[problem.id]
    assert.equal(translated.sourceSha256, problem.sha256, 'Translation is outdated')
    assert.equal(translated.sourceTitle, problem.title)
    assert.ok(translated.title && translated.html)
    assert.match(translated.title, /[\u3400-\u9fff]/, 'Missing Chinese title')
    if (/[a-z]{3}/i.test(load(problem.html, {}, false).text())) assert.match(translated.html, /[\u3400-\u9fff]/, 'Missing Chinese prose')
    assert.ok(!/RCKEEP\d+X|RCSEG\d+X|RCENDX/.test(translated.html + translated.title), 'Unrestored translation placeholder')
    assert.deepEqual(formulas(translated.html), formulas(problem.html), 'Formula changed in translation')
    const en = load(problem.html, {}, false)
    const cn = load(translated.html, {}, false)
    assert.deepEqual(structure(cn), structure(en), 'HTML structure or resource attributes changed in translation')
    en('sub,sup').each((i, element) => {
      const symbol = element.prev?.type === 'text' ? element.prev.data.match(/(?:^|[^A-Za-z])([A-Za-z])\s*$/)?.[1] : undefined
      if (symbol) assert.ok(cn('sub,sup')[i].prev?.type === 'text' && cn('sub,sup')[i].prev.data.trimEnd().endsWith(symbol), `Subscript or exponent detached from ${symbol}`)
    })
    en('b,i,em,strong,var,span,sub,sup').each((i, element) => {
      const text = en(element).text()
      if (!en(element).children().length && /^(?:[A-Z]{1,8}|[a-z])$/.test(text)) assert.equal(cn('b,i,em,strong,var,span,sub,sup').eq(i).text(), text, 'Literal mathematical symbol translated as prose')
    })
    const literalSelector = [188, 278, 282, 339, 357].includes(problem.id) ? 'pre span, .rc-source-code, code' : 'pre,code'
    assert.deepEqual(cn(literalSelector).toArray().map((e) => cn(e).text()), en(literalSelector).toArray().map((e) => en(e).text()), 'Literal program or data changed')
    assert.deepEqual(cn('.rc-original-clue').toArray().map((e) => cn(e).text()), en('.rc-original-clue').toArray().map((e) => en(e).text()), 'Original wordplay clue changed')
    const record = index[position]
    assert.equal(record.id, problem.id)
    assert.equal(record.titleZh, translated.title)
    assert.equal(record.archiveNumber, problem.archiveNumber)
    assert.deepEqual(record.limitations, problem.limitations)
    for (const [locale, html] of [['en', problem.html], ['zh', translated.html]]) {
      const $ = load(html, {}, false)
      assert.equal($('script,form,input,iframe,object,embed,style').length, 0, 'Active content survived')
      $('*').each((_, element) => assert.ok(!Object.keys(element.attribs).some((name) => /^on/i.test(name))))
      $('img').each((_, e) => assert.ok($(e).attr('src')?.startsWith('/rosecode/resources/'), 'Image is not local'))
      const rendered = renderRoseCode(html, locale)
      if (!built) continue
      const dist = path.join(root, 'puzzle/.vitepress/dist')
      const prefix = locale === 'zh' ? '/zh' : ''
      const file = path.join(dist, `${prefix}/rosecode/${problem.id}.html`)
      const document = load(await readFile(file, 'utf8'))
      assert.equal(document('.rc-statement').length, 1)
      assert.equal(normalize(document('.rc-statement').html()), normalize(load(rendered, {}, false).html()), 'First response lacks complete statement')
      assert.equal(document('.rc-problem-header h1').text(), locale === 'zh' ? translated.title : problem.title)
      assert.equal(document('link[rel="canonical"]').attr('href'), `https://puzzle.dezhonger.com${prefix}/rosecode/${problem.id}`)
      const assets = await readdir(path.join(dist, 'rosecode/statements', locale))
      const matching = assets.filter((name) => name.startsWith(`${problem.id}.`))
      assert.equal(matching.length, 1)
      const asset = await readJson(path.join(dist, 'rosecode/statements', locale, matching[0]))
      assert.equal(asset.html, rendered, 'Navigation statement differs from initial HTML')
      assert.equal(document(`.rc-neighbours a[href="${prefix}/rosecode/${problem.id - 1}"]`).length, problem.id === 1 ? 0 : 1)
      assert.equal(document(`.rc-neighbours a[href="${prefix}/rosecode/${problem.id + 1}"]`).length, problem.id === 570 ? 0 : 1)
    }
  } catch (error) { errors.push({ id: problem.id, error: error.message.split('\n')[0] }) }
}
for (const [id, archiveNumber] of [[8, 5], [538, 85], [570, 571]]) assert.equal(source.problems[id - 1].archiveNumber, archiveNumber)
for (const resource of resources) {
  assert.ok([200, 404, 410].includes(resource.status), 'Unverified resource')
  if (resource.status !== 200) { assert.ok(!resource.localPath); continue }
  for (const folder of built ? ['puzzle/public', 'puzzle/.vitepress/dist'] : ['puzzle/public']) {
    const data = await readFile(path.join(root, folder, resource.localPath))
    assert.equal(digest(data), resource.sha256)
    assert.equal(data.length, resource.bytes)
  }
}
if (built) {
  for (const prefix of ['', 'zh/']) {
    const dist = path.join(root, 'puzzle/.vitepress/dist')
    const $ = load(await readFile(path.join(dist, prefix, 'collections/rosecode.html'), 'utf8'))
    assert.equal($('.rc-list li').length, 10)
    assert.equal($('.rc-pagination').text().replace(/\s+/g, ''), prefix ? '←上一页1/57下一页→' : '←Previous1/57Next→')
    const feed = await readFile(path.join(dist, prefix, 'feed.xml'), 'utf8')
    assert.ok(!feed.includes('/rosecode/'), 'Archive flooded the article feed')
  }
}
if (errors.length) { console.error(JSON.stringify(errors, null, 2)); process.exitCode = 1 }
else console.log(`RoseCode: 570 bilingual problems, ${resources.length} checked resources${built ? ', 1140 complete HTML pages and navigation assets' : ''} passed`)
