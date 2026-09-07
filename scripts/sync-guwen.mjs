import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const baseUrl = 'https://www.gushiwenku.cn'

const curriculum = JSON.parse(await readFile(resolve(root, 'guwen/data/curriculum.json'), 'utf8'))
const stageLabels = { primary: '小学', junior: '初中', senior: '高中', classic: '课外经典' }

const collections = [
  { stage: 'primary', path: '/xuanji/xiaoxue-gushi/' },
  { stage: 'junior', path: '/xuanji/chuzhong-gushi/' },
  { stage: 'senior', path: '/xuanji/gaozhong-gushi/' },
]

const bookLabels = {
  ...Object.fromEntries(curriculum.books.map(({ name }) => [name, name])),
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

export function classify(title, literaryForm = '') {
  if (/杂剧|戏剧|戏曲|传奇/.test(literaryForm) || /窦娥冤|^游园（/.test(title)) return '戏曲'
  if (/白话小说|章回小说/.test(literaryForm)) return '古典小说'
  if (/诗|词|曲|乐府|绝句|律|古风|民歌/.test(literaryForm)) return '诗词曲'
  if (/文|寓言|传|笔记/.test(literaryForm)) return '文言文'
  return proseHints.test(title) ? '文言文' : '诗词曲'
}

function sourceKeys(work) {
  const title = work.title?.replace(/[《》()（）·，、\s]/g, '').replace(/并序|节选|高中课文/g, '')
  return [work.id, work.sourceId].filter(Boolean).map((id) => `${work.stage}/${id}`)
    .concat(title && work.author ? [`${work.stage}/title/${title}/${work.author}`] : [])
}

// 已校订的作者、体裁、节选及分册优先；同步只补充新条目。
export function mergeWorks(existing, incoming) {
  const known = new Set(existing.flatMap(sourceKeys))
  return [...existing, ...incoming.filter((work) => {
    const keys = sourceKeys(work)
    if (keys.some((key) => known.has(key))) return false
    keys.forEach((key) => known.add(key))
    return true
  })]
}

function htmlEscape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\"', '&quot;')
}

async function fetchText(url) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'DezhongerKnowledge/1.0 content-sync' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
      return await response.text()
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
  const genre = classify(work.title, literaryForm)
  return { ...work, dynasty, genre, paragraphs }
}

function markdown(work) {
  const stageText = stageLabels[work.stage]
  const body = work.copyrightProtected
    ? `## 阅读说明

这篇作品仍在著作权保护期内，本站只保留教材目录、作者与分册信息，不直接复制全文。请以正版教材或经授权的出版物为准。`
    : `## 原文

${work.paragraphs.map(htmlEscape).join('\n\n')}

<p class="source-note">原文校录参考：<a href="${htmlEscape(work.sourceUrl)}" target="_blank" rel="noreferrer">${htmlEscape(work.sourceTitle || '原文参考出处')}</a>。本站仅收录公共领域原文，不复制现代译文和赏析。</p>`
  return `---
title: ${safeYaml(work.title)}
description: ${safeYaml(`${work.book} ${work.author}《${work.title}》原文。`)}
book: ${safeYaml(work.book)}
stage: ${safeYaml(stageText)}
genre: ${safeYaml(work.genre)}
author: ${safeYaml(work.author)}
dynasty: ${safeYaml(work.dynasty)}
---

# ${htmlEscape(work.title)}

<div class="work-meta"><span>${work.dynasty}</span><span>${work.author}</span><span>${stageText} · ${htmlEscape([work.book, ...(work.additionalBooks || [])].join('、'))}</span><span>${work.genre}</span>${work.copyrightProtected ? '<span>版权保护期内</span>' : ''}</div>

${work.readingNote ? `> ${htmlEscape(work.readingNote)}\n\n` : ''}${body}
`
}

function indexMarkdown(stage, works) {
  const stageText = stageLabels[stage]
  const bookOrder = curriculum.books.filter((book) => book.stage === stage)
  const availableCount = works.filter((work) => !work.copyrightProtected).length
  return `---
title: ${stageText}古诗文
description: 按教材分册整理的${stageText}古诗文目录。
---

# ${stageText}古诗文

<div class="catalog-stats"><strong>${works.length}</strong><span>篇教材条目</span><strong>${availableCount}</strong><span>篇原文</span><strong>${bookOrder.length}</strong><span>册教材</span></div>

按教材分册阅读古诗词、文言文与古典文学节选。可按篇名、作者或原文词句搜索，也可用下方目录筛选。不同版本的选篇与节选范围可能不同，相关差异在文章中注明；保护期内作品保留目录信息。\n\n[查看教材范围与核对说明](/curriculum)

<GuwenCatalog stage="${stage}" />
`
}

function classicsIndexMarkdown(works) {
  return `---
title: 经典名篇
description: 教材之外值得反复阅读的古代诗文经典。
---

# 经典名篇

<div class="catalog-stats"><strong>${works.length}</strong><span>篇课外经典</span><strong>${new Set(works.map((work) => work.dynasty)).size}</strong><span>个时代</span><strong>${new Set(works.map((work) => work.author)).size}</strong><span>位作者</span></div>

这里收录教材基础篇目之外值得反复阅读的古诗文。部分作品曾入选旧版或其他选修教材，阅读时可结合文章的版本说明。

<GuwenCatalog stage="classic" />
`
}

