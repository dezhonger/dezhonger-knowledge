import assert from 'node:assert/strict'
import test from 'node:test'
import { classify, mergeWorks } from './sync-guwen.mjs'

test('同步不能覆盖校订或删除补录、跨学段同名篇目', () => {
  const edited = { id: 'same', stage: 'primary', author: '校订作者', book: '六年级下册', paragraphs: ['校订正文'], readingNote: '节选' }
  const supplemental = { id: 'manual', stage: 'senior', paragraphs: ['补录正文'] }
  const incoming = [{ ...edited, author: '错误作者', book: '五年级下册', paragraphs: ['错误正文'] }, { id: 'same', stage: 'junior', paragraphs: ['另一学段'] }]
  const merged = mergeWorks([edited, supplemental], incoming)
  assert.deepEqual(merged, [edited, supplemental, incoming[1]])
  assert.deepEqual(mergeWorks(merged, incoming), merged)
})

test('绝句、律诗、词及剧曲使用正确的体裁', () => {
  for (const form of ['七言绝句', '五言律诗', '民歌', '古风', '词']) assert.equal(classify('诗歌', form), '诗词曲')
  assert.equal(classify('夜书所见', '七言绝句'), '诗词曲')
  assert.equal(classify('记承天寺夜游', '散文'), '文言文')
  assert.equal(classify('窦娥冤', '元杂剧'), '戏曲')
  assert.equal(classify('范进中举', '章回小说'), '古典小说')
})

test('拆分课文和跨来源补录不会在下一次同步时重复导入', () => {
  const split = { id: 'reading-lunyu', sourceId: 'reading', stage: 'primary', title: '古人谈读书·《论语》五则', author: '孔子弟子' }
  const supplement = { id: 'manual-pipa', stage: 'senior', title: '琵琶行（并序）', author: '白居易' }
  const incoming = [{ id: 'reading', stage: 'primary', title: '古人谈读书（三首）', author: '佚名' }, { id: 'remote-pipa', stage: 'senior', title: '琵琶行并序', author: '白居易' }]
  assert.deepEqual(mergeWorks([split, supplement], incoming), [split, supplement])
})
