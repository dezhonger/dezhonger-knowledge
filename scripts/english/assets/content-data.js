// Schema-versioned URLs stay valid when page/JavaScript asset hashes change.
export const DATA_FILES = { practice: 'data/practice.v1.json', search: 'data/search.v1.json' }
export async function fetchContentData(kind, request = fetch) {
  if (!Object.hasOwn(DATA_FILES, kind)) throw new Error('Unknown content type')
  const response = await request(new URL('/' + DATA_FILES[kind], import.meta.url), { cache: 'no-cache' })
  if (!response.ok) throw new Error(`Content data HTTP ${response.status}`)
  return response.json()
}
// The preview server mirrors these tightly scoped production compatibility routes.
export function compatibleDataPath(path) {
  if (/^\/assets\/[a-f0-9]{12}\/practice-data\.json$/.test(path)) return '/' + DATA_FILES.practice
  if (/^\/assets\/[a-f0-9]{12}\/search-index\.json$/.test(path)) return '/' + DATA_FILES.search
  return path
}
