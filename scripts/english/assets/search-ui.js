import { SEARCH_TYPES, fetchDocuments, prepareDocuments, searchInChunks, resultPage, normalize } from './search.js'
const form = document.querySelector('[data-search-form]')
const input = form?.querySelector('input[name="q"]')
const output = document.querySelector('#search-results')
const status = document.querySelector('#search-status')
const pagination = document.querySelector('#search-pagination')
const retry = document.querySelector('#search-retry')
const filters = [...document.querySelectorAll('[data-type]')]
let worker, prepared, sequence = 0, timer, composing = false, type = 'all', page = 1, activeJob
const make = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}
function loadLocation() {
  const params = new URLSearchParams(location.search)
  input.value = (params.get('q') || '').slice(0, 120)
  type = Object.hasOwn(SEARCH_TYPES, params.get('type')) ? params.get('type') : 'all'
  page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1)
  filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.type === type)))
}
function saveLocation(push = false) {
  const params = new URLSearchParams()
  if (input.value.trim()) params.set('q', input.value.trim())
  if (type !== 'all') params.set('type', type)
  if (page > 1) params.set('page', String(page))
  const url = '/search' + (params.size ? '?' + params : '')
  if (url !== location.pathname + location.search) history[push ? 'pushState' : 'replaceState']({}, '', url)
}
function render(data) {
  if (data.request !== sequence) return
  output.removeAttribute('aria-busy')
  output.replaceChildren(); pagination.replaceChildren(); pagination.hidden = true
  if (data.error) { status.textContent = data.error; retry.hidden = false; return }
  retry.hidden = true
  page = data.page; saveLocation()
  status.textContent = data.total ? `找到 ${data.total} 条内容 · 第 ${data.page} / ${data.totalPages} 页` : `没有找到“${input.value.trim()}”。试试更短的关键词，或切换内容类型。`
  for (const item of data.items) {
    const article = make('article', 'search-result')
    article.append(make('span', `result-type result-type--${item.type}`, SEARCH_TYPES[item.type]))
    const heading = make('h2'), link = make('a', '', item.title)
    link.href = item.url; heading.append(link); article.append(heading, make('p', '', item.summary))
    const labels = make('div', 'chips')
    item.labels.slice(0, 5).forEach(label => labels.append(make('span', 'chip', label)))
    article.append(labels); output.append(article)
  }
  if (data.totalPages > 1) {
    pagination.hidden = false
    for (const [label, next] of [['上一页', page - 1], ['下一页', page + 1]]) {
      const button = make('button', '', label)
      button.type = 'button'; button.disabled = next < 1 || next > data.totalPages
      button.addEventListener('click', () => { page = next; saveLocation(true); run(); status.scrollIntoView({ block: 'center' }) })
      pagination.append(button)
    }
    pagination.append(make('small', '', `第 ${page} / ${data.totalPages} 页 · 共 ${data.total} 条`))
  }
}
async function fallback(job) {
  try {
    if (!prepared) prepared = fetchDocuments().then(prepareDocuments).catch(error => { prepared = null; throw error })
    const docs = await prepared
    const results = await searchInChunks(docs, job.q, job.type, () => job.request !== sequence)
    render({ request: job.request, ...resultPage(results, job.page) })
  } catch { render({ request: job.request, error: '搜索内容暂时加载失败，请检查连接后重试。' }) }
}
function run() {
  clearTimeout(timer)
  sequence += 1
  retry.hidden = true
  const q = input.value.trim()
  if (!normalize(q)) { activeJob = null; output.replaceChildren(); output.removeAttribute('aria-busy'); pagination.hidden = true; status.textContent = '输入关键词，开始探索。'; return }
  status.textContent = '正在搜索…'; output.setAttribute('aria-busy', 'true')
  activeJob = { q, type, page, request: sequence }
  if (worker) worker.postMessage(activeJob)
  else fallback(activeJob)
}
if (form && input) {
  try {
    worker = new Worker(new URL('./search-worker.js', import.meta.url), { type: 'module' })
    worker.addEventListener('message', event => render(event.data))
    worker.addEventListener('error', event => { event.preventDefault(); worker?.terminate(); worker = null; if (activeJob) fallback(activeJob) })
  } catch { worker = null }
  loadLocation(); run()
  const queue = () => {
    if (composing) return
    sequence += 1; page = 1; clearTimeout(timer)
    timer = setTimeout(() => { saveLocation(); run() }, 150)
  }
  input.addEventListener('compositionstart', () => { composing = true; sequence += 1; clearTimeout(timer) })
  input.addEventListener('compositionend', () => { composing = false; queue() })
  input.addEventListener('input', queue)
  form.addEventListener('submit', event => { event.preventDefault(); if (!composing) { page = 1; saveLocation(true); run() } })
  filters.forEach(button => button.addEventListener('click', () => {
    type = button.dataset.type; page = 1
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)))
    saveLocation(true); run()
  }))
  retry.addEventListener('click', run)
  window.addEventListener('popstate', () => { loadLocation(); run() })
}
