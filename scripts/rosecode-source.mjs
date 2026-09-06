import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { load } from 'cheerio'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const directory = path.join(root, 'content/rosecode')
export const sourceUrl = 'https://rosecode.neocities.org/data/rose_problems.json'
export const digest = (value) => createHash('sha256').update(value).digest('hex')
export const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))
export async function saveJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`)
}
const run = promisify(execFile)
const addresses = new Map()
const authors = { 1: 'elasolova', 963: 'Philippe_57721', 921: 'gerrob', 675: 'sinan', 1003: 'Min_25', 1215: 'liuguangxi', 1251: 'C_K_Yang' }
const base = 'https://rosecode.neocities.org/'
const extensions = /\.(?:png|jpe?g|gif|bmp|svg|webp|txt|csv|gz|zip|exe|swf|wav|mp3|ogg)$/i

// These UTF-8 characters were decoded as Windows-1252 in the old database.
function repairEncoding(html) {
  const repairs = { 'â‰¤': '≤', 'â‰¥': '≥', 'âˆ—': '∗', 'âˆ‘': '∑', 'âˆš': '√', 'âŠ—': '⊗', 'â†“': '↓', 'â†‘': '↑', 'â†\u0090': '←', 'â†’': '→', 'â€“': '–', 'â€™': '’', 'â€œ': '“', 'â€\u009d': '”', 'â€¦': '…', 'â€¢': '•', 'â‚¬': '€', 'â€‚': ' ', 'â€Œ': '', 'â€‹': '', 'â\u0081„': '⁄', 'Ã—': '×', 'Ã¶': 'ö', 'Ã¼': 'ü', 'Ï€': 'π' }
  for (const [bad, good] of Object.entries(repairs)) html = html.replaceAll(bad, good)
  return html.replace(/Â(?=&nbsp;|[\u00a0²³°·])/g, '').replace(/<br\.>/gi, '<br>')
}

export function canonicalUrl(value) {
  if (value.startsWith('data:')) return value
  const url = new URL(value, base)
  if (['rosecode.neocities.org', 'www.rosecode.neocities.org', 'rosecode.com', 'www.rosecode.com'].includes(url.hostname)) {
    url.hostname = 'rosecode.neocities.org'
    url.protocol = 'https:'
  }
  if (['javaist.com', 'www.javaist.com'].includes(url.hostname) && url.pathname.startsWith('/rosecode/')) {
    url.hostname = 'rosecode.neocities.org'
    url.protocol = 'https:'
    url.pathname = url.pathname.slice('/rosecode'.length)
  }
  if (url.hostname === 'i.imgur.com') url.protocol = 'https:'
  return url.href
}

async function download(url) {
  const parsed = new URL(url)
  // Resolve for this process only; leave system DNS, Clash and TLS checks alone.
  if (!addresses.has(parsed.hostname)) {
    const { stdout } = await run('curl', ['-fsS', '--max-time', '15', '-H', 'Accept: application/dns-json', `https://cloudflare-dns.com/dns-query?name=${parsed.hostname}&type=A`])
    const ip = JSON.parse(stdout).Answer?.find((item) => item.type === 1)?.data
    if (!ip) throw new Error(`DNS lookup failed for ${parsed.hostname}`)
    addresses.set(parsed.hostname, ip)
  }
  const routing = parsed.hostname === 'rosecode.neocities.org' ? ['--noproxy', '*', '--resolve', `${parsed.hostname}:${parsed.port || (parsed.protocol === 'https:' ? 443 : 80)}:${addresses.get(parsed.hostname)}`] : process.env.ROSECODE_RESOURCE_PROXY ? ['--proxy', process.env.ROSECODE_RESOURCE_PROXY] : []
  const args = ['-sS', '-L', '--max-time', '20', '--max-redirs', '3', ...routing, '-w', '\n%{http_code}\n%{content_type}', url]
  const { stdout } = await run('curl', args, { encoding: 'buffer', maxBuffer: 30 * 1024 * 1024 })
  const last = stdout.lastIndexOf(10)
  const statusStart = stdout.lastIndexOf(10, last - 1)
  const status = Number(stdout.subarray(statusStart + 1, last).toString())
  return { status, contentType: stdout.subarray(last + 1).toString(), data: stdout.subarray(0, statusStart) }
}

