import test from 'node:test'
import assert from 'node:assert/strict'
import { criticalFields, optionalCriticalFields, entityDirectories, validateHistoricalDate, validateInterval, validateRecord } from './model.mjs'
import { validateDataset } from './validate.mjs'

// All names and years below are artificial fixtures, not historical claims.
const source = () => ({ schemaVersion: 1, id: 'fictional-source', title: 'Synthetic test source', sourceType: 'test', license: { name: 'Test permission', attribution: 'Synthetic fixture', modifyAllowed: true, redistributeAllowed: true } })
const year = value => ({ original: { text: `test year ${value}`, calendar: 'proleptic-gregorian' }, normalized: { year: value }, precision: 'year' })
const interval = (start, end) => ({ start: year(start), endExclusive: year(end) })
const record = (id, fields) => ({ schemaVersion: 1, id, ...fields })
const empty = () => Object.fromEntries(Object.values(entityDirectories).map(type => [type, []]))

function fixture() {
  const records = empty()
  records.Source.push(source())
  records.Region.push(record('fictional-region', { name: 'Synthetic region' }))
  records.Country.push(record('fictional-country', { name: 'Synthetic browse entry', regionIds: ['fictional-region'] }))
  records.PoliticalEntity.push(record('fictional-polity', { name: 'Synthetic polity', interval: interval(10, 30), regionIds: ['fictional-region'] }))
  records.CountryLink.push(record('fictional-link', { countryId: 'fictional-country', politicalEntityId: 'fictional-polity', relationType: 'historiographical-association', interval: interval(10, 30) }))
  records.Person.push(record('fictional-person', { name: 'Synthetic person' }))
  records.RulerTerm.push(record('term-one', { personId: 'fictional-person', politicalEntityId: 'fictional-polity', title: 'Synthetic title', interval: interval(12, 16) }))
  records.RulerTerm.push(record('term-two', { personId: 'fictional-person', politicalEntityId: 'fictional-polity', title: 'Synthetic title', interval: interval(20, 24) }))
  records.Succession.push(record('fictional-succession', { predecessorTermId: 'term-one', successorTermId: 'term-two', relationType: 'restoration' }))
  let n = 0
  for (const [type, items] of Object.entries(records)) for (const item of items) {
    const fields = [...(criticalFields[type] ?? []), ...(optionalCriticalFields[type] ?? []).filter(path => path.slice(1) in item)]
    for (const path of fields) {
      const id = `claim-${++n}`
      records.Assertion.push(record(id, { target: { type, id: item.id, path }, adoptedCandidateId: 'adopted', reviewStatus: 'reviewed' }))
      records.Evidence.push(record(`evidence-${n}`, { assertionId: id, candidateId: 'adopted', sourceId: 'fictional-source', locator: { reference: 'fixture:1' }, stance: 'supports' }))
    }
  }
  return records
}

test('astronomical years and half-open intervals do not use JavaScript Date', () => {
  assert.deepEqual(validateHistoricalDate(year(0)), [])
  assert.deepEqual(validateHistoricalDate(year(-1)), [])
  assert.deepEqual(validateInterval(interval(0, 1)), [])
  assert.match(validateInterval(interval(1, 1)).join(' '), /start < endExclusive/)
  assert.match(validateHistoricalDate({ ...year(1), precision: 'day', normalized: { year: 1, month: 2, day: 29 } }).join(' '), /invalid/)
})

test('converted dates require the original calendar and conversion source', () => {
  const converted = { original: { text: 'synthetic reign year', calendar: 'chinese-lunisolar' }, normalized: { year: 10 }, precision: 'year' }
  assert.match(validateHistoricalDate(converted).join(' '), /conversion/)
  assert.deepEqual(validateHistoricalDate({ ...converted, conversion: { method: 'synthetic lookup', sourceIds: ['fictional-source'] } }), [])
  assert.deepEqual(validateHistoricalDate({ ...converted, normalized: null, precision: 'unknown' }), [])
})

test('uncertain dates retain their possible range rather than an invented day', () => {
  const uncertain = { original: { text: 'approximately an artificial year', calendar: 'proleptic-gregorian' }, normalized: null, precision: 'circa', uncertainty: { earliest: { year: -3 }, latest: { year: 2 } } }
  assert.deepEqual(validateHistoricalDate(uncertain), [])
  uncertain.uncertainty.latest = { year: -4 }
  assert.match(validateHistoricalDate(uncertain).join(' '), /reversed/)
})

test('separate ruler terms support repeated accession without merging people', () => {
  assert.deepEqual(validateDataset(fixture()), [])
})

test('country links need type and interval; no anonymous polity id array', () => {
  const data = fixture()
  delete data.CountryLink[0].relationType
  assert.match(validateDataset(data).join(' '), /CountryLink\.relationType is required/)
})

