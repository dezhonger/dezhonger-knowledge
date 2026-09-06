import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { load } from 'cheerio'
import { createMarkdownRenderer } from 'vitepress'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const directory = path.join(root, 'content/ibm-research')
export const cache = path.join(root, '.cache/ibm-research')
export const archiveUrl = 'https://research.ibm.com/labs/israel/ponder-this'
export const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
export const digest = (value) => createHash('sha256').update(value).digest('hex')
export const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))
export const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
export const mathPattern = /\$\$[\s\S]*?\$\$|(?<!\\)\$(?!\$)(?:\\.|[^$\n])+?\$/g
// Corrections are limited to notation recoverable from the same statement.
// Keep the fetched blog Markdown unchanged in .cache/ibm-research/raw.json.
const notationCorrections = {
  '2003-02': [['2N', '2^N'], ['16=24', '16=2^4']],
  '2003-03': [['$100 per square meter', '100 dollars per square meter'], ['$200 per square meter', '200 dollars per square meter']],
  '2003-09': [['x1/1!', 'x^1/1!'], ['x2/2!', 'x^2/2!'], ['xn/n!', 'x^n/n!'], ['series for ex.', 'series for e^x.']],
  '2009-02': [["[Click here to view the list of numbers.](javascript\\:open_pup('//www.research.ibm.com/files/feb2009_popup.shtml',460,550);)", '[View the list of numbers](https://www.research.ibm.com/files/feb2009_popup.shtml)']],
  '2009-04': [['(2792-1)/(233-1)', '(2^792-1)/(2^33-1)'], ['(2816-1)/(234-1)', '(2^816-1)/(2^34-1)'], ['(21088-1)/(234-1)', '(2^1088-1)/(2^34-1)']],
  '2009-12': [['Πi=110(x&mi)', 'the product of (x & m_i) for i=1,...,10'], ['(nk, n and k', '(n^k, n and k']],
  '2010-07': [['round((1+2cos(20o))n)', 'round((1+2cos(20 degrees))^n)']],
  '2017-01': [['xy=yx', 'x^y=y^x']],
  '2019-09': [['$92', '92 dollars'], ['$74', '74 dollars']],
  '2021-07': [['10+3+0=3', '10+3+0=13']],
  '2022-02': [['$15 = 2\\cdot3 = 6 + 9$', '$15 = 2\\cdot3 + 3^2 = 6 + 9$']],
}
const run = promisify(execFile)
const require = createRequire(import.meta.url)
const { mathjax } = require('mathjax-full/js/mathjax.js')
const { TeX } = require('mathjax-full/js/input/tex.js')
const { SVG } = require('mathjax-full/js/output/svg.js')
const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js')
const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html.js')
const { AllPackages } = require('mathjax-full/js/input/tex/AllPackages.js')
const { AssistiveMmlHandler } = require('mathjax-full/js/a11y/assistive-mml.js')
const adaptor = liteAdaptor()
AssistiveMmlHandler(RegisterHTMLHandler(adaptor))

