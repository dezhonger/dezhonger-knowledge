import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { load } from 'cheerio'
import { FindTeX } from 'mathjax-full/js/input/tex/FindTeX.js'
import { root, directory, content, digest, slugFor, localizedHtml, renderStatement } from './ibm-research.mjs'

const built = process.argv.includes('--built')
const { source, zh, resources } = content()
const problems = source.problems
const imported = problems.slice(21)
const tex = new FindTeX({ inlineMath: [['$', '$'], ['\\(', '\\)']], displayMath: [['$$', '$$'], ['\\[', '\\]']] })
const normalize = (value) => value.replace(/\s+/g, ' ').trim()
function formulas(html) {
  const $ = load(html, {}, false)
  $('pre,code').remove()
  return tex.findMath([$.text()]).filter((item) => typeof item.display === 'boolean').map((item) => `${item.display}:${item.math}`).sort()
}
function literalBlocks(html) {
  const $ = load(html, {}, false)
  return $('pre').toArray().map((element) => $(element).text())
}
function longLiterals(html) {
  const $ = load(html, {}, false)
  $('a').remove()
  return [...new Set($.text().match(/\b[0-9a-fA-F]{30,}\b/g) || [])]
}
const errors = []
assert.equal(source.firstMonth, '1998-05')
assert.ok(problems.length >= 341, 'Archive predates the approved September 2026 cutoff')
assert.equal(problems.at(-1).month, source.lastMonth)
assert.equal(new Set(problems.map((p) => p.month)).size, problems.length)
assert.equal(new Set(problems.map((p) => p.sourceUrl)).size, problems.length)
assert.deepEqual(Object.keys(zh).sort(), imported.map((p) => p.id).sort())
const indexText = readFileSync(path.join(root, 'puzzle/.vitepress/theme/data/ibm-research.ts'), 'utf8')
const index = JSON.parse(indexText.split('export const ibmResearchPuzzles: Puzzle[] = ')[1])
assert.equal(index.length, imported.length)
assert.ok(indexText.includes(`export const ibmResearchCount = ${problems.length}\n`))

