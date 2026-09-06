import { createReadStream } from 'node:fs'
import { readFile, writeFile, readdir, mkdir, rename, rm } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { root, contentRoot, normalizeIdentity } from './english/model.mjs'

// Importing is explicit. Ordinary builds read checked-in content and never access a dictionary service.
const cache = resolve(process.argv[2] || resolve(root, '.cache/english-sources'))
const sources = JSON.parse(await readFile(resolve(contentRoot, 'sources.json'), 'utf8'))
const norm = normalizeIdentity
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const sourceFile = async (name, expected) => {
  const bytes = await readFile(resolve(cache, name))
  if (expected && hash(bytes) !== expected) throw new Error(`Source checksum mismatch: ${name}`)
  return bytes.toString('utf8')
}
const listWords = async files => {
  const words = new Set()
  for (const name of files) for (const line of (await sourceFile(name, sources.foundation.sha256[name])).split(/\r?\n/)) if (line.trim()) words.add(norm(line))
  return words
}
const preschool = await listWords(sources.foundation.preschool)
const primary = await listWords(sources.foundation.primary)
const foundation = new Set([...preschool, ...primary])
const ipa = {}
for (const [accent, file] of [['uk', 'en_UK.txt'], ['us', 'en_US.txt']]) {
  ipa[accent] = new Map()
  for (const line of (await sourceFile(file, sources.ipa.sha256[file])).split('\n')) {
    const tab = line.indexOf('\t')
    if (tab < 0) continue
    const readings = [...line.slice(tab + 1).matchAll(/\/([^/]+)\//g)].map(match => '/' + match[1].trim() + '/')
    if (readings.length) ipa[accent].set(norm(line.slice(0, tab)), readings)
  }
}
const editorial = new Map()
const directory = resolve(contentRoot, 'vocabulary')
for (const file of await readdir(directory)) {
  if (file.endsWith('.json')) {
    const item = JSON.parse(await readFile(resolve(directory, file), 'utf8'))
    editorial.set(norm(item.word), { ...item, editorial: true })
  } else if (file.endsWith('.jsonl')) {
    for (const line of (await readFile(resolve(directory, file), 'utf8')).trim().split('\n')) {
      if (!line.trim()) continue
      const item = JSON.parse(line)
      if (item.editorial) editorial.set(norm(item.word), item)
    }
  }
}
function csvRow(line) {
  const result = []; let value = '', quoted = false
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i += 1 }
      else quoted = !quoted
    } else if (line[i] === ',' && !quoted) { result.push(value); value = '' }
    else value += line[i]
  }
  if (quoted) return null
  result.push(value); return result
}
const pos = { n: 'noun', v: 'verb', vt: 'verb', vi: 'verb', a: 'adjective', adj: 'adjective', ad: 'adverb', adv: 'adverb', pron: 'pronoun', prep: 'preposition', conj: 'conjunction', interj: 'interjection', int: 'interjection', aux: 'auxiliary', num: 'numeral', art: 'article', pl: 'noun' }
const lines = value => value.replaceAll('\\r', '').replaceAll('\\n', '\n').split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean)
const posLine = line => {
  const match = line.match(/^(n|v|vt|vi|a|adj|ad|adv|pron|prep|conj|interj|int|aux|num|art|pl)\.\s*/i)
  return { posId: match ? pos[match[1].toLowerCase()] : 'other', text: line.slice(match?.[0].length || 0).trim() }
}
const records = new Map(), wantedByLevel = new Map(Object.keys(sources.examTags).map(id => [id, new Set()]))
let headers, pending = '', selectedRows = 0
// The exact upstream file is checksum-verified before parsing.
await sourceFile('ecdict.csv', sources.ecdict.sha256)
for await (const line of createInterface({ input: createReadStream(resolve(cache, 'ecdict.csv'), 'utf8'), crlfDelay: Infinity })) {
  pending += (pending ? '\n' : '') + line
  const fields = csvRow(pending)
  if (!fields) continue
  pending = ''
  if (!headers) { headers = fields; continue }
  const row = Object.fromEntries(headers.map((key, i) => [key, fields[i] || '']))
  const key = norm(row.word), tags = new Set(row.tag.split(/\s+/))
  const levels = Object.entries(sources.examTags).filter(([, tag]) => tags.has(tag)).map(([id]) => id)
  if (levels.length) selectedRows += 1
  if (preschool.has(key)) levels.unshift('preschool')
  if (primary.has(key)) levels.push('primary')
  if (!levels.length) continue
  for (const level of levels) wantedByLevel.get(level)?.add(key)
  if (!row.translation.trim()) throw new Error(`Missing Chinese definition: ${row.word}`)
  const english = lines(row.definition).map(posLine)
  let chinese = lines(row.translation).filter(line => !/^\[/.test(line))
  if (!chinese.length) chinese = lines(row.translation).map(line => line.replace(/^\[[^\]]+\]\s*/, ''))
  const senses = chinese.map(posLine).filter(item => item.text).map((sense, i) => {
    const matching = english.filter(item => item.posId === sense.posId && item.posId !== 'other').map(item => item.text)
    return { id: `sense-${i + 1}`, posId: sense.posId, zh: sense.text, ...(matching.length ? { en: [...new Set(matching)].join('; ') } : {}) }
  })
  if (!senses.length) throw new Error(`Empty senses after conversion: ${row.word}`)
  const pronunciation = {}
  for (const accent of ['uk', 'us']) {
    const variants = ipa[accent].get(key)
    if (variants) pronunciation[accent] = { ipa: variants[0], ...(variants.length > 1 ? { variants: variants.slice(1) } : {}) }
  }
  if (!pronunciation.uk && !pronunciation.us && row.phonetic.trim()) {
    const reference = row.phonetic.replaceAll('ә', 'ə').replaceAll("'", 'ˈ').replaceAll(':', 'ː').replaceAll('/', '').trim()
    pronunciation.reference = { ipa: '/' + reference + '/' }
  }
  const existing = records.get(key)
  records.set(key, { word: row.word, senses, pronunciation, levelIds: [...new Set([...(existing?.levelIds || []), ...levels])], topicIds: [], source: { name: 'ECDICT', license: 'MIT' } })
}
if (pending) throw new Error('Unterminated CSV row')
const missing = [...foundation].filter(word => !records.has(word) && !editorial.has(word))
if (missing.length) throw new Error(`Foundation words missing from dictionary: ${missing.join(', ')}`)
// Preserve authored explanations and examples. Add source memberships without duplicating the entry.
for (const [key, authored] of editorial) {
  const imported = records.get(key)
  records.set(key, { ...authored, levelIds: [...new Set([...(imported?.levelIds || []), ...authored.levelIds])] })
}
// Correct high-frequency function words whose upstream English definitions describe letters or unrelated noun senses.
const foundationCorrections = {
  a: ['article', '一个；一（用于辅音音素前）', 'Used before a singular countable noun when referring to one person or thing without specifying which.'],
  an: ['article', '一个；一（用于元音音素前）', 'The form of a used before a vowel sound.'],
  i: ['pronoun', '我', 'Used by a speaker to refer to himself or herself as the subject of a sentence.'],
  you: ['pronoun', '你；你们', 'Used to refer to the person or people being spoken to.'],
  he: ['pronoun', '他', 'Used as the subject to refer to a male person or animal already identified.'],
  she: ['pronoun', '她', 'Used as the subject to refer to a female person or animal already identified.'],
  it: ['pronoun', '它；用于指代事物、情况或作形式主语', 'Used to refer to a thing, animal, situation, or idea already mentioned.'],
  we: ['pronoun', '我们', 'Used by a speaker to refer to himself or herself together with other people.'],
  they: ['pronoun', '他们；她们；它们；也可指性别未知或使用该代词的个人', 'Used to refer to people or things already identified, or to a person without specifying gender.'],
  am: ['auxiliary', '是（be 的第一人称单数现在式）', 'The present-tense form of be used with I.'],
  is: ['auxiliary', '是（be 的第三人称单数现在式）', 'The present-tense form of be used with he, she, it, or a singular subject.'],
  are: ['auxiliary', '是（be 的第二人称或复数现在式）', 'The present-tense form of be used with you, we, they, or a plural subject.'],
  the: ['article', '这；那（用于特指或语境中已明确的人或事物）', 'Used before a noun to refer to a particular person or thing that is known or identifiable.'],
  affordable: ['adjective', '负担得起的；价格合理的', 'Not too expensive for someone to buy or pay for.'],
  cola: ['noun', '可乐', 'A sweet, dark fizzy drink that usually contains caffeine.'],
}
for (const [key, [posId, zh, en]] of Object.entries(foundationCorrections)) {
  const item = records.get(key)
  if (item && !item.editorial) { item.senses = [{ id: 'main', posId, zh, en }]; item.word = key === 'i' ? 'I' : key }
}
const reserved = new Set(['index', 'level', 'topic', 'category', 'page', 'item', 'practice'])
const ids = new Set([...editorial.values()].map(item => item.id))
const orderedLevels = ['preschool', 'primary', 'junior', 'senior', 'cet4', 'cet6', 'ielts', 'toefl']
const canonical = [...records].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([key, item]) => {
  if (!item.id) {
    let id = key.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'word'
    if (reserved.has(id)) id = 'word-' + id
    if (ids.has(id)) id += '-' + hash(key).slice(0, 8)
    ids.add(id); item.id = id
  }
  item.levelIds.sort((a, b) => orderedLevels.indexOf(a) - orderedLevels.indexOf(b))
  return item
})
const stats = Object.fromEntries(orderedLevels.map(level => {
  const sourceWords = level === 'preschool' ? preschool : level === 'primary' ? primary : wantedByLevel.get(level)
  const included = canonical.filter(item => item.levelIds.includes(level))
  return [level, { sourceCount: sourceWords.size, sourceIncluded: [...sourceWords].filter(word => records.get(word)?.levelIds.includes(level)).length, count: included.length }]
}))
for (const [id, stat] of Object.entries(stats)) if (stat.sourceIncluded !== stat.sourceCount) throw new Error(`${id}: incomplete import`)
const coverage = { british: canonical.filter(item => item.pronunciation?.uk?.ipa).length, american: canonical.filter(item => item.pronunciation?.us?.ipa).length, both: canonical.filter(item => item.pronunciation?.uk?.ipa && item.pronunciation?.us?.ipa).length }
const report = { date: sources.date, total: canonical.length, selectedExamSourceRows: selectedRows, levels: stats, pronunciation: coverage, missingBritish: canonical.filter(item => !item.pronunciation?.uk?.ipa).map(item => item.word), missingAmerican: canonical.filter(item => !item.pronunciation?.us?.ipa).map(item => item.word) }
const temp = resolve(contentRoot, 'vocabulary-import.tmp')
await mkdir(temp, { recursive: true })
const shards = new Map()
for (const item of canonical) {
  if (item.editorial) await writeFile(resolve(temp, item.id + '.json'), JSON.stringify(item, null, 2) + '\n')
  else { const letter = /^[a-z]/.test(item.id) ? item.id[0] : 'other'; if (!shards.has(letter)) shards.set(letter, []); shards.get(letter).push(item) }
}
for (const [letter, items] of shards) await writeFile(resolve(temp, letter + '.jsonl'), items.map(item => JSON.stringify(item)).join('\n') + '\n')
const backup = resolve(contentRoot, 'vocabulary-import.previous')
await rename(directory, backup)
try { await rename(temp, directory) } catch (error) { await rename(backup, directory); throw error }
await rm(backup, { recursive: true })
await writeFile(resolve(contentRoot, 'vocabulary-report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ total: canonical.length, levels: stats, pronunciation: coverage, canonicalFiles: shards.size + editorial.size }, null, 2))
