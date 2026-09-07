import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import * as cheerio from 'cheerio'

const root = resolve(import.meta.dirname, '..')
const works = JSON.parse(await readFile(resolve(root, 'guwen/data/works.json'), 'utf8'))
const curriculum = JSON.parse(await readFile(resolve(root, 'guwen/data/curriculum.json'), 'utf8'))
const counts = { primary: 12, junior: 6, senior: 5 }
const genres = new Set(['诗词曲', '文言文', '古典小说', '戏曲', '蒙学韵文'])
const keys = new Set(), links = new Set()
const normalize = (text) => text.replace(/\s+/g, '')

for (const work of works) {
  const key = `${work.stage}/${work.id}`
  assert.ok(!keys.has(key), `重复篇目：${key}`)
  keys.add(key)
  assert.ok(!links.has(work.link), `重复链接：${work.link}`)
  links.add(work.link)
  assert.ok(['primary', 'junior', 'senior', 'classic'].includes(work.stage), `未知学段：${key}`)
  assert.ok(genres.has(work.genre), `未知体裁：${work.title}`)
  for (const field of ['title', 'author', 'dynasty', 'book']) {
    assert.ok(typeof work[field] === 'string' && work[field].trim() && !/[<>]/.test(work[field]), `${key} 缺少或含无效的 ${field}`)
  }
  assert.match(work.slug, /^[a-z0-9-]+$/)
  assert.equal(work.link, `/${work.stage}/works/${work.slug}`)
  assert.equal(new URL(work.sourceUrl).protocol, 'https:')
  assert.ok(Array.isArray(work.paragraphs))
  if (work.copyrightProtected) assert.equal(work.paragraphs.length, 0, `目录条目不应含正文：${key}`)
  else assert.ok(work.paragraphs.length && work.paragraphs.every((line) => typeof line === 'string' && line.trim()), `原文为空：${key}`)
  const markdown = await readFile(resolve(root, `guwen${work.link}.md`), 'utf8')
  assert.ok(markdown.includes(work.copyrightProtected ? '## 阅读说明' : '## 原文'), `缺少正文分区：${key}`)
  if (process.argv.includes('--built')) {
    const html = await readFile(resolve(root, `guwen/.vitepress/dist${work.link}.html`), 'utf8')
    const $ = cheerio.load(html)
    const text = normalize($('main').text())
    for (const paragraph of work.paragraphs) assert.ok(text.includes(normalize(paragraph)), `构建遗漏原文：${work.title} ${paragraph.slice(0,18)}`)
  }
}

assert.equal(new Set(curriculum.books.map((book) => book.name)).size, 23)
for (const [stage, count] of Object.entries(counts)) {
  const books = curriculum.books.filter((book) => book.stage === stage)
  assert.equal(books.length, count, `${stage} 分册数量不符`)
  for (const book of books) {
    assert.ok(book.requiredWorks.length, `${book.name} 缺少核对清单`)
    assert.equal(new Set(book.requiredWorks).size, book.requiredWorks.length, `${book.name} 清单重复`)
    for (const id of book.requiredWorks) {
      const work = works.find((item) => item.stage === stage && item.id === id)
      assert.ok(work, `${book.name} 缺篇：${id}`)
      assert.ok(work.book === book.name || work.additionalBooks?.includes(book.name), `${work.title} 未出现在 ${book.name} 目录`)
    }
  }
}

for (const page of ['index', 'about']) {
  const source = await readFile(resolve(root, `guwen/${page}.md`), 'utf8')
  assert.ok(!/Markdown|works\.json|npm run|数据库|dezhonger-knowledge/.test(source), `${page} 残留实现说明`)
  if (process.argv.includes('--built')) {
    const $ = cheerio.load(await readFile(resolve(root, `guwen/.vitepress/dist/${page}.html`), 'utf8'))
    assert.equal($('a[href*="knowledge.dezhonger.com"],a[href*="github.com/dezhonger/dezhonger-knowledge"],a[href^="https://dezhonger.com"]').length, 0, `${page} 残留外站导航`)
  }
}
console.log(`古文校验通过：${works.length} 篇，23 册，${process.argv.includes('--built') ? '全部构建正文及页面外链已检查' : '原文、分类、目录覆盖、链接已检查'}`)