function resourceReferences(problems) {
  const found = new Map()
  for (const problem of problems) {
    const $ = load(problem.originalHtml, {}, false)
    $('img[src], embed[src], object[data], param[name="movie"], a[href], [style*="background-image"]').each((_, element) => {
      const value = $(element).attr('src') || $(element).attr('data') || $(element).attr('value') || $(element).attr('href') || $(element).attr('style')?.match(/background-image\s*:\s*url\(['"]?([\s\S]*?)['"]?\)/i)?.[1]
      if (!value || value === '#') return
      const url = canonicalUrl(value)
      if (element.name === 'a' && !extensions.test(new URL(url).pathname)) return
      if (!url.startsWith('data:') && !/^https?:/.test(url)) throw new Error(`Unsupported resource URL in RC ${problem.id}`)
      const key = url.startsWith('data:') ? `embedded:${digest(url)}` : url
      if (!found.has(key)) found.set(key, { url: key, value: url, problems: [] })
      if (!found.get(key).problems.includes(problem.id)) found.get(key).problems.push(problem.id)
    })
  }
  return [...found.values()]
}

async function archiveResources(problems, previous, fromCache, refresh) {
  const refs = resourceReferences(problems)
  const resources = []
  for (const [index, reference] of refs.entries()) {
    const existing = previous.find((item) => item.url === reference.url)
    if (existing && (!refresh || fromCache)) {
      if (existing.localPath) await access(path.join(root, 'puzzle/public', existing.localPath))
      resources.push({ ...existing, problems: reference.problems })
      continue
    }
    if (fromCache) throw new Error(`Resource has not been checked: ${reference.url}`)
    let response
    if (reference.value.startsWith('data:')) {
      const match = reference.value.match(/^data:([^;,]+);base64,([\s\S]+)$/)
      if (!match) throw new Error(`Unsupported embedded image in RC ${reference.problems}`)
      response = { status: 200, contentType: match[1], data: Buffer.from(match[2], 'base64') }
    } else response = await download(reference.value)
    const item = { url: reference.url, problems: reference.problems, checkedAt: new Date().toISOString(), status: response.status }
    if ([404, 410].includes(response.status)) resources.push(item)
    else {
      if (response.status !== 200 || !response.data.length || /text\/html/.test(response.contentType)) throw new Error(`Resource failed: ${reference.url} (HTTP ${response.status}, ${response.contentType})`)
      let extension = path.extname(new URL(reference.value.startsWith('data:') ? base : reference.value).pathname).toLowerCase()
      const signature = response.data.subarray(0, 12)
      if (signature.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) extension = '.png'
      else if (signature.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) extension = '.jpg'
      else if (signature.toString().startsWith('GIF8')) extension = '.gif'
      else if (signature.toString().startsWith('BM')) extension = '.bmp'
      if (!extension) throw new Error(`Cannot identify resource ${reference.url}`)
      const sha256 = digest(response.data)
      const localPath = `/rosecode/resources/${sha256.slice(0, 20)}${extension}`
      const file = path.join(root, 'puzzle/public', localPath)
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, response.data)
      resources.push({ ...item, localPath, sha256, bytes: response.data.length })
    }
    await saveJson(path.join(root, '.cache/rosecode/resources.json'), resources)
    console.log(`Resources ${index + 1}/${refs.length}: ${response.status}`)
  }
  return resources
}

export function cleanStatement(problem, resources, problems, locale = 'en') {
  const $ = load(repairEncoding(problem.originalHtml), {}, false)
  const prefix = locale === 'zh' ? '/zh' : ''
  const limitations = new Set()
  const resourceFor = (value) => {
    const url = canonicalUrl(value)
    return resources.find((item) => item.url === (url.startsWith('data:') ? `embedded:${digest(url)}` : url))
  }
  $('script').each((_, element) => {
    const script = $(element).html()?.trim()
    if (!$(element).attr('src') && script && $(element).attr('type') !== 'text/x-mathjax-config' && !/MathJax\.Hub\.(?:Config|Queue)/.test(script)) {
      $(element).replaceWith($('<pre class="rc-source-code notranslate"><code></code></pre>').find('code').text(script).end())
      limitations.add('interactive')
    } else $(element).remove()
  })
  $('input').each((_, element) => {
    const type = $(element).attr('type') || 'text'
    const value = $(element).attr('value') || ''
    if (type !== 'submit' && type !== 'button') $(element).replaceWith($('<code></code>').text(`${$(element).attr('name') || 'input'}${value ? ` = ${value}` : ''}`))
    else $(element).remove()
  })
  $('form').each((_, element) => { limitations.add('interactive'); $(element).replaceWith($(element).contents()) })
  $('object, embed').each((_, element) => {
    if (!$.contains($.root()[0], element)) return
    limitations.add('interactive')
    const value = $(element).attr('data') || $(element).attr('src') || $(element).find('param[name="movie"]').attr('value') || $(element).find('embed').attr('src')
    const resource = value ? resourceFor(value) : undefined
    const replacement = $('<p class="rc-resource-note"></p>').text(locale === 'zh' ? '原题包含 Flash 交互。' : 'The original problem included a Flash interaction.')
    if (resource?.localPath) replacement.append(' ', $('<a download></a>').attr('href', resource.localPath).text(locale === 'zh' ? '下载原文件' : 'Download the original file'))
    else if (value) { replacement.append(' ', $('<code></code>').text(value)); limitations.add(`missing:${value}`) }
    $(element).replaceWith(replacement)
  })
  $('iframe, param, link, meta, style, base').remove()
  $('span, font').each((_, element) => {
    if (/^\s*uint8 grid\[NROWS\*NCOLS\]/.test($(element).text())) $(element).replaceWith($('<pre class="rc-source-code notranslate"><code></code></pre>').find('code').text($(element).text().trim()).end())
  })
  $('[style*="background-image"]').each((_, element) => {
    const value = $(element).attr('style').match(/background-image\s*:\s*url\(['"]?([\s\S]*?)['"]?\)/i)?.[1]
    const resource = value ? resourceFor(value) : undefined
    if (!resource) throw new Error(`Unchecked background image in RC ${problem.id}`)
    const image = $('<img>').attr('alt', 'Original puzzle background')
    if (resource.localPath) {
      image.attr('src', resource.localPath)
      // The image itself is puzzle data, including BMP payload bytes.
      $(element).after($('<a class="rc-background-download" download></a>').attr('href', resource.localPath).append(image))
    } else {
      limitations.add(`missing:${value}`)
      $(element).after($('<p class="rc-resource-note"></p>').text(`Original background image unavailable: ${value}`))
    }
  })
  // The archive also used <pre> for ordinary prose. Keep literal programs and
  // puzzle data preformatted, but let prose wrap and participate in translation.
  const literalPreProblems = new Set([145, 154, 158, 188, 234, 253, 278, 282, 290, 295, 339, 351, 357, 367, 370, 455, 467, 480])
  $('pre:not(.rc-source-code)').each((_, element) => {
    if (!literalPreProblems.has(problem.id) && /[A-Za-z]{3}/.test($(element).text())) {
      element.name = 'div'
      $(element).attr('class', 'rc-prose-block')
    }
  })
  $('img[src]').each((_, element) => {
    const value = $(element).attr('src')
    if (value.startsWith('/rosecode/resources/')) return
    const resource = resourceFor(value)
    if (!resource) throw new Error(`Unchecked image in RC ${problem.id}`)
    if (resource.localPath) $(element).attr('src', resource.localPath).attr('loading', 'lazy')
    else {
      limitations.add(`missing:${value}`)
      $(element).replaceWith($('<span class="rc-resource-note"></span>').text(`${locale === 'zh' ? '原存档图片已失效：' : 'Image unavailable in the archive: '}${value}`))
    }
  })
  $('a[href]').each((_, element) => {
    const value = $(element).attr('href')
    if (!value || value.startsWith('#')) return
    if (value.startsWith('/rosecode/resources/')) return
    const url = new URL(canonicalUrl(value))
    if (!['https:', 'http:'].includes(url.protocol)) { $(element).removeAttr('href'); return }
    const resource = resourceFor(value)
    if (resource) {
      if (resource.localPath) $(element).attr('href', resource.localPath)
      else {
        limitations.add(`missing:${value}`)
        $(element).replaceWith($('<span></span>').append($(element).contents(), $('<small class="rc-resource-note"></small>').text(locale === 'zh' ? '（原附件已失效）' : ' (original attachment unavailable)')))
      }
      return
    }
    if (url.hostname === 'rosecode.neocities.org') {
      const originalId = url.pathname === '/show.php' ? Number(url.searchParams.get('no')) : null
      const archived = /\/problem(?:\.html)?$/.test(url.pathname) ? problems.find((p) => p.archiveNumber === Number(url.searchParams.get('id')))?.id : null
      if ((originalId || archived) && problems.some((p) => p.id === (originalId || archived))) $(element).attr('href', `${prefix}/rosecode/${originalId || archived}`)
      else if (/\.php$|\/real\//.test(url.pathname) && !/\/user\.php$/.test(url.pathname)) {
        limitations.add('interactive')
        $(element).replaceWith($('<span></span>').append($(element).contents(), $('<small class="rc-resource-note"></small>').text(locale === 'zh' ? '（原交互页面不可用）' : ' (original interactive page unavailable)')))
      } else $(element).attr('href', url.href)
    } else $(element).attr('href', url.href)
  })
  $('font[color]').each((_, element) => {
    const color = $(element).attr('color')
    if (/^(#fff(?:fff)?|white)$/i.test(color)) {
      const clue = $('<details class="rc-hidden-clue"><summary>Hidden text in the original</summary><span class="rc-original-clue notranslate"></span></details>')
      clue.find('span').append($(element).contents())
      $(element).replaceWith(clue)
    } else if (/^(#[a-f\d]{3,8}|[a-z]+)$/i.test(color)) $(element).attr('style', `color:${color}`)
  })
  $('center, font').each((_, element) => { element.name = element.name === 'center' ? 'div' : 'span' })
  $('p').each((_, element) => {
    if (/<br\b/.test($(element).html() || '') && /-{4,}|(?:\*\s+){3}/.test($(element).text())) $(element).attr('class', 'rc-ascii')
  })
  const allowed = new Set(['p', 'br', 'b', 'strong', 'em', 'i', 'u', 's', 'a', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'img', 'pre', 'code', 'sub', 'sup', 'hr', 'div', 'span', 'small', 'tt', 'blockquote', 'var', 'svg', 'polygon', 'details', 'summary'])
  const attributes = new Set(['href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'loading', 'download', 'viewBox', 'viewbox', 'points', 'width', 'height'])
  $('*').each((_, element) => {
    if (!allowed.has(element.name)) throw new Error(`Unexpected <${element.name}> in RC ${problem.id}`)
    for (const key of Object.keys(element.attribs)) {
      if (key === 'class' && /^(rc-source-code notranslate|rc-resource-note|rc-prose-block|rc-hidden-clue|rc-original-clue notranslate|rc-background-download|rc-ascii)$/.test(element.attribs[key])) continue
      if (key === 'style') {
        const safe = element.attribs.style.split(';').map((rule) => rule.trim()).filter((rule) => /^(?:color|background-color|fill|stroke)\s*:\s*(?:#[a-f\d]{3,8}|[a-z]+|rgb\([\d,\s]+\))$/i.test(rule) || /^(?:width|height|stroke-width)\s*:\s*\d+(?:px|%)?$/i.test(rule) || /^font-style\s*:\s*italic$/i.test(rule)).join(';')
        if (safe) { element.attribs.style = safe; continue }
      }
      if (!attributes.has(key)) delete element.attribs[key]
    }
    if (element.name === 'a' && /^https?:/.test(element.attribs.href || '')) $(element).attr('target', '_blank').attr('rel', 'noreferrer')
  })
  if (problem.type === 'BF') limitations.add('code-submission')
  // RC 545 lists operators; a bare caret is not a complete TeX expression.
  const html = $.html().trim()
    .replaceAll('$10000th$', '$10000$th').replaceAll('$78200th$', '$78200$th')
    .replace('$+ - * / ^ $', '<code>+ - * / ^</code>')
    .replace(' \\textrm{ find the first index such as the denominator of } Z_i \\textrm{ is } \\gt 10^{50} $', ' $, find the first index $i$ for which the denominator of $Z_i$ is greater than $10^{50}$.')
  return { html, limitations: [...limitations] }
}

export async function generateCatalog() {
  const source = await readJson(path.join(directory, 'source.json'))
  const zh = await readJson(path.join(directory, 'zh.json'))
  const records = source.problems.map(({ id, title, author, category, publishedAt, archiveNumber, sha256, limitations }) => {
    const translated = zh[id]
    if (!translated?.title || !translated.html || translated.sourceSha256 !== sha256 || translated.sourceTitle !== title) throw new Error(`Missing or outdated Chinese translation: RC ${id}`)
    return { id, title, titleZh: translated.title, author, category, publishedAt, archiveNumber, limitations }
  })
  await writeFile(path.join(root, 'puzzle/.vitepress/theme/data/rosecode.ts'), `// Generated by scripts/rosecode-source.mjs.\nexport const roseCodeProblems = ${JSON.stringify(records, null, 2)}\n`)
  console.log(`Generated ${records.length} RoseCode index entries`)
}

async function sync() {
  const fromCache = process.argv.includes('--from-cache')
  if (fromCache) return generateCatalog()
  const inputAt = process.argv.indexOf('--source')
  const raw = inputAt >= 0 ? await readFile(path.resolve(process.argv[inputAt + 1])) : (await download(sourceUrl)).data
  const rows = JSON.parse(raw.toString())
  const problems = rows.map((item, index) => ({ id: Number(item.np), sourceRecordId: Number(item.id), archiveNumber: index + 1, title: load(repairEncoding(item.title), {}, false).text().trim(), originalHtml: item.body, type: item.type, input: item.input, author: authors[item.authid] || '', category: item.type2, publishedAt: item.entered.split(' ')[0] })).filter((item) => item.id > 0).sort((a, b) => a.id - b.id)
  if (problems.length !== 570 || problems.some((item, index) => item.id !== index + 1 || !item.title || !item.originalHtml.trim() || !item.author)) throw new Error('Unexpected RoseCode catalog; review source before importing')
  const savedResources = await readJson(path.join(directory, 'resources.json')).catch(() => [])
  const partialResources = await readJson(path.join(root, '.cache/rosecode/resources.json')).catch(() => [])
  const previous = [...new Map([...savedResources, ...partialResources].map((item) => [item.url, item])).values()]
  const resources = await archiveResources(problems, previous, false, process.argv.includes('--refresh'))
  for (const problem of problems) {
    Object.assign(problem, cleanStatement(problem, resources, problems))
    problem.sha256 = digest(problem.html)
  }
  await saveJson(path.join(directory, 'source.json'), { sourceUrl, sourceSha256: digest(raw), fetchedAt: new Date().toISOString(), excluded: rows.filter((item) => Number(item.np) === 0).map(({ id, title }) => ({ sourceRecordId: Number(id), title })), problems })
  await saveJson(path.join(directory, 'resources.json'), resources)
  console.log(`Imported ${problems.length} statements and checked ${resources.length} resources`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await sync()