export async function saveJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`)
}

async function download(url) {
  const { stdout } = await run('curl', ['-fLsS', '--max-time', '20', '--max-redirs', '3', url], { encoding: 'buffer', maxBuffer: 20 * 1024 * 1024 })
  return stdout
}

async function pooled(items, work) {
  let next = 0
  let complete = 0
  let failure
  const results = new Array(items.length)
  await Promise.allSettled(Array.from({ length: 2 }, async () => {
    while (!failure && next < items.length) {
      const index = next++
      try { results[index] = await work(items[index], index) }
      catch (error) { failure = error; break }
      if (++complete % 20 === 0 || complete === items.length) console.log(`IBM: ${complete}/${items.length}`)
    }
  }))
  if (failure) throw failure
  return results
}

export function parseArchive(html) {
  const $ = load(html)
  const entries = new Map()
  $('a[href]').each((_, element) => {
    const url = new URL($(element).attr('href'), archiveUrl)
    if (url.hostname !== 'research.ibm.com') return
    const match = url.pathname.match(/^\/blog\/ponder-this-([a-z]+)-(\d{4})$/)
    if (!match || !months.includes(match[1])) return
    const month = `${match[2]}-${String(months.indexOf(match[1]) + 1).padStart(2, '0')}`
    entries.set(month, { month, sourceUrl: url.origin + url.pathname, sourceSlug: url.pathname.split('/').at(-1) })
  })
  const result = [...entries.values()].sort((a, b) => a.month.localeCompare(b.month))
  if (result[0]?.month !== '1998-05' || result.length < 341) throw new Error('Official IBM archive is incomplete')
  for (const [index, item] of result.entries()) {
    const expected = new Date(Date.UTC(1998, 4 + index, 1)).toISOString().slice(0, 7)
    if (item.month !== expected) throw new Error(`Official archive has a gap at ${expected}`)
    item.id = `IBM-${String(index + 1).padStart(3, '0')}`
  }
  return result
}

export function parsePost(html, entry) {
  const $ = load(html)
  const embedded = $('#__NEXT_DATA__').html()
  if (!embedded) throw new Error(`Missing structured IBM page data: ${entry.sourceUrl}`)
  const state = JSON.parse(embedded).props.pageProps.initialApolloState
  const post = Object.values(state).find((item) => item?.__typename === 'BlogPost' && item.slug === entry.sourceSlug && typeof item.content === 'string')
  if (!post?.content?.trim()) throw new Error(`Missing official statement: ${entry.month}`)
  const title = post.title.replace(/^Ponder This (?:Challenge|challenge)\s*[-–—:]\s*[A-Za-z]+\s+\d{4}\s*[-–—:]\s*/i, '').trim()
  if (!title || title.startsWith('Ponder This')) throw new Error(`Unrecognized title: ${entry.month}: ${post.title}`)
  return {
    ...entry, title, publishedAt: post.publish_at, sourceUpdatedAt: post.updatedAt,
    authors: (post.blog_authors || []).map((author) => state[author.__ref]?.name).filter(Boolean),
    markdown: post.content,
  }
}

export async function fetchSource(refresh = false) {
  await mkdir(path.join(cache, 'pages'), { recursive: true })
  const html = (await download(archiveUrl)).toString('utf8')
  await writeFile(path.join(cache, 'index.html'), html)
  const entries = parseArchive(html)
  const problems = await pooled(entries, async (entry) => {
    const file = path.join(cache, 'pages', `${entry.sourceSlug.replace('ponder-this-', '')}.html`)
    let html = !refresh ? await readFile(file, 'utf8').catch(() => null) : null
    if (!html) {
      html = (await download(entry.sourceUrl)).toString('utf8')
      parsePost(html, entry)
      await writeFile(file, html)
    }
    return parsePost(html, entry)
  })
  await saveJson(path.join(cache, 'raw.json'), { archiveUrl, checkedAt: new Date().toISOString(), problems })
  return problems
}

// The blog keeps challenge, editorial submission boilerplate, solution, and
// solvers in one Markdown field. Stop at explicit section boundaries, never at
// the word "solution" inside the question (many puzzles ask for a solution).
export function cleanMarkdown(raw) {
  let text = raw.replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, '')
  text = text.split(/^\s*#{1,3}\s+(?:Solutions?|Solvers|Correct solvers|Acknowledg(?:e)?ments)\b/im)[0]
  text = text.split(/^(?:We will post the names of those who submit|We invite visitors to our website to submit|\*?If you have any problems you think we might enjoy)/m)[0]
  text = text.replace(/^\s*(?:#+\s*)?Ponder This Challenge\s*:\s*/i, '')
  text = text.replace(/^[ \t]*\$[ \t]*\n([^$]*?)\n[ \t]*\$[ \t]*$/gm, (_, formula) => `$$\n${formula}\n$$`)
  return text.replace(/\n(?:\s*---\s*)+$/, '').trim().replace(/^(?:---\s*\n)+/, '').trim()
}

export async function prepareSource() {
  const raw = await readJson(path.join(cache, 'raw.json'))
  const markdown = await createMarkdownRenderer(root, { html: false, math: false })
  // VitePress attribute syntax would consume mathematical sets such as {0,1}.
  markdown.core.ruler.disable(['curly_attributes', 'emoji'])
  markdown.renderer.rules.fence = (tokens, index) => `<pre><code>${escapeHtml(tokens[index].content)}</code></pre>\n`
  const problems = raw.problems.map((problem) => {
    let statement = cleanMarkdown(problem.markdown)
    for (const [from, to] of notationCorrections[problem.month] || []) statement = statement.replaceAll(from, to)
    let restoredFromArchive
    if (problem.month === '2022-08' && !/Your goal/i.test(statement)) {
      restoredFromArchive = 'https://web.archive.org/web/20220818112624/https://research.ibm.com/haifa/ponderthis/challenges/August2022.html'
      statement += '\n\nThe following arrangement is illegal: B and C start together after A and D finish; A moves directly from the left to the middle; and B and D exchange sides.\n\n```\nAABBBADB\nBDCCAABD\n```\n\nThere are 16 arrangements for n=1, 120 for n=2, and 17,342,172 for n=8. Compute larger counts modulo N=3141592653. For n=128, the count modulo N is 2,484,449,895.\n\n**Your goal**: Compute the number of arrangements for n=2^24=16,777,216, modulo N=3141592653.\n\n**A bonus** "*" for the count when n=2^256, modulo N=3141592653.'
    }
    if (statement.length < 40) throw new Error(`Empty challenge: ${problem.month}`)
    const protectedContent = []
    const protect = (value) => {
      protectedContent.push(value)
      return `IBMKEEP${protectedContent.length - 1}X`
    }
    // Escape comparison signs and grammar symbols such as <solution> as text.
    // Preserve the one explicit preformatted data block as literal code.
    let input = statement.replace(/<pre>([\s\S]*?)<\/pre>/g, (_, body) => protect(`<pre><code>${escapeHtml(body)}</code></pre>`))
    input = input.replace(mathPattern, (value) => protect(escapeHtml(value)))
    let rendered = markdown.render(input)
    for (const [index, value] of protectedContent.entries()) rendered = rendered.replaceAll(`IBMKEEP${index}X`, () => value)
    const $ = load(rendered, {}, false)
    $('h1,h2,h3,h4,h5,h6').each((_, element) => { $(element).removeAttr('id'); $(element).find('.header-anchor').remove() })
    $('p').each((_, element) => {
      const html = $(element).html()
      const match = html.match(/\[\d+(?:,\s*\d+){20,}\]/)
      if (!match) return
      const before = html.slice(0, match.index).trim()
      const after = html.slice(match.index + match[0].length).trim()
      $(element).replaceWith(`${before ? `<p>${before}</p>` : ''}<pre><code>${escapeHtml(match[0])}</code></pre>${after ? `<p>${after}</p>` : ''}`)
    })
    const resources = new Set()
    $('img[src],a[href]').each((_, element) => {
      const value = $(element).attr(element.name === 'img' ? 'src' : 'href')
      if (element.name === 'img' || /\.(png|jpe?g|gif|svg|webp|txt|csv|pdf|zip)(?:[?#]|$)/i.test(value) || /May_PonderThis_Table|feb2009_popup|asciit\.html/.test(value)) resources.add(new URL(value, problem.sourceUrl).href)
    })
    const { markdown: original, ...metadata } = problem
    return { ...metadata, ...(restoredFromArchive ? { restoredFromArchive } : {}), ...(notationCorrections[problem.month] ? { notationCorrections: notationCorrections[problem.month] } : {}), markdown: statement, html: $.html(), sha256: digest($.html()), resources: [...resources] }
  })
  await saveJson(path.join(directory, 'source.json'), { archiveUrl, checkedAt: raw.checkedAt, firstMonth: problems[0].month, lastMonth: problems.at(-1).month, problems })
  console.log(`IBM: prepared ${problems.length} statements; ${new Set(problems.flatMap((p) => p.resources)).size} resources`)
  return problems
}

export async function syncResources() {
  const { problems } = await readJson(path.join(directory, 'source.json'))
  const file = path.join(directory, 'resources.json')
  const previous = await readJson(file).catch(() => [])
  const staged = await readJson(path.join(cache, 'resources.json')).catch(() => [])
  const urls = [...new Set(problems.flatMap((problem) => problem.resources))]
  const records = []
  for (const url of urls) {
    const saved = [...previous, ...staged].find((item) => item.url === url)
    if (saved?.localPath && existsSync(path.join(root, 'puzzle/public', saved.localPath)) && digest(readFileSync(path.join(root, 'puzzle/public', saved.localPath))) === saved.sha256) {
      records.push(saved)
      continue
    }
    // This retired IBM image repeats the formula fully defined in the prose.
    if (url === 'http://www.ibm.com/innovation/us/images/june_2009_challenge_300x88.jpg') {
      records.push({ url, status: 404, replacementHtml: '<div>$$\\left(\\sum_{\\pi\\in S_{14}}4^{\\prod_{i=1}^{14}(2+(N_i\\bmod 2))}\\right)\\bmod 1299$$</div>', note: 'The retired formula image returned 404. Typeset the expression exactly specified in the same official paragraph.' })
      continue
    }
    if (url === 'https://research.ibm.com/images/ponder0219.png') {
      const replacement = urls.find((value) => value.endsWith('/ponder0219_80d7e58e53.png'))
      const image = [...records, ...previous, ...staged].find((item) => item.url === replacement)
      if (!image?.localPath) throw new Error('Missing relocated February 2019 screenshot')
      records.push({ ...image, url, downloadUrl: replacement, originalStatus: 404, note: 'Use the migrated screenshot embedded in the same official article.' })
      continue
    }
    let downloadUrl = url.replace(/^http:\/\/www.cs.columbia.edu\//, 'https://www.cs.columbia.edu/')
    if (url === 'https://github.com/dwyl/english-words/blob/master/words_alpha.txt') downloadUrl = 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt'
    const data = await download(downloadUrl)
    if (!data.length || /<html|<!doctype html/i.test(data.subarray(0, 1000).toString())) throw new Error(`Resource did not return a file: ${url}`)
    const sha256 = digest(data)
    const extension = path.extname(new URL(downloadUrl).pathname).toLowerCase()
    const localPath = `/ibm-research/resources/${sha256.slice(0, 20)}${extension}`
    await mkdir(path.join(root, 'puzzle/public/ibm-research/resources'), { recursive: true })
    await writeFile(path.join(root, 'puzzle/public', localPath), data)
    records.push({ url, ...(url !== downloadUrl ? { downloadUrl } : {}), localPath, sha256, bytes: data.length, status: 200 })
    // Preserve each successful download if the next request fails.
    await saveJson(path.join(cache, 'resources.json'), [...staged.filter((item) => !records.some((record) => record.url === item.url)), ...records])
  }
  await saveJson(file, records)
  console.log(`IBM: ${records.length} resources accounted for`)
}

export function content() {
  const source = JSON.parse(readFileSync(path.join(directory, 'source.json'), 'utf8'))
  const zh = JSON.parse(readFileSync(path.join(directory, 'zh.json'), 'utf8'))
  const resources = JSON.parse(readFileSync(path.join(directory, 'resources.json'), 'utf8'))
  for (const problem of source.problems) {
    for (const url of problem.resources) {
      const resource = resources.find((item) => item.url === url)
      if (!resource?.localPath && !resource?.replacementHtml) throw new Error(`Missing required resource: ${problem.id}: ${url}`)
      if (resource.localPath && !existsSync(path.join(root, 'puzzle/public', resource.localPath))) throw new Error(`Missing local resource: ${resource.localPath}`)
    }
  }
  for (const problem of source.problems.slice(21)) {
    const translated = zh[problem.id]
    if (!translated?.title || !translated.html || translated.sourceTitle !== problem.title || translated.sourceSha256 !== problem.sha256) {
      throw new Error(`Missing or outdated Chinese translation: ${problem.id} (${problem.month})`)
    }
  }
  return { source, zh, resources }
}

export function slugFor(problem) {
  return `ponder-this-${problem.month}`
}

export function localizedHtml(problem, translated, resources, locale) {
  const $ = load(locale === 'zh' ? translated.html : problem.html, {}, false)
  $('img[src],a[href]').each((_, element) => {
    const attribute = element.name === 'img' ? 'src' : 'href'
    const raw = $(element).attr(attribute)
    const parsed = new URL(raw, problem.sourceUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`Unsupported statement URL: ${problem.id}`)
    const original = parsed.href
    const resource = resources.find((item) => item.url === original)
    if (resource?.replacementHtml) {
      $(element).replaceWith(`${resource.replacementHtml}<small>${locale === 'zh' ? resource.captionZh || '公式依据官方题面文字排版。' : resource.captionEn || 'Formula typeset from the official statement.'}</small>`)
      return
    }
    if (element.name === 'img' && !resource?.localPath) throw new Error(`Missing image for ${problem.id}: ${original}`)
    $(element).attr(attribute, resource?.localPath || original)
    if (element.name === 'img') {
      $(element).attr('loading', 'lazy').attr('decoding', 'async')
      if (/february2005_[13]_/.test(original)) $(element).addClass('ibm-inline-symbol').attr('alt', original.includes('2005_1_') ? 'π' : 'θ')
      return
    }
    if (raw.startsWith('#')) { $(element).attr('href', raw); return }
    const oldMonth = parsed.pathname.match(/\/([a-z]+)(\d{4})\.html$/i)
    const blogMonth = parsed.pathname.match(/\/ponder-this-([a-z]+)-(\d{4})$/i)
    const match = oldMonth || blogMonth
    if (/^(www\.)?research\.ibm\.com$/.test(parsed.hostname) && match && !parsed.hash && months.includes(match[1].toLowerCase())) {
      const month = `${match[2]}-${String(months.indexOf(match[1].toLowerCase()) + 1).padStart(2, '0')}`
      const all = JSON.parse(readFileSync(path.join(directory, 'source.json'), 'utf8')).problems
      if (all.some((item) => item.month === month)) {
        const old = readdirSync(path.join(root, 'puzzle/puzzles')).find((name) => name.startsWith(`ponder-this-${month}-`) && name.endsWith('.md'))
        $(element).attr('href', `${locale === 'zh' ? '/zh' : ''}/puzzles/${old ? old.slice(0, -3) : `ponder-this-${month}`}`).removeAttr('target').removeAttr('rel')
        return
      }
    }
    $(element).attr('href', (resource?.localPath || original).replaceAll('%5C_', '_')).attr('target', '_blank').attr('rel', 'noreferrer')
  })
  // Reparse after inserting archived tables so block elements never remain
  // inside paragraphs (which would otherwise cause hydration mismatches).
  const result = load($.html(), {}, false)
  if (result('script,style,iframe,form,object,embed').length) throw new Error(`Active content in ${problem.id}`)
  result('*').each((_, element) => {
    if (Object.keys(element.attribs).some((name) => /^on/i.test(name))) throw new Error(`Event handler in ${problem.id}`)
  })
  result('p').filter((_, element) => !result(element).text().trim() && !result(element).children().length).remove()
  result('h1,h2,h3,h4').each((_, element) => {
    if (/^(Appendix|附录)/i.test(result(element).text().trim())) result(element).attr('id', 'appendix')
  })
  return result.html()
}

export function renderStatement(html) {
  const key = digest(`ibm-v2:${html}`)
  const file = path.join(cache, 'rendered', `${key}.html`)
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const document = mathjax.document(html, {
    InputJax: new TeX({ packages: AllPackages, inlineMath: [['$', '$'], ['\\(', '\\)']], displayMath: [['$$', '$$'], ['\\[', '\\]']], processEscapes: true }),
    OutputJax: new SVG({ fontCache: 'local' }), enableAssistiveMml: true,
  })
  document.render()
  let result = adaptor.innerHTML(adaptor.body(document.document))
    .replace(/\bid="(MJX-[^"]+)"/g, `id="ibm-${key.slice(0, 12)}-$1"`)
    .replace(/((?:xlink:)?href)="#(MJX-[^"]+)"/g, `$1="#ibm-${key.slice(0, 12)}-$2"`)
  if (/data-mjx-error|<merror/.test(result)) throw new Error('IBM formula failed to render')
  const $ = load(result, {}, false)
  $('mjx-container:not([display="true"])').each((_, element) => {
    const width = $(element).children('svg').attr('width') || ''
    if (width.endsWith('ex') && Number.parseFloat(width) > 32) $(element).attr('data-wide', 'true')
  })
  result = $.html()
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, result)
  return result
}

export function ibmResearchPaths(locale) {
  const { source, zh, resources } = content()
  return source.problems.slice(21).map((problem) => {
    const translated = zh[problem.id]
    const title = locale === 'zh' ? translated.title : problem.title
    const slug = slugFor(problem)
    let html
    try { html = renderStatement(localizedHtml(problem, translated, resources, locale)) }
    catch (error) { throw new Error(`${problem.id} ${locale}: ${error.message}`, { cause: error }) }
    const date = locale === 'zh' ? `${problem.month.slice(0, 4)} 年 ${Number(problem.month.slice(5))} 月` : new Date(`${problem.month}-01T00:00:00Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    const statementLiteral = JSON.stringify(html).replaceAll('<', '\\u003c')
    return {
      params: { ibm: slug },
      content: `---\nlayout: puzzle\npuzzle: ${slug}\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(`IBM Ponder This ${problem.id} · ${date} · ${title}`)}\ndate: ${problem.month}-01\nfeed: false\nlastUpdated: false\n---\n\n<script setup>\nconst ibmStatement = ${statementLiteral}\n</script>\n\n## IBM Ponder This #${problem.id.slice(4)} · ${date}\n\n<div class="ibm-statement" v-html="ibmStatement"></div>\n\n<PuzzleSolution>\n\n${locale === 'zh' ? '_待补充。_' : '_To be added._'}\n\n</PuzzleSolution>\n`,
    }
  })
}

