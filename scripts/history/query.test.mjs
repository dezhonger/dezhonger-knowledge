import test from 'node:test'
import assert from 'node:assert/strict'
import { validateHistory } from './validate.mjs'
import { eventsAtYear, politiesAtYear, relatedEvents, rulerTermsAtYear } from './query.mjs'

const { records, errors } = await validateHistory()
assert.deepEqual(errors, [], 'source data must pass validation before query tests')
const names = items => items.map(item => item.id).sort()

test('1000 displays four verified concurrent political entities', () => {
  assert.deepEqual(names(politiesAtYear(records, 1000)), ['byzantine-empire', 'holy-roman-empire', 'liao', 'northern-song'])
})

test('other years filter ended entities and the Constantinople interruption', () => {
  assert.equal(politiesAtYear(records, 910).some(item => item.id === 'liao'), false)
  assert.deepEqual(names(politiesAtYear(records, 1126)), ['byzantine-empire', 'holy-roman-empire', 'northern-song'])
  assert.deepEqual(names(politiesAtYear(records, 1200)), ['byzantine-empire', 'holy-roman-empire'])
  assert.deepEqual(names(politiesAtYear(records, 1220)), ['holy-roman-empire'])
  assert.deepEqual(names(politiesAtYear(records, 1270)), ['byzantine-empire', 'holy-roman-empire'])
})

test('the selected year finds the actual ruler term, not merely a person record', () => {
  const terms = rulerTermsAtYear(records, 'northern-song', 1000)
  assert.deepEqual(names(terms), ['song-zhenzong-term'])
  assert.equal(terms[0].personId, 'song-zhenzong')
  assert.deepEqual(names(rulerTermsAtYear(records, 'holy-roman-empire', 1000)), ['otto-iii-term'])
  assert.deepEqual(rulerTermsAtYear(records, 'holy-roman-empire', 1010), [])
})

test('events connect to their polity and person participants in both directions', () => {
  assert.deepEqual(names(eventsAtYear(records, 1000)), ['gniezno-meeting'])
  assert.deepEqual(names(eventsAtYear(records, 1005)), ['chanyuan-covenant'])
  assert.deepEqual(names(relatedEvents(records, 'PoliticalEntity', 'liao')), ['chanyuan-covenant'])
  assert.deepEqual(names(relatedEvents(records, 'Person', 'otto-iii')), ['gniezno-meeting'])
})

test('conflicting reign start years retain both sources and adopted rationale', () => {
  const claim = records.Assertion.find(item => item.target.type === 'RulerTerm' && item.target.id === 'song-zhenzong-term' && item.target.path === '/interval')
  assert.equal(claim.adoptedCandidateId, 'adopted')
  assert.equal(claim.alternatives[0].value.start.normalized.year, 998)
  assert.match(claim.decisionRationale, /997/)
  assert.ok(records.Evidence.some(item => item.assertionId === claim.id && item.candidateId === 'adopted' && item.sourceId === 'sattler-zhenzong'))
  assert.ok(records.Evidence.some(item => item.assertionId === claim.id && item.candidateId === 'regnal-998' && item.sourceId === 'smith-chanyuan'))
})
