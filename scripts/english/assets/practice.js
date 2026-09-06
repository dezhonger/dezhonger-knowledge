export const PRACTICE = { min: 1, max: 500, defaultCount: 50, defaultLevel: 'cet6', pageSize: 25 }
export function parseCount(value) {
  const count = Number(value)
  if (!String(value).trim() || !Number.isInteger(count) || count < PRACTICE.min || count > PRACTICE.max) throw new Error('请输入 1–500 之间的整数。')
  return count
}
export function drawWords(pool, count, random = Math.random) {
  const amount = parseCount(count)
  const candidates = [...new Set(pool)]
  const selected = Math.min(amount, candidates.length)
  for (let i = 0; i < selected; i += 1) {
    const offset = random()
    if (!(offset >= 0 && offset < 1)) throw new Error('Invalid random sample')
    const j = i + Math.floor(offset * (candidates.length - i))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  return candidates.slice(0, selected)
}
export function practicePageSlice(words, requestedPage) {
  const totalPages = Math.max(1, Math.ceil(words.length / PRACTICE.pageSize))
  const page = Math.max(1, Math.min(totalPages, Number.isInteger(requestedPage) ? requestedPage : 1))
  const start = (page - 1) * PRACTICE.pageSize
  return { page, totalPages, start, items: words.slice(start, start + PRACTICE.pageSize) }
}
