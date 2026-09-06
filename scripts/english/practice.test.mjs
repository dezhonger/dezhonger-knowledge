import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { loadContent, contentRoot } from './model.mjs'
import { PRACTICE, parseCount, drawWords, practicePageSlice } from './assets/practice.js'
import { practiceData } from './practice-data.mjs'

const model = await loadContent(), data = practiceData(model)
test('all eight wordlists cover their pinned complete source lists', async () => {
  const report = JSON.parse(await readFile(resolve(contentRoot, 'vocabulary-report.json'), 'utf8'))
  assert.equal(Object.keys(data.levels).length, 8)
  assert.equal(model.vocabulary.length, report.total)
  assert.equal(new Set(model.vocabulary.map(word => word.id)).size, report.total)
  for (const [level, detail] of Object.entries(report.levels)) {
    assert.equal(data.levels[level].length, detail.count)
    assert.equal(detail.sourceCount, detail.sourceIncluded)
    assert.ok(detail.count >= detail.sourceCount)
  }
  assert.ok(data.levels.cet6.length > 5000)
  assert.ok(data.levels.toefl.length > 6000)
  for (const word of data.words) { assert.ok(word.word.trim()); assert.ok(word.meanings.length); word.meanings.forEach(sense => assert.ok(sense.zh.trim())) }
})
test('draws 1 and 500 unique words from the selected list without changing the list', () => {
  const pool = data.levels.cet6, before = [...pool]
  for (const count of [1, 50, 500]) {
    const selection = drawWords(pool, count)
    assert.equal(selection.length, count)
    assert.equal(new Set(selection).size, count)
    assert.ok(selection.every(id => pool.includes(id)))
  }
  assert.deepEqual(pool, before)
})
test('small lists return every available word once rather than duplicating to reach 500', () => {
  const selected = drawWords(data.levels.preschool, 500, () => .5)
  assert.equal(selected.length, data.levels.preschool.length)
  assert.equal(new Set(selected).size, selected.length)
  assert.deepEqual(drawWords([1, 1, 2], 500, () => 0), [1, 2])
})
test('rejects invalid counts rather than silently rounding or drawing too many words', () => {
  for (const value of ['', ' ', 'abc', 0, -1, 501, 1.2, Infinity]) assert.throws(() => parseCount(value), /1–500/)
  assert.equal(parseCount('500'), 500)
})
test('a 500-word session renders 25 at a time and page boundaries retain the same draw', () => {
  const draw = drawWords(data.levels.cet6, 500, () => .4)
  const first = practicePageSlice(draw, 1), last = practicePageSlice(draw, 20)
  assert.equal(first.items.length, PRACTICE.pageSize)
  assert.equal(last.items.length, PRACTICE.pageSize)
  assert.equal(last.totalPages, 20)
  assert.equal(new Set([...first.items, ...last.items]).size, 50)
  assert.deepEqual(practicePageSlice(draw, 999).items, last.items)
})
