import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const baseUrl = 'https://www.gushiwenku.cn'

const collections = [
  { stage: 'junior', path: '/xuanji/chuzhong-gushi/' },
  { stage: 'senior', path: '/xuanji/gaozhong-gushi/' },
]

const bookLabels = {
  '七年级上册': '七年级上册',
  '七年级下册': '七年级下册',
  '八年级上册': '八年级上册',
  '八年级下册': '八年级下册',
  '九年级上册': '九年级上册',
  '九年级下册': '九年级下册',
  '必修（上册）': '必修上册',
  '必修（下册）': '必修下册',
  '选修（上册）': '选择性必修上册',
  '选修（中册）': '选择性必修中册',
  '选修（下册）': '选择性必修下册',
}

const dynastyAliases = {
  '近现代': '近现代', '近代': '近现代', '现代': '现代', '当代': '当代',
  '先秦': '先秦', '两汉': '两汉', '汉代': '两汉', '汉乐府': '两汉',
  '魏晋': '魏晋', '南北朝': '南北朝', '隋代': '隋代', '唐代': '唐代',
  '五代': '五代', '宋代': '宋代', '金朝': '金代', '元代': '元代',
  '明代': '明代', '清代': '清代',
}

const proseHints = /记|表|论|序|传|书|说|疏|赋|宴|事|章|四章|十二章|解牛|劝学|兼爱|北冥有鱼|濠梁|不能淫|忧患|嘉肴|大道|军细柳|石兽|世家|冤|促织|五石之瓠|大学之道|侍坐|不忍人之心|穿井|杞人忧天|狼|咏雪|陈太丘/
const protectedAuthors = new Set(['毛泽东'])

function decodeHtml(value) {
  const entities = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', mdash: '—', middot: '·', hellip: '…',
  }
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name] ?? match)
}

function stripTags(value) {
  return decodeHtml(value.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/\r/g, '').trim()
}

function safeYaml(value) {
  return JSON.stringify(value.replace(/\s+/g, ' ').trim())
}

function slugify(title, fallback) {
  const ascii = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return ascii || fallback
}

function classify(title) {
  return proseHints.test(title) ? '文言文' : '诗词曲'
}

async function fetchText(url) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'DezhongerKnowledge/1.0 content-sync' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
      return response.text()
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise((resolvePromise) => setTimeout(resolvePromise, 500 * attempt))
    }
  }
  throw lastError
}

function parseCollection(html, stage) {
  const works = []
  const sectionPattern = /<section class="card" id="([^"]+)">[\s\S]*?<ul class="poem-works-list">([\s\S]*?)<\/ul><\/section>/g
  for (const section of html.matchAll(sectionPattern)) {
    const sourceBook = stripTags(section[1])
    const book = bookLabels[sourceBook]
    if (!book) continue
    const itemPattern = /href="\/shiwen\/([a-z0-9]+)\/"[^>]*>[\s\S]*?<h3[^>]*>《([\s\S]*?)》<\/h3>[\s\S]*?<span class="works-author">([\s\S]*?)<\/span>/g
    for (const item of section[2].matchAll(itemPattern)) {
      works.push({ id: item[1], title: stripTags(item[2]), author: stripTags(item[3]), book, stage })
    }
  }
  return works
}

function parseWork(html, work) {
  const content = html.match(/<article class="poem-content"[^>]*>([\s\S]*?)<\/article>/)?.[1]
  if (!content) throw new Error(`No original content found for ${work.title}`)
  const paragraphs = [...content.matchAll(/<p class="original">([\s\S]*?)<\/p>/g)].map((match) => stripTags(match[1])).filter(Boolean)
  if (!paragraphs.length) throw new Error(`No paragraphs found for ${work.title}`)
  const dynastyRaw = stripTags(html.match(/<span class="poem-dynasty">[〔\[]?([\s\S]*?)[〕\]]?<\/span>/)?.[1] || '')
  const dynasty = dynastyAliases[dynastyRaw] || dynastyRaw || '时代未详'
  const literaryForm = stripTags(html.match(/文学体裁：<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/)?.[1] || '')
  const genre = /诗|词|曲|乐府/.test(literaryForm) ? '诗词曲' : literaryForm ? '文言文' : classify(work.title)
  return { ...work, dynasty, genre, paragraphs }
}

