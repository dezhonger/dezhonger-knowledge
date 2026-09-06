/** @typedef {import('../types').SearchDocument} SearchDocument */
export const SEARCH_TYPES = { vocabulary: '单词', grammar: '语法', expression: '常用表达' }
export const PAGE_SIZE = 20
export const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ')
export function prepareDocuments(documents) {
  return documents.map(doc => {
    const title = normalize(doc.title), definition = normalize(doc.definition), keywords = normalize(doc.keywords), body = normalize(doc.body)
    return { doc, title, definition, keywords, body, haystack: [title, definition, keywords, body].join(' ') }
  })
}
export function scoreDocument(entry, query, terms) {
  if (!terms.every(term => entry.haystack.includes(term))) return 0
  let score = entry.title === query ? 1000 : entry.title.startsWith(query) ? 500 : entry.title.includes(query) ? 250 : 0
  for (const term of terms) score += entry.title.includes(term) ? 100 : entry.definition.includes(term) ? 45 : entry.keywords.includes(term) ? 30 : 5
  return score
}
function sortResults(results) {
  return results.sort((a, b) => b.score - a.score || a.doc.type.localeCompare(b.doc.type) || a.doc.id.localeCompare(b.doc.id)).map(item => item.doc)
}
export function searchDocuments(prepared, input, type = 'all') {
  const query = normalize(String(input || '').slice(0, 120))
  if (!query) return []
  const terms = [...new Set(query.split(' '))], matches = []
  for (const entry of prepared) {
    if (type !== 'all' && entry.doc.type !== type) continue
    const score = scoreDocument(entry, query, terms)
    if (score) matches.push({ doc: entry.doc, score })
  }
  return sortResults(matches)
}
export async function searchInChunks(prepared, input, type = 'all', stale = () => false) {
  const query = normalize(String(input || '').slice(0, 120))
  if (!query) return []
  const terms = [...new Set(query.split(' '))], matches = []
  for (let start = 0; start < prepared.length; start += 500) {
    if (stale()) return []
    for (const entry of prepared.slice(start, start + 500)) {
      if (type !== 'all' && entry.doc.type !== type) continue
      const score = scoreDocument(entry, query, terms)
      if (score) matches.push({ doc: entry.doc, score })
    }
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  return sortResults(matches)
}
export async function fetchDocuments() {
  const response = await fetch(new URL('./search-index.json', import.meta.url))
  if (!response.ok) throw new Error(`Search index HTTP ${response.status}`)
  const data = await response.json()
  if (!Array.isArray(data)) throw new Error('Invalid search index')
  return data
}
export function resultPage(results, requested) {
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const page = Math.max(1, Math.min(totalPages, Number.isSafeInteger(requested) ? requested : 1))
  return { total: results.length, totalPages, page, items: results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) }
}
