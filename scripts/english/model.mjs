import { readdir, readFile } from 'node:fs/promises'
import { resolve, basename } from 'node:path'
import matter from 'gray-matter'
import { PAGE_SIZE } from './assets/search.js'

/** @typedef {import('./types').ContentModel} ContentModel */
/** @typedef {import('./types').Taxon} Taxon */
export const root = resolve(import.meta.dirname, '../..')
export const contentRoot = resolve(root, 'content/english')
export const SITE = { name: 'English Learning', origin: 'https://english.dezhonger.com', pageSize: PAGE_SIZE }
export const SECTIONS = [
  { id: 'vocabulary', label: '单词', en: 'Vocabulary', path: '/vocabulary', description: '在主题与语境中，积累真正会用的词汇。' },
  { id: 'grammar', label: '语法', en: 'Grammar', path: '/grammar', description: '从一句话开始，逐步建立清晰的语法体系。' },
  { id: 'expression', label: '常用表达', en: 'Expressions', path: '/expressions', description: '让亲子、工作和日常交流，多一种自然的表达。' },
]
const dimensions = ['vocabularyLevels', 'grammarLevels', 'grammarCurriculumStages', 'topics', 'grammarCategories', 'scenes', 'partsOfSpeech', 'tags', 'difficulties']
const trees = new Set(['topics', 'grammarCategories', 'scenes'])
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const fail = (at, message) => { throw new Error(`${at}: ${message}`) }
const object = (value, at) => { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(at, '应为对象') }
const string = (value, at) => { if (typeof value !== 'string' || !value.trim()) fail(at, '应为非空字符串') }
const slug = (value, at) => { string(value, at); if (!slugPattern.test(value)) fail(at, '只允许小写字母、数字与单个连字符') }
const list = (value, at, required = false) => {
  if (!Array.isArray(value) || (required && !value.length)) fail(at, '应为数组' + (required ? '且至少包含一项' : ''))
}
const optionalString = (value, at) => { if (value !== undefined) string(value, at) }
export const normalizeIdentity = value => value.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim()
export const ordered = nodes => [...nodes].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
/** @param {Taxon[]} nodes @param {string} id @returns {Taxon[]} */
export function ancestry(nodes, id) {
  const byId = new Map(nodes.map(node => [node.id, node]))
  const path = [], visited = new Set()
  while (id) {
    if (visited.has(id)) fail(id, '分类树存在循环')
    visited.add(id)
    const node = byId.get(id)
    if (!node) fail(id, '分类不存在')
    path.unshift(node)
    id = node.parentId
  }
  return path
}
export function descendants(nodes, id) {
  return new Set(nodes.filter(node => ancestry(nodes, node.id).some(parent => parent.id === id)).map(node => node.id))
}
export function inCategory(items, field, nodes, id) {
  const included = descendants(nodes, id)
  return items.filter(item => item[field].some(key => included.has(key)))
}
export function sceneUrl(nodes, id) {
  const path = ancestry(nodes, id)
  const first = path[0].id
  return path.length === 1 ? `/expressions/${first}` : `/expressions/${first}/${id.replace(new RegExp(`^${first}-`), '')}`
}
export const grammarLevels = topic => [...new Set(topic.layers.flatMap(layer => layer.levelIds))]
export const labelOf = (nodes, id) => nodes.find(node => node.id === id)?.label || id
export const partOfSpeechLabel = (nodes, id) => nodes.find(node => node.id === id)?.abbreviation || labelOf(nodes, id)
export const detailUrl = (type, id) => type === 'expression' ? `/expressions/item/${id}` : `/${type}/${id}`

