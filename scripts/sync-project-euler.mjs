import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { load } from 'cheerio'
import matter from 'gray-matter'
import { root, contentDirectory, json, saveJson, request, fetchStatements, pool } from './project-euler-source.mjs'
import { renderStatement } from './project-euler-pages.mjs'

const option = (name) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined
const fromCache = process.argv.includes('--from-cache')
const refresh = process.argv.includes('--refresh')
const puzzleDirectory = path.join(root, 'puzzle/puzzles')

function parseSolvedCsv(csv) {
  const solved = new Map()
  const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' }

  for (const [index, line] of csv.replace(/^\uFEFF/, '').trim().split(/\r?\n/).entries()) {
    const match = line.match(/^(\d+),"((?:[^"]|"")*)",(\d{2}) ([A-Z][a-z]{2}) (\d{2}) \((\d{2}):(\d{2})\)$/)
    if (!match) throw new Error(`Unable to parse CSV line ${index + 1}: ${line}`)

    const [, id, title, day, monthName, shortYear, hour, minute] = match
    const year = 2000 + Number(shortYear)
    solved.set(Number(id), {
      title: title.replace(/""/g, '"'),
      solvedAt: `${year}-${months[monthName]}-${day}T${hour}:${minute}:00+08:00`,
    })
  }

  return solved
}

async function publishedSolutions() {
  const published = new Map()
  for (const file of (await readdir(puzzleDirectory)).filter((name) => name.endsWith('.md'))) {
    const source = await readFile(path.join(puzzleDirectory, file), 'utf8')
    const { data, content } = matter(source)
    if (data.projectEuler == null) continue
    const id = Number(data.projectEuler)
    if (!Number.isInteger(id) || id < 1) throw new Error(`Invalid Project Euler ID in ${file}`)
    if (/<PuzzleSolution[\s>]/.test(content)) published.set(id, file.replace(/\.md$/, ''))
  }
  return published
}

const previous = await json(path.join(contentDirectory, 'catalog.json'))
let catalog = previous
if (!fromCache) {
  const first = (await request('https://projecteuler.net/archives')).toString('utf8')
  const lastArchived = Number(first.match(/shows problems 1 to (\d+)/)?.[1])
  if (!lastArchived) throw new Error('Cannot determine archive page count')
  const pages = [first, ...(await pool(Array.from({ length: Math.ceil(lastArchived / 50) - 1 }, (_, i) => i + 2),
    async (page) => (await request(`https://projecteuler.net/archives;page=${page}`)).toString('utf8'))),
    (await request('https://projecteuler.net/recent')).toString('utf8')]
  const records = new Map()
  for (const html of pages) {
    const $ = load(html)
    $('td.id_column').each((_, cell) => {
      const id = Number($(cell).text())
      const title = $(cell).next().find('a').first().text().trim()
      if (id && title) records.set(id, { id, title })
    })
  }
  catalog = [...records.values()].sort((a, b) => a.id - b.id)
}
if (!catalog.length || catalog.some((p, i) => p.id !== i + 1)) throw new Error('Catalog is not contiguous')
const solvesPath = option('--solves')
const solves = solvesPath ? parseSolvedCsv(await readFile(path.resolve(solvesPath), 'utf8')) : new Map(previous.filter((p) => p.solvedAt).map((p) => [p.id, p]))
const published = await publishedSolutions()
catalog = catalog.map(({ id, title }) => ({ id, title, ...(solves.has(id) ? { solvedAt: solves.get(id).solvedAt } : {}), ...(published.has(id) ? { articleSlug: published.get(id) } : {}) }))
for (const id of [...solves.keys(), ...published.keys()]) if (id > catalog.length) throw new Error(`Unknown problem ${id}`)
await saveJson(path.join(contentDirectory, 'catalog.json'), catalog)

let official
if (fromCache) official = await json(path.join(contentDirectory, 'official.json'))
else {
  official = { fetchedAt: new Date().toISOString(), problems: await fetchStatements(catalog, refresh) }
  await saveJson(path.join(contentDirectory, 'official.json'), official)
}
if (official.problems.length !== catalog.length) throw new Error('Statement count does not match catalog')

// Mirror the statement's diagrams and downloadable input data on this site.
const assets = new Set()
for (const problem of official.problems) {
  const $ = load(problem.html)
  $('[src], [href]').each((_, el) => {
    const value = $(el).attr('src') || $(el).attr('href')
    const url = new URL(value, 'https://projecteuler.net/')
    if (url.hostname === 'projecteuler.net' && url.pathname.startsWith('/resources/')) assets.add(url.pathname)
  })
}
await pool([...assets].sort(), async (pathname) => {
  const file = path.join(root, 'puzzle/public/project-euler', pathname)
  const existing = await readFile(file).catch(() => null)
  if (existing && !refresh) return
  if (fromCache) throw new Error(`Missing local resource: ${pathname}`)
  const data = await request(`https://projecteuler.net${pathname}`)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, data)
})

const translations = await json(path.join(contentDirectory, 'zh.json'))
const records = catalog.map((problem) => {
  const translated = translations[String(problem.id)]
  if (!translated?.title || !translated?.html) throw new Error(`Missing Chinese translation: ${problem.id}`)
  if (translated.sourceTitle !== problem.title) throw new Error(`Chinese title needs review after source update: ${problem.id}`)
  if (translated.sourceSha256 !== official.problems[problem.id - 1].sha256) throw new Error(`Chinese translation needs review after source update: ${problem.id}`)
  return { ...problem, titleZh: translated.title,
    ...(problem.title.includes('$') ? { titleHtml: renderStatement(problem.title, 'en') } : {}),
    ...(translated.title.includes('$') ? { titleZhHtml: renderStatement(translated.title, 'zh') } : {}),
  }
})
const output = `// Generated by scripts/sync-project-euler.mjs. Do not edit by hand.

export interface ProjectEulerProblem {
  id: number
  title: string
  titleZh: string
  titleHtml?: string
  titleZhHtml?: string
  solvedAt?: string
  articleSlug?: string
}

export const projectEulerSnapshot = ${JSON.stringify({ generatedAt: official.fetchedAt, total: records.length, solved: records.filter((p) => p.solvedAt).length, publishedSolutions: records.filter((p) => p.articleSlug).length }, null, 2)} as const

export const projectEulerProblems: ProjectEulerProblem[] = ${JSON.stringify(records, null, 2)}
`
await writeFile(path.join(root, 'puzzle/.vitepress/theme/data/project-euler.ts'), output)
console.log(`Synced ${records.length} bilingual statements, ${assets.size} resources, ${published.size} write-ups`)
