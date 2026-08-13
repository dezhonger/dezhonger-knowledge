import { createReadStream } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

const source = process.argv[2]
if (!source) throw new Error('Usage: node scripts/build-vocabulary.mjs /path/to/ecdict.csv')

const root = resolve(import.meta.dirname, '..')
const output = resolve(root, 'sites/english/vocabulary.json')
const directTags = new Set(['cet4', 'cet6', 'ielts', 'toefl'])
const rows = []

function parseCsvLine(line) {
  const values = []
  let value = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1 }
      else quoted = !quoted
    } else if (char === ',' && !quoted) {
      values.push(value); value = ''
    } else value += char
  }
  values.push(value)
  return values
}

const posNames = new Map([
  ['n', 'n.'], ['v', 'v.'], ['vt', 'vt.'], ['vi', 'vi.'], ['a', 'adj.'], ['ad', 'adv.'],
  ['adj', 'adj.'], ['adv', 'adv.'], ['prep', 'prep.'], ['conj', 'conj.'], ['pron', 'pron.'],
  ['num', 'num.'], ['art', 'art.'], ['aux', 'aux.'], ['int', 'interj.'],
])

function cleanTranslation(value) {
  return value
    .replaceAll('\\n', '；')
    .replace(/\[[^\]]+\]\s*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/；+/g, '；')
    .trim()
    .slice(0, 240)
}

function derivePos(value) {
  const matches = [...value.matchAll(/(?:^|；|\s)(n|v|vt|vi|a|ad|adj|adv|prep|conj|pron|num|art|aux|int)\./gi)]
  const result = [...new Set(matches.map((match) => posNames.get(match[1].toLowerCase())).filter(Boolean))]
  return result.slice(0, 4).join(' / ') || 'word'
}

let headers
const stream = createInterface({ input: createReadStream(source, { encoding: 'utf8' }), crlfDelay: Infinity })
for await (const line of stream) {
  if (!headers) { headers = parseCsvLine(line); continue }
  const values = parseCsvLine(line)
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']))
  const tags = row.tag.split(/\s+/).filter(Boolean)
  if (!tags.some((tag) => directTags.has(tag)) && !tags.includes('gre')) continue
  if (!/^[a-z][a-z '-]{1,32}$/i.test(row.word) || !row.phonetic || !row.translation) continue
  const translation = cleanTranslation(row.translation)
  if (!translation) continue
  rows.push({
    word: row.word.toLowerCase(), phonetic: row.phonetic, translation,
    pos: derivePos(translation), tags,
    rank: Math.min(Number(row.frq) || 999999, Number(row.bnc) || 999999),
  })
}

const byWord = new Map()
for (const row of rows.sort((a, b) => a.rank - b.rank || a.word.localeCompare(b.word))) {
  if (!byWord.has(row.word)) byWord.set(row.word, row)
}
const entries = [...byWord.values()]
const select = (predicate, limit = Infinity) => entries.filter(predicate).slice(0, limit)
const pools = {
  cet4: select((row) => row.tags.includes('cet4')),
  cet6: select((row) => row.tags.includes('cet6')),
  ielts: select((row) => row.tags.includes('ielts')),
  toefl: select((row) => row.tags.includes('toefl')),
  tem4: select((row) => row.tags.some((tag) => ['cet6', 'ielts', 'toefl'].includes(tag)), 6500),
  tem8: select((row) => row.tags.some((tag) => ['gre', 'toefl', 'ielts'].includes(tag)), 12000),
}

const included = new Set(Object.values(pools).flat().map((row) => row.word))
const compactRows = entries.filter((row) => included.has(row.word))
const indexes = new Map(compactRows.map((row, index) => [row.word, index]))
const payload = {
  version: 1,
  source: {
    name: 'ECDICT', license: 'MIT', revision: 'bc015ed2e24a7abef49fc6dbbb7fe32c1dadaf8b',
    url: 'https://github.com/skywind3000/ECDICT',
    note: 'CET-4/CET-6/IELTS/TOEFL use source tags. TEM-4/TEM-8 are non-official review pools derived from licensed entries and corpus frequency.',
  },
  lists: Object.fromEntries(Object.entries(pools).map(([key, value]) => [key, value.map((row) => indexes.get(row.word))])),
  words: compactRows.map((row) => [row.word, row.phonetic, row.pos, row.translation, row.tags.filter((tag) => directTags.has(tag) || tag === 'gre')]),
}

await mkdir(resolve(root, 'sites/english'), { recursive: true })
await writeFile(output, JSON.stringify(payload))
console.log(Object.fromEntries(Object.entries(pools).map(([key, value]) => [key, value.length])))
console.log(`Wrote ${compactRows.length} unique entries to ${output}`)
