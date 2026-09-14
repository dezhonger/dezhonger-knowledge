import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const contentRoot = resolve(root, 'content/english')
const vocabularyRoot = resolve(contentRoot, 'vocabulary')
const dryRun = process.argv.includes('--dry-run')
const inputs = process.argv.slice(2).filter(argument => argument !== '--dry-run')

const sourceDefinitions = [
  {
    key: 'society',
    name: '社会基础主题词汇整理',
    path: inputs[0] || '/private/tmp/mdview1.md',
    format: 'tables',
    sectionMap: { 1: 'healthcare', 2: 'finance', 3: 'law', 4: 'government', 5: 'art' },
  },
  {
    key: 'nature',
    name: '天气、地理与宇宙主题词汇整理',
    path: inputs[1] || '/private/tmp/mdview2.md',
    format: 'tables',
    sectionMap: { 1: 'weather', 2: 'geography', 3: 'space' },
  },
  {
    key: 'people',
    name: '人与生活主题词汇整理',
    path: inputs[2] || '/private/tmp/mdview3.md',
    format: 'bullets',
    sectionMap: { 1: 'family', 2: 'children', 3: 'body', 4: 'emotions', 5: 'jobs', 6: 'school' },
  },
  {
    key: 'home',
    name: '居家空间主题词汇整理',
    path: inputs[3] || '/private/tmp/mdview4.md',
    format: 'tables',
    sectionMap: { 1: 'kitchen', 2: 'home', 3: 'home', 4: 'home', 5: 'bathroom' },
  },
]

