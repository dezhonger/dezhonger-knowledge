import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const contentRoot = resolve(root, 'content/english')
const vocabularyRoot = resolve(contentRoot, 'vocabulary')
const [badmintonPath = '/private/tmp/mdview.md', basketballPath = '/private/tmp/mdview2.md'] = process.argv.slice(2)

const sportDefinitions = {
  badminton: {
    label: '羽毛球',
    aliases: ['Badminton'],
    sourcePath: badmintonPath,
    sections: {
      'equipment-court': ['器材与场地', 'Equipment & Court'],
      'match-basics': ['比赛基础', 'Match Basics'],
      strokes: ['基本击球', 'Strokes'],
      smashing: ['杀球', 'Smashing'],
      'drops-slices': ['吊球与切球', 'Drops & Slices'],
      'net-play': ['网前技术', 'Net Play'],
      'serve-return': ['发球与接发', 'Serve & Return'],
      'directions-lines': ['方向与界线', 'Directions & Lines'],
      footwork: ['步法', 'Footwork'],
      doubles: ['双打站位与轮转', 'Doubles Formation'],
      'attack-defense': ['进攻与防守', 'Attack & Defense'],
      'shot-quality': ['击球质量', 'Shot Quality'],
      tactics: ['技战术', 'Tactics'],
      faults: ['失误与违例', 'Errors & Faults'],
      officials: ['裁判与鹰眼', 'Officials & Reviews'],
      tournament: ['比赛阶段与签表', 'Tournament Stages & Draws'],
      'rankings-events': ['排名与赛事', 'Rankings & Events'],
      statistics: ['数据统计', 'Statistics'],
      commentary: ['解说高频词', 'Commentary Essentials'],
    },
    sectionMap: {
      1: 'equipment-court', 2: 'match-basics', 3: 'strokes', 4: 'smashing', 5: 'drops-slices', 6: 'net-play',
      7: 'serve-return', 8: 'serve-return', 9: 'directions-lines', 10: 'footwork', 11: 'doubles',
      12: 'attack-defense', 13: 'shot-quality', 14: 'tactics', 15: 'faults', 16: 'officials',
      17: 'tournament', 18: 'tournament', 19: 'tournament', 20: 'rankings-events', 21: 'rankings-events',
      22: 'statistics', 23: 'commentary',
    },
  },
  basketball: {
    label: '篮球',
    aliases: ['Basketball'],
    sourcePath: basketballPath,
    sections: {
      court: ['场地与界线', 'Court & Lines'],
      roles: ['球员位置', 'Player Roles'],
      'ball-handling': ['持球与运球', 'Ball Handling'],
      passing: ['传球', 'Passing'],
      shooting: ['投篮与终结', 'Shooting & Finishing'],
      rebounds: ['篮板球', 'Rebounding'],
      offense: ['进攻', 'Offense'],
      'pick-roll': ['挡拆', 'Pick-and-Roll'],
      'off-ball': ['无球跑位', 'Off-Ball Movement'],
      defense: ['防守', 'Defense'],
      tactics: ['战术与快攻', 'Tactics & Transition'],
      rules: ['犯规、违例与比赛规则', 'Rules & Violations'],
      statistics: ['技术统计', 'Statistics'],
      commentary: ['比赛局面与解说', 'Game Commentary'],
      'players-teams': ['球员、教练与阵容', 'Players, Coaches & Lineups'],
      'season-business': ['赛季、选秀与交易', 'Season, Draft & Trades'],
    },
    sectionMap: {
      1: 'court', 2: 'roles', 3: 'ball-handling', 4: 'ball-handling', 5: 'passing',
      6: 'shooting', 7: 'shooting', 8: 'shooting', 9: 'rebounds', 10: 'offense',
      11: 'pick-roll', 12: 'off-ball', 13: 'defense', 14: 'defense', 15: 'defense', 16: 'defense',
      17: 'tactics', 18: 'tactics', 19: 'rules', 20: 'rules', 21: 'rules', 22: 'rules', 23: 'rules',
      24: 'statistics', 25: 'statistics', 26: 'statistics', 27: 'statistics', 28: 'statistics',
      29: 'shooting', 30: 'commentary', 31: 'commentary', 32: 'commentary', 33: 'commentary',
      34: 'players-teams', 35: 'players-teams', 36: 'players-teams', 37: 'season-business',
      38: 'season-business', 39: 'season-business', 40: 'season-business', 41: 'commentary', 42: 'commentary',
    },
  },
}

