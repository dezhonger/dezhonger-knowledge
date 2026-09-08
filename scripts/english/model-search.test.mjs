import test from 'node:test'
import assert from 'node:assert/strict'
import { loadContent, validateModel, ancestry, inCategory, sceneUrl, grammarLevels } from './model.mjs'
import { searchIndex } from './search-index.mjs'
import { prepareDocuments, searchDocuments, searchInChunks, resultPage } from './assets/search.js'
import { wordDetail, vocabularyRow, taxonomyGroups, pagination } from './render.mjs'
import { practiceData, legacyVocabularyData } from './practice-data.mjs'
import { load } from 'cheerio'

const model = await loadContent()
const prepared = prepareDocuments(searchIndex(model))
test('parent categories include arbitrary descendants once, despite overlapping assignments', () => {
  const clone = structuredClone(model)
  clone.vocabulary.find(item => item.id === 'apple').topicIds.push('food')
  const found = inCategory(clone.vocabulary, 'topicIds', clone.taxonomy.topics, 'living')
  assert.equal(found.filter(item => item.id === 'apple').length, 1)
  assert.deepEqual(ancestry(model.taxonomy.topics, 'car-interior').map(node => node.id), ['modern', 'cars', 'car-interior'])
  assert.equal(sceneUrl(model.taxonomy.scenes, 'daily-directions'), '/expressions/daily/directions')
})
test('rejects duplicate words, bad references, taxonomy cycles and unpaired translations', () => {
  const mutations = [
    data => data.vocabulary.push({ ...data.vocabulary[0], id: 'duplicate' }),
    data => data.vocabulary[0].topicIds.push('unknown'),
    data => data.taxonomy.topics.find(node => node.id === 'living').parentId = 'fruit',
    data => delete data.vocabulary.find(item => item.id === 'apple').senses[0].examples[0].zh,
    data => data.grammar[0].layers[0].levelIds.push('unknown'),
    data => data.expressions[0].relatedIds.push('unknown'),
    data => data.vocabulary[0].synonyms = [{ text: 'unknown', targetId: 'not-published' }],
  ]
  for (const mutate of mutations) { const clone = structuredClone(model); mutate(clone); assert.throws(() => validateModel(clone)) }
})
test('optional vocabulary sections disappear; missing IPA is not invented', () => {
  const word = structuredClone(model.vocabulary.find(item => item.id === 'apple'))
  delete word.pronunciation.us; delete word.collocations; delete word.notes
  const $ = load(wordDetail(word, model.taxonomy))
  assert.equal($('.word-heading .ipa').length, 1)
  assert.equal($('[data-speak]').length, 2)
  assert.equal($('.content-note,.collocations,.related-words').length, 0)
  delete word.pronunciation
  const blank = load(wordDetail(word, model.taxonomy))
  assert.equal(blank('.word-heading .ipa').length, 0)
})
test('grammar levels are derived from layers and cross-scene expressions stay one entity', () => {
  assert.deepEqual(grammarLevels(model.grammar.find(item => item.id === 'present-simple')).sort(), ['advanced', 'junior', 'primary', 'senior'])
  const docs = searchIndex(model).filter(item => item.id === 'expression:could-you-give-me-a-hand')
  assert.equal(docs.length, 1)
  assert.equal(docs[0].labels.length, 2)
})
test('search handles Chinese, aliases, English case and ranking across content types', () => {
  assert.equal(searchDocuments(prepared, 'ＡＰＰＬＥ')[0].id, 'vocabulary:apple')
  assert.ok(searchDocuments(prepared, '苹果').some(item => item.id === 'vocabulary:apple'))
  assert.equal(searchDocuments(prepared, '现在完成时')[0].id, 'grammar:present-perfect')
  assert.ok(searchDocuments(prepared, '开会', 'expression').some(item => item.id === 'expression:get-started'))
  assert.ok(searchDocuments(prepared, 'give me a hand').some(item => item.id === 'expression:could-you-give-me-a-hand'))
  assert.ok(searchDocuments(prepared, '水果 苹果').some(item => item.id === 'vocabulary:apple'))
  assert.ok(searchDocuments(prepared, '时刻表').some(item => item.id === 'grammar:present-simple'))
  assert.equal(searchDocuments(prepared, 'apple', 'grammar').every(item => item.type === 'grammar'), true)
  assert.equal(searchDocuments(prepared, '不存在的术语xyz').length, 0)
  assert.equal(searchDocuments(prepared, '   ').length, 0)
  assert.equal(searchDocuments(prepared, '???').length, 0)
})
test('chunked fallback returns the same results and abandons stale requests', async () => {
  assert.deepEqual(await searchInChunks(prepared, '英语'), searchDocuments(prepared, '英语'))
  assert.deepEqual(await searchInChunks(prepared, '英语', 'all', () => true), [])
})
test('food vocabulary preserves multiple meanings, nested categories and regional names', () => {
  const fruit = inCategory(model.vocabulary, 'topicIds', model.taxonomy.topics, 'fruit')
  const vegetables = inCategory(model.vocabulary, 'topicIds', model.taxonomy.topics, 'vegetables')
  const food = inCategory(model.vocabulary, 'topicIds', model.taxonomy.topics, 'food')
  const tomato = model.vocabulary.find(word => word.id === 'tomato')
  assert.ok(fruit.includes(tomato) && vegetables.includes(tomato))
  assert.equal(food.filter(word => word.id === 'tomato').length, 1)
  assert.ok(fruit.some(word => word.id === 'longan'))
  assert.ok(vegetables.some(word => word.id === 'water-spinach'))
  const date = model.vocabulary.find(word => word.id === 'date')
  assert.equal(date.senses[0].zh, '椰枣')
  assert.ok(date.senses.some(sense => sense.zh.includes('日期')))
  const rocket = model.vocabulary.find(word => word.id === 'rocket')
  assert.ok(rocket.senses[0].zh.includes('芝麻菜'))
  assert.ok(rocket.senses.some(sense => sense.zh.includes('火箭')))
  assert.ok(rocket.synonyms.some(word => word.targetId === 'arugula'))
  for (const [query, id] of [['龙眼', 'longan'], ['空心菜', 'water-spinach'], ['acai', 'acai'], ['jalapeno', 'jalapeno'], ['蔬菜 韭菜', 'garlic-chives']]) {
    assert.ok(searchDocuments(prepared, query).some(item => item.id === `vocabulary:${id}`), query)
  }
})
test('vocabulary overview stops at two levels below group headings; detail categories remain available', () => {
  const topics = model.taxonomy.topics
  const url = id => `/vocabulary/topic/${id}`
  const $ = load(taxonomyGroups(topics, url, id => inCategory(model.vocabulary, 'topicIds', topics, id).length, 2))
  assert.equal($('a[href="/vocabulary/topic/fruit"]').length, 1)
  assert.equal($('a[href="/vocabulary/topic/vegetables"]').length, 1)
  assert.equal($('a[href="/vocabulary/topic/fruit-citrus"]').length, 0)
  assert.equal($('a[href="/vocabulary/topic/animals-cats"]').length, 0)
  assert.equal($('.taxonomy-group > ul > li > ul > li > ul').length, 0)
  assert.ok(inCategory(model.vocabulary, 'topicIds', topics, 'animals-cats').some(w => w.id === 'ocelot'))
})
test('topic lists select the relevant sense without duplicating shared words', () => {
  for (const [id, topic, expected] of [['kiwi', 'animals', '几维鸟'], ['kiwi', 'fruit', '猕猴桃'], ['plantain', 'plants', '车前草'], ['plantain', 'fruit', '烹饪蕉'], ['bark', 'plants', '树皮'], ['bark', 'animals', '狗叫']]) {
    const words = model.vocabulary.filter(w => w.id === id)
    assert.equal(words.length, 1)
    const $ = load(vocabularyRow(words[0], model.taxonomy, topic))
    assert.ok($('.word-row-main p').text().includes(expected), `${id} / ${topic}`)
  }
  assert.ok(searchDocuments(prepared, '虎猫').some(item => item.id === 'vocabulary:ocelot'))
  assert.ok(searchDocuments(prepared, '光合作用').some(item => item.id === 'vocabulary:photosynthesis'))
})
test('word lists, detail pages and practice use centralized English part-of-speech abbreviations', () => {
  const word = model.vocabulary.find(w => w.id === 'apple')
  for (const html of [vocabularyRow(word, model.taxonomy), wordDetail(word, model.taxonomy)]) {
    const $ = load(html)
    assert.equal($('.part-of-speech').first().text(), 'n.')
    assert.equal($('.part-of-speech').first().attr('title'), '名词')
  }
  assert.equal(practiceData(model).words.find(w => w.id === 'apple').meanings[0].pos, 'n.')
  assert.equal(legacyVocabularyData(model).words.find(w => w[0] === 'apple')[2], 'n.')
  const clone = structuredClone(model)
  clone.vocabulary[0].senses[0].topicIds = ['missing-topic']
  assert.throws(() => validateModel(clone), /missing-topic/)
})
test('pagination clamps ranges and only puts current page items into the UI', () => {
  const results = Array.from({ length: 45 }, (_, i) => i)
  assert.deepEqual(resultPage(results, 2).items, results.slice(20, 40))
  assert.equal(resultPage(results, 99).page, 3)
  assert.equal(resultPage(results, -1).page, 1)
  const $ = load(pagination('/vocabulary/topic/fruit', 2, 100, 2000))
  assert.equal($('[aria-current="page"]').text(), '2')
  assert.ok($('a').length < 10)
  assert.ok($('a[href="/vocabulary/topic/fruit"]').length)
})
test('20,000-document benchmark keeps query computation bounded', () => {
  const source = searchIndex(model)
  const synthetic = Array.from({ length: 20000 }, (_, i) => ({ ...source[i % source.length], id: `benchmark:${i}`, title: `${source[i % source.length].title} ${i}` }))
  const start = performance.now(), index = prepareDocuments(synthetic), preparation = performance.now() - start
  const times = []
  for (const q of ['apple', '苹果', '开会', '现在完成时', '不存在的词语']) {
    const start = performance.now(); searchDocuments(index, q); times.push(performance.now() - start)
  }
  console.log(JSON.stringify({ benchmark: '20k documents', bytes: Buffer.byteLength(JSON.stringify(synthetic)), preparationMs: Math.round(preparation), queryMaxMs: Math.round(Math.max(...times)) }))
  assert.ok(Math.max(...times) < 1000, 'Query exceeded 1 second on the local test machine')
})