const cleanCell = value => value.replace(/<br\s*\/?\s*>/gi, ' ').replace(/\*\*|__|`/g, '').replace(/\\([|])/g, '$1').trim()
const tableCells = line => line.split('|').slice(1, -1).map(cleanCell)
const normalized = value => value.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim()
const looseIdentity = value => normalized(value).replace(/[‐‑–—-]+/g, ' ').replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim()
const chineseIdentity = value => value.replace(/[\s/，,；;、（）()]/g, '').trim()
const validIpa = value => /^\/[^/]+\/$/.test(value)

function splitAlternatives(value) {
  return cleanCell(value).split(/\s+(?:\/|[–—])\s+/).map(part => part.trim()).filter(Boolean)
}

function parseTables(definition, markdown) {
  const lines = markdown.split(/\r?\n/)
  const occurrences = []
  let sectionNumber = 0
  let rawRows = 0
  for (let index = 0; index < lines.length; index++) {
    const heading = lines[index].match(/^#{1,6}\s+(\d+)\./)
    if (heading) sectionNumber = Number(heading[1])
    if (!/^\|.*\|$/.test(lines[index]) || !/^\|\s*:?-+/.test(lines[index + 1] || '')) continue
    const header = tableCells(lines[index])
    const topicId = definition.sectionMap[sectionNumber]
    if (!topicId) throw new Error(`${definition.key}: 第 ${index + 1} 行表格缺少分类映射，section=${sectionNumber}`)
    const englishIndex = header.findIndex(cell => /English|英文/i.test(cell))
    const chineseIndex = header.findIndex(cell => cell.includes('中文'))
    const ipaIndex = header.findIndex(cell => cell.includes('音标'))
    if (englishIndex < 0 || chineseIndex < 0) throw new Error(`${definition.key}: 第 ${index + 1} 行表头无法识别`)
    index += 2
    while (index < lines.length && /^\|.*\|$/.test(lines[index])) {
      const cells = tableCells(lines[index])
      const zh = cells[chineseIndex]
      const alternatives = splitAlternatives(cells[englishIndex])
      const ipas = ipaIndex >= 0 ? (cells[ipaIndex].match(/\/[^/]+\//g) || []) : []
      rawRows += 1
      alternatives.forEach((word, alternativeIndex) => occurrences.push({
        word,
        zh,
        topicId,
        sourceKey: definition.key,
        sourceName: definition.name,
        ipa: validIpa(ipas[alternativeIndex] || '') ? ipas[alternativeIndex] : alternatives.length > 1 && ipas.length === 1 ? ipas[0] : undefined,
        sourceLine: index + 1,
      }))
      index += 1
    }
    index -= 1
  }
  return { occurrences, rawRows }
}

function parseBullets(definition, markdown) {
  const lines = markdown.split(/\r?\n/)
  const occurrences = []
  let sectionNumber = 0
  let rawRows = 0
  lines.forEach((line, index) => {
    const heading = line.match(/^#{1,6}\s+(\d+)\./)
    if (heading) sectionNumber = Number(heading[1])
    const row = line.match(/^\*\s+(.+?)\s+—\s+\*\*(.+?)\*\*(.*)$/)
    if (!row) return
    const topicId = definition.sectionMap[sectionNumber]
    if (!topicId) throw new Error(`${definition.key}: 第 ${index + 1} 行清单缺少分类映射，section=${sectionNumber}`)
    const [, zh, english, suffix] = row
    const alternatives = splitAlternatives(english)
    const ipas = suffix.match(/\/[^/]+\//g) || []
    rawRows += 1
    alternatives.forEach((word, alternativeIndex) => occurrences.push({
      word,
      zh: cleanCell(zh),
      topicId,
      sourceKey: definition.key,
      sourceName: definition.name,
      ipa: validIpa(ipas[alternativeIndex] || '') ? ipas[alternativeIndex] : alternatives.length > 1 && ipas.length === 1 ? ipas[0] : undefined,
      sourceLine: index + 1,
    }))
  })
  return { occurrences, rawRows }
}

const sourceTexts = Object.fromEntries(await Promise.all(sourceDefinitions.map(async definition => [definition.key, await readFile(definition.path, 'utf8')])))
const parsed = Object.fromEntries(sourceDefinitions.map(definition => {
  const parse = definition.format === 'bullets' ? parseBullets : parseTables
  return [definition.key, parse(definition, sourceTexts[definition.key])]
}))
const occurrences = Object.values(parsed).flatMap(item => item.occurrences)
if (!occurrences.length) throw new Error('没有从输入文件解析出词条')

const files = (await readdir(vocabularyRoot)).filter(file => /\.jsonl?$/.test(file)).sort()
const locations = new Map()
const allRecords = []
let expansionRecords = []
for (const file of files) {
  const filePath = resolve(vocabularyRoot, file)
  if (file.endsWith('.jsonl')) {
    const records = (await readFile(filePath, 'utf8')).split(/\r?\n/).filter(Boolean).map(JSON.parse)
    if (file === 'topic-expansions.jsonl') expansionRecords = records
    records.forEach(record => { allRecords.push(record); locations.set(record, { file, records, jsonl: true }) })
  } else {
    const record = JSON.parse(await readFile(filePath, 'utf8'))
    allRecords.push(record)
    locations.set(record, { file, records: [record], jsonl: false })
  }
}

const sourceCanonicalWords = new Map()
for (const occurrence of occurrences) {
  const key = looseIdentity(occurrence.word)
  if (sourceCanonicalWords.has(key)) occurrence.word = sourceCanonicalWords.get(key)
  else sourceCanonicalWords.set(key, occurrence.word)
}

const existingByIdentity = new Map(allRecords.map(record => [normalized(record.word), record]))
const usedIds = new Set(allRecords.map(record => record.id))
const expansionSourceNames = new Set(sourceDefinitions.map(definition => definition.name))
const changedRecords = new Set()
const newRecords = []

const verbMeanings = new Set([
  '结婚', '照顾', '抚养', '哭', '笑', '爬', '走路', '跑', '跳', '长大', '喂', '抱', '拥抱', '亲吻', '哄孩子', '换尿布',
  '喜欢', '讨厌', '担心', '害怕', '想念', '信任', '希望', '控告；起诉', '起诉', '辩护', '逮捕', '投票', '改革',
  '下雨', '下雪', '结冰', '融化', '环绕……运行', '旋转', '发射', '着陆', '上课', '学习', '学会', '教', '阅读',
  '写', '拼写', '记住', '理解', '提问', '回答', '复习', '通过考试', '考试不及格', '毕业',
])

function inferPartOfSpeech(record, word, zh) {
  if (/的$/.test(zh) || ['载人', '无人'].includes(zh)) return 'adjective'
  if (verbMeanings.has(zh)) return 'verb'
  const zhKey = chineseIdentity(zh)
  const matchingSense = record?.senses.find(sense => chineseIdentity(sense.zh).includes(zhKey) || zhKey.includes(chineseIdentity(sense.zh)))
  if (matchingSense) return matchingSense.posId
  if (/\s/.test(word)) return 'phrase'
  return record?.senses[0]?.posId || 'noun'
}

function slugify(word) {
  return word.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/%/g, ' percent ').replace(/&/g, ' and ').replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function uniqueId(word) {
  const reserved = new Set(['index', 'level', 'topic', 'category', 'page', 'item'])
  const base = slugify(word) || 'topic-term'
  let id = reserved.has(base) ? `${base}-topics` : base
  if (!usedIds.has(id)) { usedIds.add(id); return id }
  id = `${base}-topics`
  let suffix = 2
  while (usedIds.has(id)) id = `${base}-topics-${suffix++}`
  usedIds.add(id)
  return id
}

for (const occurrence of occurrences) {
  const identity = normalized(occurrence.word)
  let record = existingByIdentity.get(identity)
  if (!record) {
    record = {
      id: uniqueId(occurrence.word),
      word: occurrence.word,
      editorial: true,
      senses: [],
      levelIds: [],
      topicIds: [],
      source: { name: occurrence.sourceName },
    }
    existingByIdentity.set(identity, record)
    allRecords.push(record)
    newRecords.push(record)
  }
  changedRecords.add(record)
  record.editorial = true
  if (!record.topicIds.includes(occurrence.topicId)) record.topicIds.push(occurrence.topicId)
  const posId = inferPartOfSpeech(record, occurrence.word, occurrence.zh)
  const zhKey = chineseIdentity(occurrence.zh)
  let sense = record.senses.find(item => item.posId === posId && chineseIdentity(item.zh) === zhKey)
  if (!sense) sense = record.senses.find(item => item.posId === posId && item.topicIds?.includes(occurrence.topicId) && item.id.startsWith('topics-'))
  if (!sense) {
    const senseIds = new Set(record.senses.map(item => item.id))
    let senseId = `topics-${posId}`
    let suffix = 2
    while (senseIds.has(senseId)) senseId = `topics-${posId}-${suffix++}`
    sense = { id: senseId, posId, zh: occurrence.zh, topicIds: [] }
    record.senses.push(sense)
  } else if (!chineseIdentity(sense.zh).includes(zhKey)) {
    sense.zh += `；${occurrence.zh}`
  }
  sense.topicIds ||= []
  if (!sense.topicIds.includes(occurrence.topicId)) sense.topicIds.push(occurrence.topicId)
  if (!record.pronunciation && occurrence.ipa) record.pronunciation = { reference: { ipa: occurrence.ipa } }
}

for (const record of changedRecords) {
  record.topicIds.sort()
  for (const sense of record.senses) if (sense.topicIds) sense.topicIds.sort()
}
const expansionOutput = [...expansionRecords, ...newRecords].sort((a, b) => a.word.localeCompare(b.word, 'en'))
const changedFiles = new Set([...changedRecords].flatMap(record => locations.has(record) ? [locations.get(record).file] : []))

const reportPath = resolve(contentRoot, 'vocabulary-report.json')
const report = JSON.parse(await readFile(reportPath, 'utf8'))
report.date = '2026-09-15'
report.total = allRecords.length
report.pronunciation = {
  british: allRecords.filter(record => record.pronunciation?.uk?.ipa).length,
  american: allRecords.filter(record => record.pronunciation?.us?.ipa).length,
  both: allRecords.filter(record => record.pronunciation?.uk?.ipa && record.pronunciation?.us?.ipa).length,
}
for (const [key, accent] of [['missingBritish', 'uk'], ['missingAmerican', 'us']]) {
  const missing = new Set(report[key] || [])
  newRecords.filter(record => !record.pronunciation?.[accent]?.ipa).forEach(record => missing.add(record.word))
  report[key] = [...missing]
}
const counts = Object.fromEntries([...new Set(occurrences.map(item => item.topicId))].sort().map(topicId => [topicId, allRecords.filter(record => record.topicIds.includes(topicId)).length]))
report.topicExpansions = {
  sources: Object.fromEntries(sourceDefinitions.map(definition => [definition.key, {
    sha256: createHash('sha256').update(sourceTexts[definition.key]).digest('hex'),
    sourceRows: parsed[definition.key].rawRows,
    parsedOccurrences: parsed[definition.key].occurrences.length,
  }])),
  counts,
  added: allRecords.filter(record => expansionSourceNames.has(record.source?.name)).length,
  updated: [...changedRecords].filter(record => !expansionSourceNames.has(record.source?.name)).length,
}

const uncovered = occurrences.filter(occurrence => {
  const record = existingByIdentity.get(normalized(occurrence.word))
  return !record?.topicIds.includes(occurrence.topicId)
})
if (uncovered.length) throw new Error(`有 ${uncovered.length} 个来源词条未关联目标主题`)

if (!dryRun) {
  for (const file of changedFiles) {
    if (file === 'topic-expansions.jsonl') continue
    const location = [...locations.values()].find(item => item.file === file)
    const filePath = resolve(vocabularyRoot, file)
    await writeFile(filePath, location.jsonl ? location.records.map(JSON.stringify).join('\n') + '\n' : JSON.stringify(location.records[0], null, 2) + '\n')
  }
  await writeFile(resolve(vocabularyRoot, 'topic-expansions.jsonl'), expansionOutput.map(JSON.stringify).join('\n') + '\n')
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n')
}

console.log(JSON.stringify({
  dryRun,
  total: report.total,
  sources: report.topicExpansions.sources,
  counts,
  added: report.topicExpansions.added,
  updated: report.topicExpansions.updated,
  changedFiles: [...changedFiles],
}, null, 2))