function markdown(work) {
  const stageText = work.stage === 'junior' ? '初中' : '高中'
  const body = work.copyrightProtected
    ? `## 阅读说明

这篇作品仍在著作权保护期内，本站只保留教材目录、作者与分册信息，不直接复制全文。请以正版教材或经授权的出版物为准。`
    : `## 原文

${work.paragraphs.join('\n\n')}

<p class="source-note">原文校录参考：<a href="${work.sourceUrl}" target="_blank" rel="noreferrer">古诗文库条目</a>。本站仅收录公共领域原文，不复制现代译文和赏析。</p>`
  return `---
title: ${safeYaml(work.title)}
description: ${safeYaml(`${work.book} ${work.author}《${work.title}》原文。`)}
book: ${safeYaml(work.book)}
stage: ${safeYaml(stageText)}
genre: ${safeYaml(work.genre)}
author: ${safeYaml(work.author)}
dynasty: ${safeYaml(work.dynasty)}
---

# ${work.title}

<div class="work-meta"><span>${work.dynasty}</span><span>${work.author}</span><span>${stageText} · ${work.book}</span><span>${work.genre}</span>${work.copyrightProtected ? '<span>版权保护期内</span>' : ''}</div>

${body}
`
}

function indexMarkdown(stage, works) {
  const stageText = stage === 'junior' ? '初中' : '高中'
  const bookOrder = Object.values(bookLabels).filter((book) => works.some((work) => work.book === book))
  const availableCount = works.filter((work) => !work.copyrightProtected).length
  const sections = bookOrder.map((book) => {
    const items = works.filter((work) => work.book === book)
    return `## ${book}\n\n${items.map((work) => `- [${work.title}](${work.link}) · ${work.author} · ${work.genre}${work.copyrightProtected ? ' · 版权保护期内' : ''}`).join('\n')}`
  }).join('\n\n')
  return `---
title: ${stageText}古诗文
description: 按教材分册整理的${stageText}古诗文完整目录。
---

# ${stageText}古诗文

<div class="catalog-stats"><strong>${works.length}</strong><span>篇教材条目</span><strong>${availableCount}</strong><span>篇公共领域原文</span><strong>${bookOrder.length}</strong><span>册教材</span></div>

按教材分册收录，每篇均有独立、可检索的页面。公共领域作品提供完整原文；仍在著作权保护期内的作品只提供目录信息。页面上方可以使用本地全文搜索；下方目录可按分册浏览。

${sections}
`
}

async function mapConcurrent(items, limit, mapper) {
  const result = new Array(items.length)
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      result[index] = await mapper(items[index], index)
      if ((index + 1) % 20 === 0) console.log(`Fetched ${index + 1}/${items.length}`)
    }
  }
  await Promise.all(Array.from({ length: limit }, worker))
  return result
}

async function main() {
  const manifestPath = resolve(root, 'guwen/data/works.json')
  const useCache = process.argv.includes('--from-cache')
  let works

  if (useCache) {
    works = JSON.parse(await readFile(manifestPath, 'utf8'))
  } else {
    const indexes = await Promise.all(collections.map(async (collection) => {
      const html = await fetchText(`${baseUrl}${collection.path}`)
      return parseCollection(html, collection.stage)
    }))
    const summaries = indexes.flat()
    works = await mapConcurrent(summaries, 8, async (work) => {
      const sourceUrl = `${baseUrl}/shiwen/${work.id}/`
      // 尚未进入公共领域的现代作品只生成教材目录页，不复制正文。
      if (protectedAuthors.has(work.author)) {
        return { ...work, dynasty: '现代', genre: '诗词曲', paragraphs: [], copyrightProtected: true, sourceUrl }
      }
      return { ...parseWork(await fetchText(sourceUrl), work), sourceUrl }
    })
  }

  const usedSlugs = new Set()
  works = works.map((work) => {
    let slug = slugify(work.title, work.id)
    if (usedSlugs.has(`${work.stage}/${slug}`)) slug = `${slug}-${work.id}`
    usedSlugs.add(`${work.stage}/${slug}`)
    return { ...work, slug, link: `/${work.stage}/works/${slug}` }
  })

  for (const stage of ['junior', 'senior']) {
    await rm(resolve(root, `guwen/${stage}/works`), { recursive: true, force: true })
  }
  await mkdir(resolve(root, 'guwen/data'), { recursive: true })
  await writeFile(manifestPath, `${JSON.stringify(works, null, 2)}\n`)

  for (const work of works) {
    const path = resolve(root, 'guwen', work.stage, 'works', `${work.slug}.md`)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, markdown(work))
  }

  for (const stage of ['junior', 'senior']) {
    const stageWorks = works.filter((work) => work.stage === stage)
    const path = resolve(root, 'guwen', stage, 'index.md')
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, indexMarkdown(stage, stageWorks))
  }

  const juniorCount = works.filter((work) => work.stage === 'junior').length
  const seniorCount = works.filter((work) => work.stage === 'senior').length
  console.log(`Generated ${works.length} works: junior ${juniorCount}, senior ${seniorCount}`)
}

await main()