function references(values, known, at, required = false) {
  list(values, at, required)
  if (new Set(values).size !== values.length) fail(at, '存在重复引用')
  values.forEach(id => { if (!known.has(id)) fail(at, `引用不存在：${id}`) })
}
function examples(values, at) {
  if (values === undefined) return
  list(values, at)
  values.forEach((value, i) => { object(value, at); string(value.en, `${at}[${i}].en`); string(value.zh, `${at}[${i}].zh`) })
}
/** Validate all source content before any generated output is replaced. @param {ContentModel} model */
export function validateModel(model) {
  object(model, 'content'); object(model.taxonomy, 'taxonomy')
  const keys = {}
  for (const dimension of dimensions) {
    const nodes = model.taxonomy[dimension]
    list(nodes, `taxonomy.${dimension}`, true)
    keys[dimension] = new Set()
    nodes.forEach((node, i) => {
      const at = `taxonomy.${dimension}[${i}]`
      object(node, at); slug(node.id, at + '.id'); string(node.label, at + '.label')
      if (dimension === 'partsOfSpeech') string(node.abbreviation, at + '.abbreviation')
      if (!Number.isFinite(node.order)) fail(at, 'order 应为数字')
      if (keys[dimension].has(node.id)) fail(at, `重复 id：${node.id}`)
      keys[dimension].add(node.id)
      if (node.aliases !== undefined) { list(node.aliases, at + '.aliases'); node.aliases.forEach(alias => string(alias, at + '.aliases')) }
      if (node.parentId && !trees.has(dimension)) fail(at, '此维度不支持父节点')
    })
    nodes.forEach(node => ancestry(nodes, node.id))
  }
  const entityKeys = {}
  for (const collection of ['vocabulary', 'grammar', 'expressions']) {
    list(model[collection], collection)
    const ids = new Set(), identities = new Set()
    for (const item of model[collection]) {
      const at = `${collection}/${item.id}`
      object(item, at); slug(item.id, at + '.id')
      if (['index', 'level', 'topic', 'category', 'page', 'item'].includes(item.id)) fail(at, 'slug 与保留路径冲突')
      if (ids.has(item.id)) fail(at, '重复 id')
      ids.add(item.id)
      const title = item.word || item.en || item.title
      string(title, at + '.title')
      const normalized = collection === 'expressions' ? normalizeIdentity(title).replace(/[.!?。！？]+$/, '') : normalizeIdentity(title)
      if (identities.has(normalized)) fail(at, '内容重复，请合并分类引用')
      identities.add(normalized)
      if (item.tagIds !== undefined) references(item.tagIds, keys.tags, at + '.tagIds')
      optionalString(item.notes, at + '.notes')
    }
    entityKeys[collection] = ids
  }
  for (const word of model.vocabulary) {
    const at = `vocabulary/${word.id}`
    string(word.word, at + '.word')
    references(word.levelIds, keys.vocabularyLevels, at + '.levelIds')
    references(word.topicIds, keys.topics, at + '.topicIds')
    list(word.senses, at + '.senses', true)
    const senseIds = new Set()
    word.senses.forEach((sense, i) => {
      object(sense, at + '.senses'); slug(sense.id, at + '.sense.id')
      if (senseIds.has(sense.id)) fail(at, '词义 id 重复')
      senseIds.add(sense.id)
      references([sense.posId], keys.partsOfSpeech, at + '.posId', true)
      string(sense.zh, `${at}.senses[${i}].zh`); optionalString(sense.en, at + '.sense.en')
      if (sense.topicIds !== undefined) references(sense.topicIds, keys.topics, at + '.sense.topicIds')
      examples(sense.examples, at + '.examples')
    })
    if (word.pronunciation !== undefined) {
      object(word.pronunciation, at + '.pronunciation')
      for (const [accent, value] of Object.entries(word.pronunciation)) {
        if (!['uk', 'us', 'reference'].includes(accent)) fail(at, '未知口音')
        object(value, at + '.' + accent)
        optionalString(value.ipa, at + '.ipa')
        if (value.variants !== undefined) { list(value.variants, at + '.variants'); value.variants.forEach(ipa => { if (typeof ipa !== 'string' || !/^\/[^/]+\/$/.test(ipa)) fail(at, '变体音标格式错误') }) }
        if (value.ipa && !/^\/[^/]+\/$/.test(value.ipa)) fail(at, 'IPA 使用 /…/ 格式')
        if (value.audioSrc !== undefined && (typeof value.audioSrc !== 'string' || !/^\/(?!\/)/.test(value.audioSrc))) fail(at, 'audioSrc 必须是本站绝对路径')
      }
    }
    examples(word.collocations, at + '.collocations')
    for (const key of ['synonyms', 'antonyms']) {
      if (word[key] === undefined) continue
      list(word[key], at + '.' + key)
      word[key].forEach(item => { object(item, at); string(item.text, at + '.' + key); if (item.targetId) references([item.targetId], entityKeys.vocabulary, at + '.' + key) })
    }
    if (word.source !== undefined) {
      object(word.source, at + '.source'); string(word.source.name, at + '.source.name')
      optionalString(word.source.license, at + '.source.license')
      if (word.source.url && !/^https?:\/\//.test(word.source.url)) fail(at, 'source.url 必须为 HTTP(S)')
    }
  }
  for (const topic of model.grammar) {
    const at = `grammar/${topic.id}`
    string(topic.title, at + '.title'); string(topic.description, at + '.description'); string(topic.coreMarkdown, at + '/index.md')
    for (const heading of ['## 核心规则', '## 结构与例句', '## 使用场景', '## 常见错误', '## 易混知识点', '## 总结']) {
      if (!topic.coreMarkdown.includes(heading)) fail(at + '/index.md', `缺少教学结构：${heading}`)
    }
    if (topic.coreMarkdown.length < 400) fail(at + '/index.md', '正文过短，无法形成完整教学闭环')
    references(topic.categoryIds, keys.grammarCategories, at + '.categoryIds', true)
    references(topic.relatedIds || [], entityKeys.grammar, at + '.relatedIds')
    list(topic.layers, at + '.layers', true)
    const ids = new Set()
    for (const layer of topic.layers) {
      slug(layer.id, at + '.layer.id'); string(layer.title, at + '.layer.title'); string(layer.markdown, at + '/' + layer.id + '.md')
      if (ids.has(layer.id)) fail(at, '深度层 id 重复')
      ids.add(layer.id)
      if (!Number.isFinite(layer.order)) fail(at, '深度层 order 应为数字')
      references(layer.levelIds, keys.grammarLevels, at + '.levelIds', true)
      if (layer.levelIds.includes('senior')) {
        references([layer.curriculumStageId], keys.grammarCurriculumStages, at + '.curriculumStageId', true)
        if (!layer.markdown.includes('### 小练习') || !layer.markdown.includes('### 参考答案')) fail(at + '/' + layer.id + '.md', '高中内容层必须包含小练习与参考答案')
        if (layer.markdown.length < 300) fail(at + '/' + layer.id + '.md', '高中内容层过短')
      }
      else if (layer.curriculumStageId !== undefined) fail(at, '非高中内容层不应设置 curriculumStageId')
    }
  }
  for (const category of model.taxonomy.grammarCategories.filter(node => !model.taxonomy.grammarCategories.some(other => other.parentId === node.id))) {
    if (!model.grammar.some(topic => topic.categoryIds.includes(category.id))) fail(`taxonomy.grammarCategories/${category.id}`, '叶子分类没有对应语法主题')
  }
  object(model.grammarCurriculum, 'grammarCurriculum')
  if (!Number.isInteger(model.grammarCurriculum.version)) fail('grammarCurriculum.version', '应为整数')
  object(model.grammarCurriculum.source, 'grammarCurriculum.source')
  for (const key of ['title', 'url', 'edition', 'checkedAt']) string(model.grammarCurriculum.source[key], `grammarCurriculum.source.${key}`)
  if (!/^https?:\/\//.test(model.grammarCurriculum.source.url)) fail('grammarCurriculum.source.url', '必须为 HTTP(S)')
  list(model.grammarCurriculum.items, 'grammarCurriculum.items', true)
  if (model.grammarCurriculum.items.length !== 74) fail('grammarCurriculum.items', '课标覆盖表应包含 74 个项目')
  const curriculumIds = new Set(), topicById = new Map(model.grammar.map(topic => [topic.id, topic]))
  for (const [index, item] of model.grammarCurriculum.items.entries()) {
    const at = `grammarCurriculum.items[${index}]`
    object(item, at); slug(item.id, at + '.id'); string(item.label, at + '.label')
    if (curriculumIds.has(item.id)) fail(at, '项目 id 重复')
    curriculumIds.add(item.id)
    references([item.stageId], keys.grammarCurriculumStages, at + '.stageId', true)
    const topic = topicById.get(item.topicId)
    if (!topic) fail(at, `主题不存在：${item.topicId}`)
    const layer = topic.layers.find(layer => layer.id === item.layerId)
    if (!layer) fail(at, `内容层不存在：${item.topicId}/${item.layerId}`)
    if (!layer.levelIds.includes('senior')) fail(at, '课标项目必须映射到高中内容层')
    if (layer.curriculumStageId !== item.stageId) fail(at, '课标阶段与内容层阶段不一致')
  }
  object(model.grammarSources, 'grammarSources')
  if (!Number.isInteger(model.grammarSources.version)) fail('grammarSources.version', '应为整数')
  list(model.grammarSources.sources, 'grammarSources.sources', true)
  const sourceIds = new Set()
  for (const [index, source] of model.grammarSources.sources.entries()) {
    const at = `grammarSources.sources[${index}]`
    object(source, at); slug(source.id, at + '.id'); string(source.title, at + '.title'); string(source.url, at + '.url'); string(source.role, at + '.role'); string(source.checkedAt, at + '.checkedAt')
    if (!/^https?:\/\//.test(source.url)) fail(at, 'url 必须为 HTTP(S)')
    if (sourceIds.has(source.id)) fail(at, '来源 id 重复')
    sourceIds.add(source.id); optionalString(source.license, at + '.license'); optionalString(source.note, at + '.note')
  }
  for (const item of model.expressions) {
    const at = `expressions/${item.id}`
    string(item.en, at + '.en'); string(item.zh, at + '.zh')
    references(item.sceneIds, keys.scenes, at + '.sceneIds', true)
    if (item.difficultyId) references([item.difficultyId], keys.difficulties, at + '.difficultyId')
    optionalString(item.usage, at + '.usage')
    references(item.relatedIds || [], entityKeys.expressions, at + '.relatedIds')
  }
  return model
}

/** @returns {Promise<ContentModel>} */
export async function loadContent(directory = contentRoot) {
  const json = async path => { try { return JSON.parse(await readFile(path, 'utf8')) } catch (error) { throw new Error(`${path}: ${error.message}`) } }
  const records = async subdir => {
    const files = (await readdir(resolve(directory, subdir))).filter(file => /\.jsonl?$/.test(file)).sort()
    const groups = await Promise.all(files.map(async file => {
      if (file.endsWith('.jsonl')) {
        const lines = (await readFile(resolve(directory, subdir, file), 'utf8')).split('\n')
        return lines.flatMap((line, index) => {
          if (!line.trim()) return []
          try { return [JSON.parse(line)] } catch (error) { fail(`${subdir}/${file}:${index + 1}`, error.message) }
        })
      }
      const data = await json(resolve(directory, subdir, file))
      if (data.id !== basename(file, '.json')) fail(`${subdir}/${file}`, '文件名与 id 不一致')
      return [data]
    }))
    return groups.flat().sort((a, b) => (a.word || a.en || a.title).localeCompare(b.word || b.en || b.title, 'en'))
  }
  const grammar = []
  const folders = (await readdir(resolve(directory, 'grammar'), { withFileTypes: true })).filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))
  for (const folder of folders) {
    const dir = resolve(directory, 'grammar', folder.name)
    const core = matter(await readFile(resolve(dir, 'index.md'), 'utf8'))
    if (core.data.id !== folder.name) fail(dir, '目录名与 id 不一致')
    const layers = []
    for (const file of (await readdir(dir)).filter(file => file.endsWith('.md') && file !== 'index.md').sort()) {
      const layer = matter(await readFile(resolve(dir, file), 'utf8'))
      layers.push({ ...layer.data, id: basename(file, '.md'), markdown: layer.content.trim() })
    }
    grammar.push({ ...core.data, coreMarkdown: core.content.trim(), layers: ordered(layers) })
  }
  return validateModel({
    taxonomy: await json(resolve(directory, 'taxonomy.json')),
    vocabulary: await records('vocabulary'),
    expressions: await records('expressions'),
    grammar,
    grammarCurriculum: await json(resolve(directory, 'grammar-curriculum-map.json')),
    grammarSources: await json(resolve(directory, 'grammar-sources.json')),
  })
}