export async function generateCatalog() {
  const { source, zh } = content()
  const plain = (html) => { const $ = load(html, {}, false); $('pre,code').remove(); return $.text().replace(/\s+/g, ' ').trim() }
  const records = source.problems.slice(21).map((problem) => {
    const translated = zh[problem.id]
    const slug = slugFor(problem)
    const englishText = plain(problem.html)
    const chineseText = plain(translated.html)
    const titleSearch = `${problem.id} IBM Research Ponder This ${problem.month} ${problem.title} ${translated.title}`
    return {
      id: problem.id, slug, title: problem.title, summary: englishText.slice(0, 220),
      content: `puzzles/${slug}.md`, solution: `puzzles/${slug}.md#solution`, hints: [],
      collection: 'ibm-research', source: `IBM Research · Ponder This · ${problem.month}`, sourceUrl: problem.sourceUrl,
      license: 'Problem statement from IBM Research Ponder This, with a Chinese translation. See the original page for the official solution.',
      difficulty: null, status: 'open', createdAt: `${problem.month}-01`, updatedAt: `${problem.month}-01`, cover: 'numbers',
      categories: ['Mathematics'], searchText: `${titleSearch} ${[...new Set(englishText.split(/\s+/))].join(' ')}`,
      zh: { title: translated.title, summary: chineseText.slice(0, 140), hints: [], source: `IBM Research · Ponder This · ${problem.month.slice(0, 4)} 年 ${Number(problem.month.slice(5))} 月`, categories: ['数学'], searchText: `${titleSearch} ${chineseText}` },
    }
  })
  const file = path.join(root, 'puzzle/.vitepress/theme/data/ibm-research.ts')
  await writeFile(file, `// Generated by scripts/ibm-research.mjs. Edit content/ibm-research instead.\nimport type { Puzzle } from './catalog'\n\nexport const ibmResearchCount = ${source.problems.length}\nexport const ibmResearchPuzzles: Puzzle[] = ${JSON.stringify(records, null, 2)}\n`)
  console.log(`IBM: generated ${records.length} imported entries; ${source.problems.length} total issues`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes('--from-cache')) {
    await fetchSource(process.argv.includes('--refresh'))
    await prepareSource()
    await syncResources()
  }
  if (!process.argv.includes('--source-only')) await generateCatalog()
}
