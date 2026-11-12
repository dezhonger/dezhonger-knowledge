import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import matter from 'gray-matter'
import {
  criticalFields, optionalCriticalFields, entityDirectories, isObject, pointerValue, referenceFields,
  schemaVersion, validateRecord, validateInterval, compareDatePoints,
} from './model.mjs'

export const contentRoot = resolve(fileURLToPath(new URL('../../content/history/', import.meta.url)))

export async function loadDataset(root = contentRoot) {
  const records = Object.fromEntries(Object.values(entityDirectories).map(type => [type, []]))
  const geo = new Map()
  const articles = new Map()
  const errors = []
  for (const [directory, type] of Object.entries(entityDirectories)) {
    const path = resolve(root, 'data', directory)
    let files = []
    try { files = await readdir(path) } catch (error) { if (error.code !== 'ENOENT') errors.push(`${path}: ${error.message}`) }
    for (const file of files.filter(name => name.endsWith('.json'))) {
      try {
        const record = JSON.parse(await readFile(resolve(path, file), 'utf8'))
        if (record.id !== file.slice(0, -5)) errors.push(`${directory}/${file}: filename must match id`)
        records[type].push(record)
      } catch (error) { errors.push(`${directory}/${file}: ${error.message}`) }
    }
  }
  const geoRoot = resolve(root, 'geo')
  let files = []
  try { files = await readdir(geoRoot) } catch (error) { if (error.code !== 'ENOENT') errors.push(`${geoRoot}: ${error.message}`) }
  for (const file of files.filter(name => name.endsWith('.geojson'))) {
    try { geo.set(file, JSON.parse(await readFile(resolve(geoRoot, file), 'utf8'))) }
    catch (error) { errors.push(`geo/${file}: ${error.message}`) }
  }
  const articleRoot = resolve(root, 'articles')
  try { files = await readdir(articleRoot) } catch (error) { files = []; if (error.code !== 'ENOENT') errors.push(`${articleRoot}: ${error.message}`) }
  for (const file of files.filter(name => name.endsWith('.md') && name !== 'README.md')) {
    try { articles.set(file.slice(0, -3), matter(await readFile(resolve(articleRoot, file), 'utf8'))) }
    catch (error) { errors.push(`articles/${file}: ${error.message}`) }
  }
  return { records, geo, articles, errors }
}

function validateGeometry(geometry, location) {
  const errors = []
  if (!isObject(geometry) || !['Polygon', 'MultiPolygon'].includes(geometry.type)) return [`${location}: only Polygon or MultiPolygon is supported`]
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  if (!Array.isArray(polygons) || polygons.length === 0) return [`${location}: coordinates are missing`]
  for (const [p, polygon] of polygons.entries()) {
    if (!Array.isArray(polygon) || polygon.length === 0) { errors.push(`${location}: polygon ${p} has no rings`); continue }
    for (const [r, ring] of polygon.entries()) {
      if (!Array.isArray(ring) || ring.length < 4) { errors.push(`${location}: ring ${p}/${r} needs at least four positions`); continue }
      for (const [i, point] of ring.entries()) {
        if (!Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1]) || Math.abs(point[0]) > 180 || Math.abs(point[1]) > 90) errors.push(`${location}: invalid longitude/latitude at ${p}/${r}/${i}`)
      }
      if (JSON.stringify(ring[0]) !== JSON.stringify(ring.at(-1))) errors.push(`${location}: ring ${p}/${r} is not closed`)
    }
  }
  return errors
}

