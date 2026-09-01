import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Feed } from 'feed'
import matter from 'gray-matter'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const sites = {
  knowledge: {
    root: 'docs',
    outDir: 'docs/.vitepress/dist',
    baseUrl: 'https://knowledge.dezhonger.com/',
    contentDirectories: ['ai', 'backend', 'systems'],
    locales: {
      en: {
        language: 'en',
        title: 'Dezhonger Knowledge',
        description: 'Original notes on backend systems, computer science, and AI engineering.',
      },
      zh: {
        language: 'zh-CN',
        title: 'Dezhonger 知识库',
        description: '关于后端、计算机系统与 AI 工程的原创文章。',
      },
    },
  },
  puzzle: {
    root: 'puzzle',
    outDir: 'puzzle/.vitepress/dist',
    baseUrl: 'https://puzzle.dezhonger.com/',
    contentDirectories: ['notes', 'puzzles'],
    locales: {
      en: {
        language: 'en',
        title: 'Puzzle Library',
        description: 'Curious problems, puzzles, and notes about beautiful ideas.',
      },
      zh: {
        language: 'zh-CN',
        title: '谜题库',
        description: '值得思考的谜题、问题与思想笔记。',
      },
    },
  },
}

async function findMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return findMarkdownFiles(entryPath)
    return entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md' ? [entryPath] : []
  }))
  return files.flat()
}

function requiredText(value, field, sourcePath) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${sourcePath}: RSS entry requires non-empty ${field} frontmatter`)
  }
  return value.trim()
}

function parseDate(value, field, sourcePath) {
  if (!value) throw new Error(`${sourcePath}: RSS entry requires ${field} frontmatter`)
  const parsed = value instanceof Date
    ? value
    : new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T00:00:00Z` : String(value))
  if (Number.isNaN(parsed.getTime())) throw new Error(`${sourcePath}: invalid ${field} frontmatter`)
  return parsed
}

function articleUrl(site, locale, sourcePath) {
  const localeRoot = path.join(repositoryRoot, site.root, locale === 'zh' ? 'zh' : '')
  const cleanPath = path.relative(localeRoot, sourcePath).split(path.sep).join('/').replace(/\.md$/, '')
  const localizedPath = locale === 'zh' ? `zh/${cleanPath}` : cleanPath
  return new URL(localizedPath, site.baseUrl).toString()
}

async function loadItems(site, locale) {
  const localeRoot = path.join(repositoryRoot, site.root, locale === 'zh' ? 'zh' : '')
  const files = (await Promise.all(site.contentDirectories.map((directory) =>
    findMarkdownFiles(path.join(localeRoot, directory)),
  ))).flat()

  const items = await Promise.all(files.map(async (sourcePath) => {
    const source = await readFile(sourcePath, 'utf8')
    const { data } = matter(source)
    if (data.feed === false) return null

    const relativePath = path.relative(repositoryRoot, sourcePath)
    const published = parseDate(data.date, 'date', relativePath)
    const updated = data.updated ? parseDate(data.updated, 'updated', relativePath) : published

    return {
      title: requiredText(data.title, 'title', relativePath),
      description: requiredText(data.description, 'description', relativePath),
      url: articleUrl(site, locale, sourcePath),
      published,
      updated,
    }
  }))

  return items
    .filter(Boolean)
    .sort((left, right) => right.published.getTime() - left.published.getTime() || left.url.localeCompare(right.url))
}

async function generateFeed(siteName, site, locale) {
  const items = await loadItems(site, locale)
  if (items.length === 0) throw new Error(`${siteName}/${locale}: no RSS entries found`)

  const localeConfig = site.locales[locale]
  const feedPath = locale === 'zh' ? 'zh/feed.xml' : 'feed.xml'
  const feedUrl = new URL(feedPath, site.baseUrl).toString()
  const homeUrl = new URL(locale === 'zh' ? 'zh/' : '', site.baseUrl).toString()
  const updated = new Date(Math.max(...items.map((item) => item.updated.getTime())))
  const feed = new Feed({
    title: localeConfig.title,
    description: localeConfig.description,
    id: feedUrl,
    link: homeUrl,
    language: localeConfig.language,
    updated,
    generator: 'dezhonger-knowledge',
    copyright: `Copyright © ${updated.getUTCFullYear()} Dezhonger`,
    feedLinks: { rss: feedUrl },
  })

  for (const item of items) {
    feed.addItem({
      title: item.title,
      id: item.url,
      link: item.url,
      description: item.description,
      date: item.published,
      published: item.published,
    })
  }

  const outputPath = path.join(repositoryRoot, site.outDir, feedPath)
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${feed.rss2()}\n`, 'utf8')
  console.log(`Generated ${path.relative(repositoryRoot, outputPath)} with ${items.length} entries`)
}

const requestedSite = process.argv[2] || 'all'
const selectedSites = requestedSite === 'all'
  ? Object.entries(sites)
  : [[requestedSite, sites[requestedSite]]]

if (selectedSites.some(([, site]) => !site)) {
  throw new Error(`Unknown site "${requestedSite}". Expected one of: ${Object.keys(sites).join(', ')}, all`)
}

for (const [siteName, site] of selectedSites) {
  for (const locale of Object.keys(site.locales)) await generateFeed(siteName, site, locale)
}