function curriculumMarkdown(works) {
  const rows = curriculum.books.map((book) => {
    const visible = works.filter((work) => work.stage === book.stage && (work.book === book.name || work.additionalBooks?.includes(book.name)))
    return `| ${stageLabels[book.stage]} | ${book.name} | ${book.requiredWorks.length} | ${visible.length} | [参考教材](${book.sourceUrl}) |`
  })
  return `---
title: 教材范围与核对说明
description: 小学至高中二十三册参考教材、收录范围与版本说明。
---

# 教材范围与核对说明

本站按小学十二册、初中六册、高中必修两册与选择性必修三册整理古诗文。参考教材为人教社公开的电子教材，核对日期为 **${curriculum.checkedAt}**。

## 收录范围

收录有独立篇名的古诗词、文言文、蒙学韵文、民间时令歌谣和古典小说、戏曲节选，兼顾课文、日积月累、古诗词诵读及相关阅读链接。零散引用的名句、成语和格言不单独算作文章；现代白话改写、现代教辅解析和整本书全文不在这一篇目范围内。

## 分册目录

“核对篇目”对应参考教材中的独立作品；“阅读条目”还包括保留的旧版作品。同一作品在不止一册中出现时，会列入各册目录，原文共用同一阅读页面。保护期内的现代作品只提供目录信息。

| 学段 | 分册 | 核对篇目 | 阅读条目 | 出处 |
| --- | --- | ---: | ---: | --- |
${rows.join('\n')}

## 版本与节选

官方电子教材的上、下册可能处于不同修订年份。本次核对以各行链接指向的版本为准，不能用一个“新版”标签概括所有分册。旧版篇目继续保留，并在需要时注明原来的分册。

例如，《梅岭三章》在新版七年级上册出现；九年级上册新增或调整了部分古文和课外诵读；小学部分诗词也调整了分册。阅读时请对照手中的教材。

古籍不同版本的用字、标点和分段可能不同。节选注明范围，原著章节与教材删节不同的地方另作说明。这里的覆盖范围是上述参考教材中的古诗文篇目，并不代表收录了历史上全部古文。
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
  const existing = JSON.parse(await readFile(manifestPath, 'utf8'))

  if (useCache) {
    works = existing
  } else {
    const indexes = await Promise.all(collections.map(async (collection) => {
      const html = await fetchText(`${baseUrl}${collection.path}`)
      return parseCollection(html, collection.stage)
    }))
    const summaries = mergeWorks(existing, indexes.flat()).slice(existing.length)
    works = await mapConcurrent(summaries, 8, async (work) => {
      const sourceUrl = `${baseUrl}/shiwen/${work.id}/`
      // 尚未进入公共领域的现代作品只生成教材目录页，不复制正文。
      if (protectedAuthors.has(work.author)) {
        return { ...work, dynasty: '现代', genre: '诗词曲', paragraphs: [], copyrightProtected: true, sourceUrl }
      }
      return { ...parseWork(await fetchText(sourceUrl), work), sourceUrl }
    })
    works = mergeWorks(existing, works)
  }

  const usedSlugs = new Set()
  works = works.map((work) => {
    let slug = work.slug || slugify(work.title, work.id)
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid slug: ${slug}`)
    if (usedSlugs.has(`${work.stage}/${slug}`)) slug = `${slug}-${work.id}`
    usedSlugs.add(`${work.stage}/${slug}`)
    return { ...work, slug, link: `/${work.stage}/works/${slug}` }
  })

  for (const work of works) {
    if (!stageLabels[work.stage] || (!work.copyrightProtected && !work.paragraphs?.length)) {
      throw new Error(`Invalid or empty work: ${work.title}`)
    }
  }
  await mkdir(resolve(root, 'guwen/data'), { recursive: true })
  await writeFile(manifestPath, `${JSON.stringify(works, null, 2)}\n`)

  for (const work of works) {
    const path = resolve(root, 'guwen', work.stage, 'works', `${work.slug}.md`)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, markdown(work))
  }

  for (const stage of ['primary', 'junior', 'senior']) {
    const stageWorks = works.filter((work) => work.stage === stage)
    const path = resolve(root, 'guwen', stage, 'index.md')
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, indexMarkdown(stage, stageWorks))
  }

  const classicWorks = works.filter((work) => work.stage === 'classic')
  await mkdir(resolve(root, 'guwen/classic'), { recursive: true })
  await writeFile(resolve(root, 'guwen/classic/index.md'), classicsIndexMarkdown(classicWorks))
  await writeFile(resolve(root, 'guwen/curriculum.md'), curriculumMarkdown(works))

  const juniorCount = works.filter((work) => work.stage === 'junior').length
  const seniorCount = works.filter((work) => work.stage === 'senior').length
  const primaryCount = works.filter((work) => work.stage === 'primary').length
  console.log(`Generated ${works.length} works: primary ${primaryCount}, junior ${juniorCount}, senior ${seniorCount}, classics ${classicWorks.length}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main()
