import { readFileSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { load } from 'cheerio'
import { root, digest } from './project-euler-source.mjs'

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
const cache = path.join(root, '.cache/project-euler/rendered')
mkdirSync(cache, { recursive: true })

export function renderStatement(html, locale) {
  const key = digest(`v2:${locale}:${html}`)
  const file = path.join(cache, `${key}.html`)
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const $ = load(html, { decodeEntities: false }, false)
  $('script, iframe, form, object, embed').each(() => { throw new Error('Unexpected active content in statement') })
  $('*').each((_, element) => {
    for (const attribute of Object.keys(element.attribs || {})) {
      if (/^on/i.test(attribute)) throw new Error(`Unexpected event attribute: ${attribute}`)
    }
  })
  $('[href], [src]').each((_, element) => {
    const attribute = element.name === 'a' ? 'href' : 'src'
    const value = $(element).attr(attribute)
    if (!value || value.startsWith('#')) return
    const url = new URL(value, 'https://projecteuler.net/')
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unexpected URL protocol: ${url.protocol}`)
    if (url.hostname === 'projecteuler.net' && url.pathname.startsWith('/resources/')) {
      $(element).attr(attribute, `/project-euler${url.pathname}`)
    } else if (url.hostname === 'projecteuler.net' && /^\/problem=\d+$/.test(url.pathname)) {
      $(element).attr(attribute, `${locale === 'zh' ? '/zh' : ''}/project-euler/${url.pathname.split('=')[1]}`)
    } else {
      $(element).attr(attribute, url.href)
    }
  })
  $('.monospace:not(.break_word)').wrapInner('<span class="pe-monospace-content"></span>')
  const document = mathjax.document($.html(), {
    InputJax: new TeX({ packages: AllPackages, inlineMath: [['$', '$'], ['\\(', '\\)']], displayMath: [['$$', '$$'], ['\\[', '\\]']], processEscapes: true }),
    OutputJax: new SVG({ fontCache: 'local' }),
    enableAssistiveMml: true,
  })
  document.render()
  const rendered = adaptor.innerHTML(adaptor.body(document.document))
    .replace(/\bid="(MJX-[^"]+)"/g, `id="pe-${key.slice(0, 12)}-$1"`)
    .replace(/((?:xlink:)?href)="#(MJX-[^"]+)"/g, `$1="#pe-${key.slice(0, 12)}-$2"`)
  if (/data-mjx-error|<merror/.test(rendered)) throw new Error('MathJax could not render a statement formula')
  writeFileSync(file, rendered)
  return rendered
}

function readContent() {
  return {
    official: JSON.parse(readFileSync(path.join(root, 'content/project-euler/official.json'), 'utf8')),
    translations: JSON.parse(readFileSync(path.join(root, 'content/project-euler/zh.json'), 'utf8')),
  }
}

function statementAsset(problem, translated, locale) {
  const html = locale === 'zh' ? translated.html : problem.html
  return `/project-euler/statements/${locale}/${problem.id}.${digest(`v2:${locale}:${html}`).slice(0, 16)}.json`
}

export function projectEulerPaths(locale) {
  const { official, translations } = readContent()
  return official.problems.map((problem) => {
    const translated = translations[problem.id]
    if (!translated?.html || translated.sourceSha256 !== problem.sha256 || translated.sourceTitle !== problem.title) throw new Error(`Missing or outdated translation for PE ${problem.id}`)
    const title = locale === 'zh' ? translated.title : problem.title
    return {
      params: { id: String(problem.id) },
      content: `---\nlayout: project-euler\nprojectEuler: ${problem.id}\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(locale === 'zh' ? `Project Euler 第 ${problem.id} 题：${title}。完整中文题目、公式、图片与数据文件。` : `Project Euler Problem ${problem.id}: ${title}. The complete original statement, diagrams, and input files.`)}\nfeed: false\nstatementAsset: ${statementAsset(problem, translated, locale)}\n---\n`,
    }
  })
}

// Keep large formula SVGs out of the module graph. The final HTML still contains
// the complete statement, and client navigation requests a small per-page file.
export function materializeStatements() {
  const { official, translations } = readContent()
  const directory = path.join(root, 'puzzle/.vitepress/dist')
  rmSync(path.join(directory, 'project-euler/statements'), { recursive: true, force: true })
  let count = 0
  for (const locale of ['en', 'zh']) {
    for (const problem of official.problems) {
      const translated = translations[problem.id]
      const html = renderStatement(locale === 'zh' ? translated.html : problem.html, locale)
      const asset = path.join(directory, statementAsset(problem, translated, locale))
      mkdirSync(path.dirname(asset), { recursive: true })
      writeFileSync(asset, JSON.stringify({ html }))
      const page = path.join(directory, locale === 'zh' ? 'zh' : '', `project-euler/${problem.id}.html`)
      const marker = `<!--pe-statement:${locale}:${problem.id}-->`
      const document = readFileSync(page, 'utf8')
      if (document.split(marker).length !== 2) throw new Error(`Expected one statement marker in ${page}`)
      writeFileSync(page, document.replace(marker, () => html))
      count++
    }
  }
  console.log(`Embedded ${count} full Project Euler statements and wrote their navigation assets`)
}

export function projectEulerStatementsPlugin() {
  return {
    name: 'project-euler-statements',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.split('?')[0].match(/^\/project-euler\/statements\/(en|zh)\/(\d+)\.[a-f0-9]{16}\.json$/)
        if (!match) return next()
        try {
          const { official, translations } = readContent()
          const locale = match[1]
          const problem = official.problems[Number(match[2]) - 1]
          const translated = translations[match[2]]
          if (!problem || !translated || req.url.split('?')[0] !== statementAsset(problem, translated, locale)) return next()
          const html = renderStatement(locale === 'zh' ? translated.html : problem.html, locale)
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ html }))
        } catch (error) { next(error) }
      })
    },
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) materializeStatements()