test('missing reference, self succession and unsupported critical assertion fail', () => {
  const data = fixture()
  data.RulerTerm[0].personId = 'missing-person'
  data.Succession[0].successorTermId = 'term-one'
  data.Evidence = data.Evidence.filter(item => item.assertionId !== 'claim-1')
  const errors = validateDataset(data).join('\n')
  assert.match(errors, /missing Person\/missing-person/)
  assert.match(errors, /cannot succeed itself/)
  assert.match(errors, /supporting Assertion\/Evidence\/Source required/)
})

test('assertions point to the sole field value and evidence points to a source', () => {
  const data = fixture()
  data.Assertion[0].target.path = '/invented-value'
  data.Evidence[0].sourceId = 'unlisted-source'
  const errors = validateDataset(data).join('\n')
  assert.match(errors, /target path does not exist/)
  assert.match(errors, /missing Source\/unlisted-source/)
})

test('a fact has one Assertion and can have multiple Evidence records', () => {
  const data = fixture()
  data.Assertion.push(record('duplicate-claim', { target: { ...data.Assertion[0].target }, adoptedCandidateId: 'adopted', reviewStatus: 'reviewed' }))
  assert.match(validateDataset(data).join(' '), /duplicate target/)
  data.Assertion.pop()
  data.Evidence.push(record('second-evidence', { assertionId: data.Assertion[0].id, candidateId: 'adopted', sourceId: 'fictional-source', locator: { reference: 'fixture:2' }, stance: 'supports' }))
  assert.deepEqual(validateDataset(data), [])
})

test('conflicting candidate, rejected view, adopted conclusion and separate sources coexist', () => {
  const data = fixture()
  data.Source.push(record('other-source', { title: 'Second synthetic source', sourceType: 'test', license: { name: 'Test permission', attribution: 'Fixture', modifyAllowed: true, redistributeAllowed: true } }))
  const assertion = data.Assertion.find(item => item.target.type === 'PoliticalEntity' && item.target.path === '/interval')
  assertion.reviewStatus = 'disputed'
  assertion.alternatives = [{ id: 'later-start', value: interval(11, 30), disposition: 'rejected', reason: 'The first source records the earlier start.' }]
  assertion.decisionRationale = 'Adopt the source documenting the earlier start.'
  data.Evidence.push(record('alternative-evidence', { assertionId: assertion.id, candidateId: 'later-start', sourceId: 'other-source', locator: { reference: 'fixture:3' }, stance: 'supports' }))
  assert.deepEqual(validateDataset(data), [])
  data.Evidence.pop()
  assert.match(validateDataset(data).join(' '), /alternative later-start needs supporting Evidence/)
})

test('source license explicitly states modification and redistribution rights', () => {
  const invalid = source()
  delete invalid.license.redistributeAllowed
  assert.match(validateRecord(invalid, 'Source').join(' '), /redistributeAllowed/)
})

test('territory geometry requires a licensed source, precision and a real feature', () => {
  const data = fixture()
  data.Territory.push(record('fictional-territory', { politicalEntityId: 'fictional-polity', interval: interval(12, 16), controlType: 'actual-control', geometryRef: 'fixture.geojson', geometryFeatureId: 'shape-one', method: 'synthetic drawing', precision: { level: 'schematic', approximateKm: 100 }, originalSourceIds: ['fictional-source'] }))
  let n = 100
  for (const path of criticalFields.Territory) {
    const id = `claim-${++n}`
    data.Assertion.push(record(id, { target: { type: 'Territory', id: 'fictional-territory', path }, adoptedCandidateId: 'adopted', reviewStatus: 'reviewed' }))
    data.Evidence.push(record(`evidence-${n}`, { assertionId: id, candidateId: 'adopted', sourceId: 'fictional-source', locator: { reference: 'fixture:1' }, stance: 'supports' }))
  }
  const polygon = { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] }
  const geo = new Map([['fixture.geojson', { type: 'FeatureCollection', metadata: { schemaVersion: 1, originalSourceIds: ['fictional-source'], method: 'derived', precision: { level: 'schematic', approximateKm: 100 }, attribution: 'Synthetic fixture' }, features: [{ type: 'Feature', id: 'shape-one', properties: {}, geometry: polygon }] }]])
  assert.deepEqual(validateDataset(data, geo), [])
  data.Source[0].license.redistributeAllowed = false
  assert.match(validateDataset(data, geo).join(' '), /does not allow redistribution/)
  data.Source[0].license.redistributeAllowed = true
  geo.get('fixture.geojson').metadata.precision = undefined
  assert.match(validateDataset(data, geo).join(' '), /metadata requires/)
})