export function validateDataset(records, geo = new Map(), articles = new Map()) {
  const errors = []
  const indexes = Object.fromEntries(Object.values(entityDirectories).map(type => [type, new Map()]))
  for (const [type, items] of Object.entries(records)) {
    if (!indexes[type]) { errors.push(`Unknown entity type ${type}`); continue }
    if (!Array.isArray(items)) { errors.push(`${type} must be an array`); continue }
    for (const item of items) {
      errors.push(...validateRecord(item, type).map(message => `${type}/${item?.id ?? '?'}: ${message}`))
      if (item?.id) {
        if (indexes[type].has(item.id)) errors.push(`${type}/${item.id}: duplicate id`)
        indexes[type].set(item.id, item)
      }
    }
  }
  const get = (type, id, owner) => {
    if (typeof id !== 'string' || !indexes[type]?.has(id)) errors.push(`${owner}: missing ${type}/${id}`)
    return indexes[type]?.get(id)
  }
  const all = type => Array.isArray(records[type]) ? records[type] : []
  for (const item of Object.values(indexes).flatMap(index => [...index.values()])) if (item.articleId) {
    if (!articles.has(item.articleId)) errors.push(`${item.id}: missing article ${item.articleId}`)
  }
  for (const [id, article] of articles) {
    const owner = `Article/${id}`
    const type = article.data?.entityType, entityId = article.data?.entityId
    const entity = get(type, entityId, owner)
    if (entity && entity.articleId !== id) errors.push(`${owner}: entity articleId does not point back`)
    if (!Array.isArray(article.data?.sourceIds) || !article.data.sourceIds.length) errors.push(`${owner}: sourceIds required`)
    else article.data.sourceIds.forEach(sourceId => get('Source', sourceId, owner))
    if (!article.content?.trim()) errors.push(`${owner}: article body is empty`)
  }
  for (const [type, fields] of Object.entries(referenceFields)) for (const item of all(type)) {
    for (const [field, targetType] of Object.entries(fields)) {
      const value = item[field]
      if (value === undefined || value === null) continue
      if (field.endsWith('Ids')) {
        if (!Array.isArray(value)) errors.push(`${type}/${item.id}.${field} must be an array`)
        else value.forEach(id => get(targetType, id, `${type}/${item.id}.${field}`))
      } else get(targetType, value, `${type}/${item.id}.${field}`)
    }
  }
  for (const item of all('Event')) {
    if (item.participants !== undefined) {
      if (!Array.isArray(item.participants)) errors.push(`Event/${item.id}.participants must be an array`)
      else item.participants.forEach(participant => {
        if (!['Person', 'PoliticalEntity'].includes(participant.type) || !participant.role) errors.push(`Event/${item.id}: participant needs type and role`)
        else get(participant.type, participant.id, `Event/${item.id}`)
      })
    }
  }
  for (const item of all('RulerTerm')) {
    const entity = indexes.PoliticalEntity.get(item.politicalEntityId)
    if (entity?.interval && item.interval) {
      const a = item.interval.start?.normalized, b = item.interval.endExclusive?.normalized
      const x = entity.interval.start?.normalized, y = entity.interval.endExclusive?.normalized
      if (a && x && !item.interval.start?.uncertainty && !entity.interval.start?.uncertainty && compareDatePoints(a, x) < 0) errors.push(`RulerTerm/${item.id}: starts before political entity`)
      if (b && y && !item.interval.endExclusive?.uncertainty && !entity.interval.endExclusive?.uncertainty && compareDatePoints(b, y) > 0) errors.push(`RulerTerm/${item.id}: ends after political entity`)
    }
  }
  for (const item of all('PoliticalEntity')) for (const [index, interval] of (Array.isArray(item.presenceIntervals) ? item.presenceIntervals : []).entries()) {
    const start = interval.start?.normalized, end = interval.endExclusive?.normalized
    const outerStart = item.interval?.start?.normalized, outerEnd = item.interval?.endExclusive?.normalized
    if (start && outerStart && compareDatePoints(start, outerStart) < 0) errors.push(`PoliticalEntity/${item.id}.presenceIntervals[${index}] starts before entity interval`)
    if (end && outerEnd && compareDatePoints(end, outerEnd) > 0) errors.push(`PoliticalEntity/${item.id}.presenceIntervals[${index}] ends after entity interval`)
  }
  for (const item of all('Relationship')) {
    if (item.fromPersonId === item.toPersonId) errors.push(`Relationship/${item.id}: self relationship`)
  }
  for (const item of all('Succession')) {
    if (item.predecessorTermId === item.successorTermId) errors.push(`Succession/${item.id}: a term cannot succeed itself`)
  }
  for (const [filename, collection] of geo.entries()) {
    const owner = `geo/${filename}`
    if (!/^[a-z0-9-]+\.geojson$/.test(filename)) errors.push(`${owner}: invalid filename`)
    if (!isObject(collection) || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) { errors.push(`${owner}: FeatureCollection required`); continue }
    const meta = collection.metadata
    if (!isObject(meta) || meta.schemaVersion !== schemaVersion || !Array.isArray(meta.originalSourceIds) || meta.originalSourceIds.length === 0 || !['verbatim', 'digitized', 'derived', 'schematic'].includes(meta.method) || !isObject(meta.precision) || !['high', 'medium', 'low', 'schematic'].includes(meta.precision.level) || !(meta.precision.approximateKm >= 0) || typeof meta.attribution !== 'string') errors.push(`${owner}: metadata requires schemaVersion, original sources, method, precision and attribution`)
    for (const id of Array.isArray(meta?.originalSourceIds) ? meta.originalSourceIds : []) {
      const source = get('Source', id, owner)
      if (source && source.license?.redistributeAllowed !== true) errors.push(`${owner}: source ${id} does not allow redistribution`)
      if (source && meta.method !== 'verbatim' && source.license?.modifyAllowed !== true) errors.push(`${owner}: source ${id} does not allow modification`)
    }
    const featureIds = new Set()
    for (const feature of collection.features) {
      if (!isObject(feature) || feature.type !== 'Feature' || typeof feature.id !== 'string' || !feature.id) { errors.push(`${owner}: feature needs stable string id`); continue }
      if (featureIds.has(feature.id)) errors.push(`${owner}: duplicate feature ${feature.id}`)
      featureIds.add(feature.id)
      errors.push(...validateGeometry(feature.geometry, `${owner}/${feature.id}`))
    }
  }
  for (const item of all('Territory')) {
    const owner = `Territory/${item.id}`
    for (const id of Array.isArray(item.originalSourceIds) ? item.originalSourceIds : []) {
      const source = get('Source', id, owner)
      if (source && source.license?.redistributeAllowed !== true) errors.push(`${owner}: source ${id} does not allow redistribution`)
    }
    if (typeof item.geometryRef !== 'string' || !/^[a-z0-9-]+\.geojson$/.test(item.geometryRef)) errors.push(`${owner}: geometryRef must be a file in geo/`)
    else {
      const collection = geo.get(item.geometryRef)
      if (!collection) errors.push(`${owner}: missing geo/${item.geometryRef}`)
      else if (!collection.features?.some(feature => feature.id === item.geometryFeatureId)) errors.push(`${owner}: missing feature ${item.geometryFeatureId}`)
      if (Array.isArray(collection?.metadata?.originalSourceIds) && Array.isArray(item.originalSourceIds) && !item.originalSourceIds.every(id => collection.metadata.originalSourceIds.includes(id))) errors.push(`${owner}: originalSourceIds must match geometry metadata`)
    }
  }
  for (const item of all('Assertion')) {
    const target = item.target
    if (!target?.type || !target.id) continue
    const entity = get(target.type, target.id, `Assertion/${item.id}`)
    if (entity) {
      const adopted = pointerValue(entity, target.path ?? '')
      if (adopted === undefined) errors.push(`Assertion/${item.id}: target path does not exist`)
      for (const alternative of Array.isArray(item.alternatives) ? item.alternatives : []) {
        if (JSON.stringify(alternative.value) === JSON.stringify(adopted)) errors.push(`Assertion/${item.id}: alternative duplicates adopted field value`)
        if (adopted?.start && 'endExclusive' in adopted) errors.push(...validateInterval(alternative.value, `Assertion/${item.id}.alternative/${alternative.id}`))
        else if (adopted !== undefined && (Array.isArray(adopted) !== Array.isArray(alternative.value) || typeof adopted !== typeof alternative.value)) errors.push(`Assertion/${item.id}: alternative type differs from adopted field`)
      }
    }
  }
  const evidenceByAssertion = new Map()
  for (const item of all('Evidence')) {
    const assertion = get('Assertion', item.assertionId, `Evidence/${item.id}`)
    get('Source', item.sourceId, `Evidence/${item.id}`)
    if (assertion && item.candidateId !== 'adopted' && !assertion.alternatives?.some(candidate => candidate.id === item.candidateId)) errors.push(`Evidence/${item.id}: unknown candidate ${item.candidateId}`)
    if (!evidenceByAssertion.has(item.assertionId)) evidenceByAssertion.set(item.assertionId, [])
    evidenceByAssertion.get(item.assertionId).push(item)
  }
  const assertions = all('Assertion')
  for (const item of assertions) for (const alternative of Array.isArray(item.alternatives) ? item.alternatives : []) {
    if (!(evidenceByAssertion.get(item.id) ?? []).some(e => e.candidateId === alternative.id && e.stance === 'supports')) errors.push(`Assertion/${item.id}: alternative ${alternative.id} needs supporting Evidence`)
  }
  const claimTargets = new Set()
  for (const item of assertions) {
    const key = `${item.target?.type}/${item.target?.id}${item.target?.path}`
    if (claimTargets.has(key)) errors.push(`Assertion/${item.id}: duplicate target ${key}; attach more Evidence to the existing Assertion`)
    claimTargets.add(key)
  }
  for (const type of Object.keys(entityDirectories).map(directory => entityDirectories[directory])) {
    for (const item of all(type)) for (const path of [...(criticalFields[type] ?? []), ...(optionalCriticalFields[type] ?? []).filter(path => pointerValue(item, path) !== undefined)]) {
      const matching = assertions.filter(a => a.target?.type === type && a.target.id === item.id && a.target.path === path)
      if (!matching.some(a => (evidenceByAssertion.get(a.id) ?? []).some(e => e.candidateId === 'adopted' && e.stance === 'supports'))) errors.push(`${type}/${item.id}${path}: supporting Assertion/Evidence/Source required`)
    }
  }
  // A converted calendar date must cite the conversion source, even when its owning field has evidence.
  function inspectDates(value, owner) {
    if (!isObject(value) && !Array.isArray(value)) return
    if (isObject(value) && isObject(value.original) && 'precision' in value) {
      for (const id of value.conversion?.sourceIds ?? []) get('Source', id, `${owner}.conversion`)
      return
    }
    for (const [key, child] of Object.entries(value)) inspectDates(child, `${owner}/${key}`)
  }
  for (const [type, items] of Object.entries(records)) for (const item of items) inspectDates(item, `${type}/${item.id}`)
  return errors
}

export async function validateHistory(root = contentRoot) {
  const loaded = await loadDataset(root)
  return { ...loaded, errors: [...loaded.errors, ...validateDataset(loaded.records, loaded.geo, loaded.articles)] }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await validateHistory()
  if (result.errors.length) { console.error(result.errors.join('\n')); process.exitCode = 1 }
  else console.log('History data validation passed (schemaVersion 1).')
}
