import { ancestry, grammarLevels, labelOf, detailUrl } from './model.mjs'

/** @param {import('./types').ContentModel} model @returns {import('./types').SearchDocument[]} */
export function searchIndex(model) {
  const t = model.taxonomy
  const terms = (nodes, ids, hierarchical = false) => {
    const selected = hierarchical ? ids.flatMap(id => ancestry(nodes, id)) : nodes.filter(node => ids.includes(node.id))
    return [...new Set(selected.flatMap(node => [node.label, ...(node.aliases || [])]))]
  }
  const doc = (type, item, title, summary, labels, definition, keywords, body) => ({
    id: `${type}:${item.id}`, type, title, summary, url: detailUrl(type, item.id), labels: [...new Set(labels)], definition, keywords: keywords.join(' '), body,
  })
  return [
    ...model.vocabulary.map(word => {
      const levels = terms(t.vocabularyLevels, word.levelIds), topics = terms(t.topics, word.topicIds, true)
      return doc('vocabulary', word, word.word, word.senses.map(s => s.zh).join('；'), [...levels, ...word.topicIds.map(id => labelOf(t.topics, id))], word.senses.map(s => `${s.zh} ${s.en || ''}`).join(' '), [...levels, ...topics, ...terms(t.tags, word.tagIds || [])], [...word.senses.flatMap(s => (s.examples || []).map(example => `${example.en} ${example.zh}`)), ...(word.collocations || []).map(item => `${item.en} ${item.zh}`), ...(word.synonyms || []).map(item => item.text), ...(word.antonyms || []).map(item => item.text), word.notes || ''].join(' '))
    }),
    ...model.grammar.map(topic => {
      const levels = terms(t.grammarLevels, grammarLevels(topic)), categories = terms(t.grammarCategories, topic.categoryIds, true)
      return doc('grammar', topic, topic.title, topic.description, [...levels, ...topic.categoryIds.map(id => labelOf(t.grammarCategories, id))], topic.description, [...levels, ...categories], `${topic.coreMarkdown} ${topic.layers.map(layer => layer.markdown).join(' ')}`)
    }),
    ...model.expressions.map(item => {
      const scenes = terms(t.scenes, item.sceneIds, true)
      return doc('expression', item, item.en, item.zh, item.sceneIds.map(id => ancestry(t.scenes, id).map(node => node.label).join(' / ')), `${item.zh} ${item.usage || ''}`, [...scenes, ...terms(t.tags, item.tagIds || [])], item.notes || '')
    }),
  ]
}
