import { labelOf } from './model.mjs'
export function practiceData(model) {
  const words = model.vocabulary.map(word => ({
    id: word.id, word: word.word,
    uk: word.pronunciation?.uk?.ipa || '', us: word.pronunciation?.us?.ipa || '', reference: word.pronunciation?.reference?.ipa || '',
    meanings: word.senses.map(sense => ({ pos: labelOf(model.taxonomy.partsOfSpeech, sense.posId), zh: sense.zh })),
  }))
  const levels = Object.fromEntries(model.taxonomy.vocabularyLevels.map(level => [level.id, model.vocabulary.flatMap((word, index) => word.levelIds.includes(level.id) ? [index] : [])]))
  return { version: 1, words, levels }
}
