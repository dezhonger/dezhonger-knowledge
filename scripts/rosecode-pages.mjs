import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { load } from 'cheerio'
import { root, directory, digest } from './rosecode-source.mjs'

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
const cache = path.join(root, '.cache/rosecode/rendered')
const version = 'rc-v1'

export function content() {
  const source = JSON.parse(readFileSync(path.join(directory, 'source.json'), 'utf8'))
  const zh = JSON.parse(readFileSync(path.join(directory, 'zh.json'), 'utf8'))
  for (const problem of source.problems) {
    if (!zh[problem.id]?.html || zh[problem.id].sourceSha256 !== problem.sha256 || zh[problem.id].sourceTitle !== problem.title) throw new Error(`Missing or outdated translation: RC ${problem.id}`)
  }
  return { problems: source.problems, zh }
}

export function renderRoseCode(html, locale) {
  const key = digest(`${version}:${locale}:${html}`)
  const file = path.join(cache, `${key}.html`)
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const $ = load(html, {}, false)
  if ($('script, form, input, object, embed, iframe, style').length) throw new Error('Active content in RoseCode statement')
  $('*').each((_, element) => {
    if (Object.keys(element.attribs).some((name) => /^on/i.test(name))) throw new Error('Event handler in RoseCode statement')
  })
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')
    if (!/^(https?:\/\/|\/|#)/.test(href)) throw new Error('Unsafe statement link')
    if (locale === 'zh' && /^\/rosecode\/\d+$/.test(href)) $(element).attr('href', `/zh${href}`)
  })
  const document = mathjax.document($.html(), {
    InputJax: new TeX({ packages: AllPackages, inlineMath: [['$', '$'], ['\\(', '\\)']], displayMath: [['$$', '$$'], ['\\[', '\\]']], processEscapes: true }),
    OutputJax: new SVG({ fontCache: 'local' }),
    enableAssistiveMml: true,
  })
  document.render()
  const result = adaptor.innerHTML(adaptor.body(document.document))
    .replace(/\bid="(MJX-[^"]+)"/g, `id="rc-${key.slice(0, 12)}-$1"`)
    .replace(/((?:xlink:)?href)="#(MJX-[^"]+)"/g, `$1="#rc-${key.slice(0, 12)}-$2"`)
  if (/data-mjx-error|<merror/.test(result)) throw new Error('RoseCode formula could not be rendered')
  mkdirSync(cache, { recursive: true })
  writeFileSync(file, result)
  return result
}

function statementAsset(problem, translated, locale) {
  return `/rosecode/statements/${locale}/${problem.id}.${digest(`${version}:${locale}:${locale === 'zh' ? translated.html : problem.html}`).slice(0, 16)}.json`
}

export function roseCodePaths(locale) {
  const { problems, zh } = content()
  return problems.map((problem) => ({
    params: { id: String(problem.id) },
    content: `---\nlayout: rosecode\nrosecode: ${problem.id}\ntitle: ${JSON.stringify(locale === 'zh' ? zh[problem.id].title : problem.title)}\ndescription: ${JSON.stringify(locale === 'zh' ? `RoseCode 第 ${problem.id} 题的中文题面、示例与存档资料。` : `RoseCode problem ${problem.id}: the original statement, examples, and archived resources.`)}\nfeed: false\nlastUpdated: false\nstatementAsset: ${statementAsset(problem, zh[problem.id], locale)}\n---\n`,
  }))
}

export function materializeRoseCode() {
  const { problems, zh } = content()
  const dist = path.join(root, 'puzzle/.vitepress/dist')
  rmSync(path.join(dist, 'rosecode/statements'), { recursive: true, force: true })
  for (const locale of ['en', 'zh']) {
    for (const problem of problems) {
      const html = renderRoseCode(locale === 'zh' ? zh[problem.id].html : problem.html, locale)
      const asset = path.join(dist, statementAsset(problem, zh[problem.id], locale))
      mkdirSync(path.dirname(asset), { recursive: true })
      writeFileSync(asset, JSON.stringify({ html }))
      const page = path.join(dist, locale === 'zh' ? 'zh' : '', `rosecode/${problem.id}.html`)
      const original = readFileSync(page, 'utf8')
      const marker = `<!--rc-statement:${locale}:${problem.id}-->`
      if (original.split(marker).length !== 2) throw new Error(`Missing statement marker: ${page}`)
      writeFileSync(page, original.replace(marker, () => html))
    }
  }
  console.log(`Embedded ${problems.length * 2} RoseCode statements`)
}

export function roseCodeStatementsPlugin() {
  return {
    name: 'rosecode-statements',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestPath = req.url?.split('?')[0]
        const match = requestPath?.match(/^\/rosecode\/statements\/(en|zh)\/(\d+)\.[a-f0-9]{16}\.json$/)
        if (!match) return next()
        try {
          const { problems, zh } = content()
          const problem = problems.find((item) => item.id === Number(match[2]))
          const locale = match[1]
          if (!problem || requestPath !== statementAsset(problem, zh[problem.id], locale)) return next()
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ html: renderRoseCode(locale === 'zh' ? zh[problem.id].html : problem.html, locale) }))
        } catch (error) { next(error) }
      })
    },
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) materializeRoseCode()
