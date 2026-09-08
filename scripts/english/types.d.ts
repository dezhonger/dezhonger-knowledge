export interface Taxon {
  id: string
  label: string
  order: number
  parentId?: string
  aliases?: string[]
  description?: string
  code?: string
  color?: string
  abbreviation?: string
}
export interface Taxonomy {
  vocabularyLevels: Taxon[]
  grammarLevels: Taxon[]
  topics: Taxon[]
  grammarCategories: Taxon[]
  scenes: Taxon[]
  partsOfSpeech: Taxon[]
  tags: Taxon[]
  difficulties: Taxon[]
}
export interface Example { en: string; zh: string }
export interface Pronunciation { ipa?: string; audioSrc?: string; variants?: string[] }
export interface WordRelation { text: string; targetId?: string }
export interface Sense {
  id: string
  posId: string
  zh: string
  en?: string
  examples?: Example[]
  topicIds?: string[]
}
export interface Vocabulary {
  id: string
  word: string
  editorial?: boolean
  pronunciation?: { uk?: Pronunciation; us?: Pronunciation; reference?: Pronunciation }
  senses: Sense[]
  levelIds: string[]
  topicIds: string[]
  tagIds?: string[]
  collocations?: Example[]
  synonyms?: WordRelation[]
  antonyms?: WordRelation[]
  notes?: string
  source?: { name: string; url?: string; license?: string }
}
export interface GrammarLayer {
  id: string
  title: string
  levelIds: string[]
  order: number
  markdown: string
}
export interface GrammarTopic {
  id: string
  title: string
  description: string
  categoryIds: string[]
  relatedIds?: string[]
  coreMarkdown: string
  layers: GrammarLayer[]
}
export interface Expression {
  id: string
  en: string
  zh: string
  sceneIds: string[]
  difficultyId?: string
  tagIds?: string[]
  usage?: string
  notes?: string
  relatedIds?: string[]
}
export interface ContentModel {
  taxonomy: Taxonomy
  vocabulary: Vocabulary[]
  grammar: GrammarTopic[]
  expressions: Expression[]
}
export type ContentType = 'vocabulary' | 'grammar' | 'expression'
export interface SearchDocument {
  id: string
  type: ContentType
  title: string
  url: string
  summary: string
  labels: string[]
  definition: string
  keywords: string
  body: string
}