for (const [i, problem] of problems.entries()) {
  try {
    assert.equal(problem.id, `IBM-${String(i + 1).padStart(3, '0')}`)
    assert.equal(problem.month, new Date(Date.UTC(1998, 4 + i, 1)).toISOString().slice(0, 7), 'Missing month')
    assert.equal(problem.sha256, digest(problem.html), 'Source checksum mismatch')
    assert.ok(problem.markdown.length > 40 && problem.title)
    assert.ok(!/::summary\[Click here to view the solution\]|^## (Solution|Solvers)\b/m.test(problem.markdown), 'Official solution was imported')
    if (i < 21) {
      for (const prefix of ['puzzle/puzzles', 'puzzle/zh/puzzles']) {
        const files = readdirSync(path.join(root, prefix)).filter((name) => name.startsWith(`ponder-this-${problem.month}-`) && name.endsWith('.md'))
        assert.equal(files.length, 1, 'Legacy issue route was lost or duplicated')
        const md = readFileSync(path.join(root, prefix, files[0]), 'utf8')
        assert.ok(md.includes(`#${String(i + 1).padStart(3, '0')}`) && md.includes('<PuzzleSolution>'))
        if (built) assert.ok(readFileSync(path.join(root, 'puzzle/.vitepress/dist', prefix.includes('/zh/') ? 'zh/puzzles' : 'puzzles', files[0].replace(/\.md$/, '.html')), 'utf8').includes(problem.id))
      }
      continue
    }
    const translated = zh[problem.id]
    assert.equal(translated.sourceSha256, problem.sha256)
    assert.equal(translated.sourceTitle, problem.title)
    assert.match(translated.title, /[\u3400-\u9fff]/u)
    assert.match(translated.html, /[\u3400-\u9fff]/u)
    assert.ok(!/IBMKEEP\d+X|IBMBLOCK\d+X|⟦\d+⟧|RCKEEP\d+X/.test(translated.html), 'Unrestored import placeholder')
    assert.deepEqual(formulas(translated.html), formulas(problem.html), 'Formula content/count changed in Chinese')
    const chineseBlocks = literalBlocks(translated.html)
    for (const block of literalBlocks(problem.html)) assert.ok(chineseBlocks.includes(block), 'Literal code/matrix/data block changed')
    const chineseText = load(translated.html, {}, false).text()
    for (const literal of longLiterals(problem.html)) assert.ok(chineseText.includes(literal), `Long data literal changed: ${literal.slice(0, 45)}`)
    assert.deepEqual(load(translated.html, {}, false)('img').toArray().map((e) => e.attribs.src).sort(), load(problem.html, {}, false)('img').toArray().map((e) => e.attribs.src).sort(), 'Image lost in translation')
    const entry = index[i - 21]
    assert.equal(entry.id, problem.id)
    assert.equal(entry.slug, slugFor(problem))
    assert.equal(entry.zh.title, translated.title)
    assert.equal(entry.difficulty, null, 'Unreviewed difficulty must not be presented as a rating')
    assert.equal(entry.status, 'open')
    for (const locale of ['en', 'zh']) {
      const html = localizedHtml(problem, translated, resources, locale)
      const rendered = renderStatement(html)
      if (!built) continue
      const prefix = locale === 'zh' ? 'zh/' : ''
      const route = `${prefix}puzzles/${entry.slug}`
      const doc = load(readFileSync(path.join(root, 'puzzle/.vitepress/dist', `${route}.html`), 'utf8'))
      assert.equal(doc('.ibm-statement').length, 1, 'Missing static statement')
      assert.equal(normalize(doc('.ibm-statement').text()), normalize(load(rendered, {}, false).text()), 'Built statement is incomplete')
      assert.equal(doc('.puzzle-detail__header h1').text(), locale === 'zh' ? translated.title : problem.title)
      assert.equal(doc('link[rel="canonical"]').attr('href'), `https://puzzle.dezhonger.com/${route}`)
      assert.equal(doc('.solution-section.open').length, 0, 'Solution should start hidden')
      assert.equal(doc('.solution-section .solution-content').text().trim(), locale === 'zh' ? '待补充。' : 'To be added.')
      if (i < problems.length - 1) assert.ok(doc(`.problem-navigation a[href="/${prefix}puzzles/${slugFor(problems[i + 1])}"]`).length, 'Missing next issue')
    }
  } catch (error) { errors.push({ id: problem.id, month: problem.month, error: error.message.split('\n')[0] }) }
}

const requiredResources = [...new Set(problems.flatMap((p) => p.resources))].sort()
assert.deepEqual(resources.map((r) => r.url).sort(), requiredResources, 'Missing or extra resource records')
for (const resource of resources) {
  assert.ok(resource.localPath || resource.replacementHtml, 'Resource has no usable content')
  if (!resource.localPath) continue
  for (const folder of built ? ['puzzle/public', 'puzzle/.vitepress/dist'] : ['puzzle/public']) {
    const data = readFileSync(path.join(root, folder, resource.localPath))
    assert.equal(digest(data), resource.sha256, 'Resource checksum mismatch')
    assert.equal(data.length, resource.bytes, 'Resource length mismatch')
  }
}
const life = resources.find((r) => r.url.includes('May_PonderThis_Table'))
assert.equal(load(life.replacementHtml)('td').length, 180)
assert.equal(load(life.replacementHtml)('td[aria-label="alive"]').length, 34)
const popup = resources.find((r) => r.url.includes('feb2009_popup'))
assert.equal(load(popup.replacementHtml).text().trim().split(/\s+/).length, 255)
const dance = problems.find((p) => p.month === '2022-08')
assert.ok(dance.markdown.includes('3141592653') && dance.markdown.includes('2^256') && dance.restoredFromArchive, 'Lost archived dance question/bonus')
if (built) {
  for (const prefix of ['', 'zh/']) {
    const dist = path.join(root, 'puzzle/.vitepress/dist')
    const doc = load(readFileSync(path.join(dist, `${prefix}collections/ibm-research.html`), 'utf8'))
    assert.equal(doc('.collection-problems > a').length, 10)
    assert.ok(doc('.collection-stats').text().includes(String(problems.length)))
    assert.equal(doc('#collection-pagination .page-numbers button').last().text().trim(), String(Math.ceil(problems.length / 10)))
    const feed = readFileSync(path.join(dist, prefix, 'feed.xml'), 'utf8')
    for (const problem of imported) assert.ok(!feed.includes(`/${prefix}puzzles/${slugFor(problem)}</link>`), 'Backfill flooded the article feed')
    const sitemap = readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')
    for (const problem of imported) assert.ok(sitemap.includes(`/${prefix}puzzles/${slugFor(problem)}</loc>`), 'Generated page is missing from sitemap')
  }
}
if (errors.length) { console.error(JSON.stringify(errors, null, 2)); process.exitCode = 1 }
else console.log(`IBM Research: ${problems.length} continuous issues, ${imported.length} Chinese translations, ${resources.length} verified resources${built ? `, ${problems.length * 2} bilingual HTML pages` : ''} passed`)
