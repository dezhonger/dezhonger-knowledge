import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { load } from 'cheerio'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'puzzle/.vitepress/dist')
const lists = [
  ['collections/rosecode', '.rc-list li', 'rosecode-pagination'],
  ['collections/ibm-research', '.collection-problems > a', 'collection-pagination'],
  ['collections/project-euler', '.pe-problem-grid > a', 'euler-pagination'],
  ['puzzles/index', '.puzzle-archive-list > a', 'puzzles-pagination'],
  ['timeline/index', '.timeline-list > a', 'timeline-pagination'],
]
let checked = 0
for (const prefix of ['', 'zh/']) {
  for (const [route, rows, id] of lists) {
    const $ = load(readFileSync(path.join(dist, `${prefix}${route}.html`), 'utf8'))
    assert.equal($(rows).length, 10, `${prefix}${route}: must render ten entries`)
    const nav = $(`#${id}`)
    assert.equal(nav.length, 1)
    assert.ok(nav.hasClass('puzzle-pagination'), 'List does not use the shared control')
    assert.equal(nav.find('.page-numbers [aria-current="page"]').text(), '1')
    assert.equal(nav.find('.page-actions--start button[disabled]').length, 2)
    assert.equal(nav.find('.page-actions--end button[disabled]').length, 0)
    assert.equal(nav.find('input[inputmode="numeric"]').attr('value'), '1')
    assert.equal(nav.find('input').attr('aria-describedby'), `${id}-range`)
    assert.equal(nav.find('form button[type="submit"]').text(), prefix ? '跳转' : 'Go')
    assert.equal(nav.find('.page-actions--start button').first().text(), prefix ? '首页' : 'First')
    assert.equal(nav.find('.page-actions--end button').last().text(), prefix ? '末页' : 'Last')
    assert.equal(nav.find('[role="alert"]').length, 0)
    checked++
  }
  for (const route of ['notes/index', 'collections/index', 'collections/geometry']) {
    const $ = load(readFileSync(path.join(dist, `${prefix}${route}.html`), 'utf8'))
    assert.equal($('.puzzle-pagination').length, 0, `${prefix}${route}: one-page list should not show pagination`)
    checked++
  }
}
console.log(`Shared pagination: ${checked} English/Chinese list pages passed`)
