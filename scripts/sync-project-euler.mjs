import { readFile, readdir, writeFile } from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = path.join(root, 'puzzle/.vitepress/theme/data/project-euler.ts')
const puzzleDirectory = path.join(root, 'puzzle/puzzles')
const solvedCsvPath = readOption('--solves')

if (!solvedCsvPath) {
  throw new Error('Usage: node scripts/sync-project-euler.mjs --solves /path/to/project-euler.csv')
}

function readOption(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function requestText(url) {
  const parsed = new URL(url)
  const overrideIp = process.env.PROJECT_EULER_IP

  return new Promise((resolve, reject) => {
    const request = https.get(
      {
        hostname: overrideIp || parsed.hostname,
        path: `${parsed.pathname}${parsed.search}`,
        servername: parsed.hostname,
        headers: {
          Host: parsed.hostname,
          'User-Agent': 'dezhonger-knowledge Project Euler catalog sync',
        },
        timeout: 20_000,
      },
      (response) => {
        if (response.statusCode !== 200) {
          response.resume()
          reject(new Error(`${url} returned HTTP ${response.statusCode}`))
          return
        }

        response.setEncoding('utf8')
        let body = ''
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => resolve(body))
      },
    )

    request.on('timeout', () => request.destroy(new Error(`${url} timed out`)))
    request.on('error', reject)
  })
}

function decodeHtml(value) {
  const namedEntities = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  }

  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, token) => {
      if (token.startsWith('#x')) return String.fromCodePoint(Number.parseInt(token.slice(2), 16))
      if (token.startsWith('#')) return String.fromCodePoint(Number.parseInt(token.slice(1), 10))
      return namedEntities[token.toLowerCase()] ?? entity
    })
    .replace(/\s+/g, ' ')
    .trim()
}

function parseProblems(html) {
  const problems = []
  const pattern = /<tr><td class="id_column">(\d+)<\/td><td><a href="problem=\d+"[^>]*>([\s\S]*?)<\/a><\/td>/g

  for (const match of html.matchAll(pattern)) {
    problems.push({ id: Number(match[1]), title: decodeHtml(match[2]) })
  }

  return problems
}

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

async function findPublishedSolutions() {
  const files = await readdir(puzzleDirectory)
  const published = new Map()

  for (const file of files.filter((name) => name.endsWith('.md'))) {
    const source = await readFile(path.join(puzzleDirectory, file), 'utf8')
    const match = source.match(/^---[\s\S]*?^projectEuler:\s*(\d+)\s*$[\s\S]*?^---/m)
    if (match) published.set(Number(match[1]), file.replace(/\.md$/, ''))
  }

  return published
}

const archivePages = []
for (let page = 1; page <= 20; page += 1) {
  archivePages.push(await requestText(`https://projecteuler.net/archives;page=${page}`))
}
const recentPage = await requestText('https://projecteuler.net/recent')
const problemMap = new Map(
  [...archivePages.flatMap(parseProblems), ...parseProblems(recentPage)].map((problem) => [problem.id, problem]),
)
const problems = [...problemMap.values()].sort((left, right) => left.id - right.id)
const solved = parseSolvedCsv(await readFile(path.resolve(solvedCsvPath), 'utf8'))
const published = await findPublishedSolutions()
const highestId = problems.at(-1)?.id ?? 0

if (problems.length !== highestId || problems.some((problem, index) => problem.id !== index + 1)) {
  throw new Error(`Expected a contiguous Project Euler catalog, received ${problems.length} problems ending at ${highestId}`)
}

for (const [id, record] of solved) {
  const official = problemMap.get(id)
  if (!official) throw new Error(`Solved CSV contains unknown problem ${id}`)
  if (decodeHtml(record.title) !== official.title) {
    console.warn(`Title differs for problem ${id}: CSV="${record.title}" official="${official.title}"`)
  }
}

const records = problems.map((problem) => ({
  ...problem,
  ...(solved.get(problem.id) ? { solvedAt: solved.get(problem.id).solvedAt } : {}),
  ...(published.get(problem.id) ? { articleSlug: published.get(problem.id) } : {}),
}))
const generated = `// Generated by scripts/sync-project-euler.mjs. Do not edit by hand.\n\nexport interface ProjectEulerProblem {\n  id: number\n  title: string\n  solvedAt?: string\n  articleSlug?: string\n}\n\nexport const projectEulerSnapshot = {\n  generatedAt: '${new Date().toISOString()}',\n  total: ${records.length},\n  solved: ${records.filter((record) => record.solvedAt).length},\n  publishedSolutions: ${records.filter((record) => record.articleSlug).length},\n} as const\n\nexport const projectEulerProblems: ProjectEulerProblem[] = ${JSON.stringify(records, null, 2)}\n`

await writeFile(outputPath, generated)
console.log(`Wrote ${records.length} problems (${solved.size} solved, ${published.size} published solutions) to ${path.relative(root, outputPath)}`)