const cleanCell = value => value.replace(/<br\s*\/?\s*>/gi, ' ').replace(/\*\*|__|`/g, '').replace(/\\([|])/g, '$1').trim()
const cells = line => line.split('|').slice(1, -1).map(cleanCell)
const normalized = value => value.normalize('NFKC').toLowerCase().replace(/[\u2019\u2018]/g, "'").replace(/\s+/g, ' ').trim()
const looseIdentity = value => normalized(value).replace(/[\u2010-\u2015-]+/g, ' ').replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim()
const chineseIdentity = value => value.replace(/[\s/,，;；、（）()]/g, '').trim()
const hasChinese = value => /[\u3400-\u9fff]/u.test(value)
const validIpa = value => /^\/[^/]+\/$/.test(value)

function wordAndIpa(value) {
  value = cleanCell(value)
  if (value === 'tempo /ˈtempəʊ/ / pace /peɪs/') return [{ word: 'tempo', ipa: '/ˈtempəʊ/' }, { word: 'pace', ipa: '/peɪs/' }]
  const match = value.match(/^(.*?)\s+(\/[^/]+\/)$/)
  if (match && /[ˈˌɐ-ʯː]/u.test(match[2])) return splitAlternatives(match[1]).map(word => ({ word, ipa: match[2] }))
  return splitAlternatives(value).map(word => ({ word }))
}

function splitAlternatives(value) {
  return value
    .split(/\s+(?:\/|[–—])\s+/)
    .map(part => part.trim())
    .filter(Boolean)
}

function inferPartOfSpeech(word) {
  const key = normalized(word)
  if (/^(and one|bang|count it|nothing but net|too easy|good defense|great hustle|what a|he got it|from downtown)/.test(key)) return 'phrase'
  if (/\s/.test(word)) return 'phrase'
  if (['in', 'out', 'straight', 'defensive', 'attacking', 'open', 'away', 'wide-open', 'clutch', 'waived', 'undrafted'].includes(key)) return 'adjective'
  if (['very', 'deep'].includes(key)) return 'adverb'
  return 'noun'
}

function topicId(sport, section) {
  return `${sport}-${section}`
}

function parseSource(sport, markdown) {
  const definition = sportDefinitions[sport]
  const lines = markdown.split(/\r?\n/)
  const occurrences = []
  let sectionNumber = 0
  let rawRows = 0

  const add = ({ word, zh, section, ipa, note, row }) => {
    word = cleanCell(word).replace(/^['"]|['"]$/g, '').trim()
    zh = cleanCell(zh)
    if (!word || !zh || word === '-' || zh === '-') return
    occurrences.push({ word, zh, sport, topicId: topicId(sport, section), ipa: validIpa(ipa || '') ? ipa : undefined, note, row })
  }

  for (let index = 0; index < lines.length; index++) {
    const heading = lines[index].match(/^#{1,6}\s+(\d+)\./)
    if (heading) sectionNumber = Number(heading[1])
    if (!/^\|.*\|$/.test(lines[index]) || !/^\|\s*:?-+/.test(lines[index + 1] || '')) continue

    const header = cells(lines[index])
    const section = definition.sectionMap[sectionNumber]
    if (!section) throw new Error(`${sport}: 表格缺少分类，第 ${index + 1} 行，section=${sectionNumber}`)
    index += 2
    while (index < lines.length && /^\|.*\|$/.test(lines[index])) {
      const rowCells = cells(lines[index])
      rawRows += 1
      let zh
      let englishCells = []
      let ipaCell = ''
      let note = ''

      if (/^(English|英文)/i.test(header[0])) {
        englishCells = [rowCells[0]]
        zh = rowCells[1]
      } else if (header[0].includes('缩写')) {
        englishCells = [rowCells[1], ...splitAlternatives(rowCells[0])]
        zh = rowCells[2]
      } else {
        zh = rowCells[0]
        englishCells = [rowCells[1]]
        if (header[2]?.includes('缩写') && rowCells[2]) englishCells.push(...splitAlternatives(rowCells[2]))
        if (header[2]?.includes('音标')) ipaCell = rowCells[2]
        if (header[2]?.includes('说明')) note = rowCells[2]
      }

      if (!hasChinese(zh) && englishCells.some(hasChinese)) {
        const englishIndex = englishCells.findIndex(hasChinese)
        const mistakenEnglish = zh
        zh = englishCells[englishIndex]
        englishCells[englishIndex] = mistakenEnglish
      }

      for (const englishCell of englishCells.filter(Boolean)) {
        const parsed = wordAndIpa(englishCell)
        const ipas = ipaCell.match(/\/[^/]+\//g) || []
        const alternatives = parsed.flatMap(item => splitAlternatives(item.word).map(word => ({ word, ipa: item.ipa })))
        for (let alternativeIndex = 0; alternativeIndex < alternatives.length; alternativeIndex++) {
          const item = alternatives[alternativeIndex]
          const ipa = item.ipa || (alternatives.length === 1 ? ipas[0] : ipas.length === alternatives.length ? ipas[alternativeIndex] : undefined)
          add({ word: item.word, zh, section, ipa, note, row: index + 1 })
        }
      }
      index += 1
    }
    index -= 1
  }
  return { occurrences, rawRows }
}

function addManual(occurrences, sport, section, rows) {
  for (const [word, zh, ipa] of rows) occurrences.push({ word, zh, sport, topicId: topicId(sport, section), ipa })
}

function slugify(word) {
  const special = word.replace(/\+\s*\/\s*-/g, ' plus-minus ')
    .replace(/%/g, ' percent ')
    .replace(/&/g, ' and ')
  return special.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function uniqueId(word, used) {
  const reserved = new Set(['index', 'level', 'topic', 'category', 'page', 'item'])
  const base = slugify(word) || 'sports-term'
  let id = reserved.has(base) ? `${base}-sports` : base
  if (!used.has(id)) { used.add(id); return id }
  id = `${base}-sports`
  let suffix = 2
  while (used.has(id)) id = `${base}-sports-${suffix++}`
  used.add(id)
  return id
}

const sourceTexts = Object.fromEntries(await Promise.all(Object.entries(sportDefinitions).map(async ([sport, definition]) => [sport, await readFile(definition.sourcePath, 'utf8')])))
const parsed = Object.fromEntries(Object.entries(sourceTexts).map(([sport, markdown]) => [sport, parseSource(sport, markdown)]))

addManual(parsed.badminton.occurrences, 'badminton', 'match-basics', [['deuce', '平分；加分阶段', '/djuːs/']])
addManual(parsed.badminton.occurrences, 'badminton', 'directions-lines', [
  ['singles sideline', '单打边线'], ['doubles sideline', '双打边线'], ['on the line', '压线；落在线上'],
  ['the shuttle lands on the line', '羽毛球落在线上'], ['clips the sideline', '擦边线'], ['down the line', '打直线'],
  ['attack down the line', '沿边线进攻'],
])
addManual(parsed.badminton.occurrences, 'badminton', 'tournament', [
  ['QF', '四分之一决赛'], ['SF', '半决赛'], ['F', '决赛'], ['R32', '32 强'], ['R16', '16 强'],
])
addManual(parsed.badminton.occurrences, 'badminton', 'statistics', [['H2H', '双方历史交手记录']])
addManual(parsed.basketball.occurrences, 'basketball', 'season-business', [
  ['RFA', '受限制自由球员'], ['UFA', '非受限制自由球员'],
])

const files = (await readdir(vocabularyRoot)).filter(file => /\.jsonl?$/.test(file)).sort()
const locations = new Map()
const allRecords = []
let sportsRecords = []
for (const file of files) {
  const path = resolve(vocabularyRoot, file)
  if (file.endsWith('.jsonl')) {
    const records = (await readFile(path, 'utf8')).split(/\r?\n/).filter(Boolean).map(JSON.parse)
    if (file === 'sports.jsonl') sportsRecords = records
    records.forEach(record => { allRecords.push(record); locations.set(record, { file, records, jsonl: true }) })
  } else {
    const record = JSON.parse(await readFile(path, 'utf8'))
    allRecords.push(record)
    locations.set(record, { file, records: [record], jsonl: false })
  }
}

const byIdentity = new Map(allRecords.map(record => [normalized(record.word), record]))
const bySourceIdentity = new Map()
for (const occurrence of Object.values(parsed).flatMap(item => item.occurrences)) {
  const key = looseIdentity(occurrence.word)
  const previous = bySourceIdentity.get(key)
  if (previous) occurrence.word = previous
  else bySourceIdentity.set(key, occurrence.word)
}

const usedIds = new Set(allRecords.map(record => record.id))
const newRecords = []
const changedRecords = new Set()
for (const occurrence of Object.values(parsed).flatMap(item => item.occurrences)) {
  const identity = normalized(occurrence.word)
  let record = byIdentity.get(identity)
  if (!record) {
    record = {
      id: uniqueId(occurrence.word, usedIds),
      word: occurrence.word,
      editorial: true,
      senses: [],
      levelIds: [],
      topicIds: [],
      source: { name: '羽毛球与篮球体育术语整理' },
    }
    byIdentity.set(identity, record)
    allRecords.push(record)
    newRecords.push(record)
  }
  changedRecords.add(record)
  record.editorial = true
  if (!record.topicIds.includes(occurrence.topicId)) record.topicIds.push(occurrence.topicId)

  const posId = inferPartOfSpeech(occurrence.word)
  const zhKey = chineseIdentity(occurrence.zh)
  let sense = record.senses.find(item => chineseIdentity(item.zh) === zhKey && item.posId === posId)
  if (!sense) {
    let senseId = `sports-${posId}`
    let suffix = 2
    const senseIds = new Set(record.senses.map(item => item.id))
    while (senseIds.has(senseId)) senseId = `sports-${posId}-${suffix++}`
    sense = { id: senseId, posId, zh: occurrence.zh, topicIds: [] }
    record.senses.push(sense)
  }
  sense.topicIds ||= []
  if (!sense.topicIds.includes(occurrence.topicId)) sense.topicIds.push(occurrence.topicId)
  if (!record.pronunciation && occurrence.ipa) record.pronunciation = { reference: { ipa: occurrence.ipa } }
  if (occurrence.note) {
    const note = `${sportDefinitions[occurrence.sport].label}：${occurrence.note}`
    if (!record.notes) record.notes = note
    else if (!record.notes.includes(note)) record.notes += ` ${note}`
  }
}

for (const record of changedRecords) {
  record.topicIds.sort()
  for (const sense of record.senses) if (sense.topicIds) sense.topicIds.sort()
}
const sportsSourceName = '羽毛球与篮球体育术语整理'
const sportsOutput = [...sportsRecords, ...newRecords].sort((a, b) => a.word.localeCompare(b.word, 'en'))

const taxonomyPath = resolve(contentRoot, 'taxonomy.json')
const taxonomy = JSON.parse(await readFile(taxonomyPath, 'utf8'))
const sports = taxonomy.topics.find(node => node.id === 'sports')
if (!sports) throw new Error('缺少现有 sports 分类')
delete sports.parentId
sports.order = 5
sports.aliases = ['Sports']
for (const [sport, definition] of Object.entries(sportDefinitions)) {
  const child = { id: sport, label: definition.label, parentId: 'sports', order: sport === 'badminton' ? 0 : 1, aliases: definition.aliases, expandOnOverview: false }
  const existing = taxonomy.topics.find(node => node.id === sport)
  if (existing) Object.assign(existing, child)
  else taxonomy.topics.push(child)
  Object.entries(definition.sections).forEach(([section, [label, alias]], order) => {
    const node = { id: topicId(sport, section), label, parentId: sport, order, aliases: [alias] }
    const previous = taxonomy.topics.find(item => item.id === node.id)
    if (previous) Object.assign(previous, node)
    else taxonomy.topics.push(node)
  })
}
await writeFile(taxonomyPath, JSON.stringify(taxonomy, null, 2) + '\n')

const changedFiles = new Set([...changedRecords].flatMap(record => locations.has(record) ? [locations.get(record).file] : []))
for (const file of changedFiles) {
  if (file === 'sports.jsonl') continue
  const location = [...locations.values()].find(item => item.file === file)
  const path = resolve(vocabularyRoot, file)
  await writeFile(path, location.jsonl ? location.records.map(JSON.stringify).join('\n') + '\n' : JSON.stringify(location.records[0], null, 2) + '\n')
}
await writeFile(resolve(vocabularyRoot, 'sports.jsonl'), sportsOutput.map(JSON.stringify).join('\n') + '\n')

const reportPath = resolve(contentRoot, 'vocabulary-report.json')
const report = JSON.parse(await readFile(reportPath, 'utf8'))
report.date = '2026-09-14'
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
report.sports = {
  badmintonSourceSha256: createHash('sha256').update(sourceTexts.badminton).digest('hex'),
  basketballSourceSha256: createHash('sha256').update(sourceTexts.basketball).digest('hex'),
  badmintonTableRows: parsed.badminton.rawRows,
  basketballTableRows: parsed.basketball.rawRows,
  badmintonCount: allRecords.filter(record => record.topicIds.some(id => id === 'badminton' || id.startsWith('badminton-'))).length,
  basketballCount: allRecords.filter(record => record.topicIds.some(id => id === 'basketball' || id.startsWith('basketball-'))).length,
  added: allRecords.filter(record => record.source?.name === sportsSourceName).length,
  updated: [...changedRecords].filter(record => record.source?.name !== sportsSourceName).length,
}
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n')

const identities = new Set(allRecords.map(record => normalized(record.word)))
const uncovered = Object.values(parsed).flatMap(item => item.occurrences).filter(item => !identities.has(normalized(item.word)))
if (uncovered.length) throw new Error(`有 ${uncovered.length} 个术语未导入`)

console.log(JSON.stringify({
  rawRows: Object.fromEntries(Object.entries(parsed).map(([sport, item]) => [sport, item.rawRows])),
  parsedOccurrences: Object.fromEntries(Object.entries(parsed).map(([sport, item]) => [sport, item.occurrences.length])),
  ...report.sports,
  total: report.total,
  changedFiles: [...changedFiles],
}, null, 2))
