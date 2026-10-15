const root = document.documentElement
const themeButton = document.querySelector('.theme-toggle')
const systemTheme = matchMedia('(prefers-color-scheme: dark)')
function updateThemeLabel() {
  const dark = root.dataset.theme === 'dark'
  themeButton.setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到深色模式')
  themeButton.setAttribute('aria-pressed', String(dark))
}
themeButton.addEventListener('click', () => {
  const theme = root.dataset.theme === 'dark' ? 'light' : 'dark'
  root.dataset.theme = theme
  try { localStorage.setItem('algo-theme', theme) } catch { /* private browsing */ }
  updateThemeLabel()
})
systemTheme.addEventListener('change', event => {
  let saved
  try { saved = localStorage.getItem('algo-theme') } catch { /* private browsing */ }
  if (!saved) { root.dataset.theme = event.matches ? 'dark' : 'light'; updateThemeLabel() }
})
updateThemeLabel()

const menuButton = document.querySelector('.menu-toggle')
const overlay = document.querySelector('.mobile-overlay')
const sidebar = document.querySelector('.sidebar')
const mobile = matchMedia('(max-width: 760px)')
function toggleMenu(open, restoreFocus = false) {
  document.body.classList.toggle('menu-open', open)
  menuButton.setAttribute('aria-expanded', String(open))
  menuButton.setAttribute('aria-label', open ? '关闭章节导航' : '打开章节导航')
  overlay.hidden = !open
  sidebar.inert = mobile.matches && !open
  if (open) sidebar.querySelector('a')?.focus()
  if (restoreFocus) menuButton.focus()
}
menuButton.addEventListener('click', () => toggleMenu(!document.body.classList.contains('menu-open')))
overlay.addEventListener('click', () => toggleMenu(false, true))
sidebar.addEventListener('click', event => {
  if (event.target.closest('a') && mobile.matches) toggleMenu(false)
})
mobile.addEventListener('change', () => toggleMenu(false))
toggleMenu(false)

// Preserve links to the old single-page category sections.
const legacySections = { '#competitive': '/competitive/', '#engineering': '/engineering/', '#ai': '/machine-learning/' }
if (location.pathname === '/' || location.pathname === '/index.html') {
  const redirectLegacy = () => { if (legacySections[location.hash]) location.replace(legacySections[location.hash]) }
  redirectLegacy()
  addEventListener('hashchange', redirectLegacy)
}

const dialog = document.querySelector('#algo-search')
const searchInput = dialog.querySelector('input')
const searchResults = dialog.querySelector('#search-results')
const searchStatus = dialog.querySelector('.search-hint')
const clearButton = dialog.querySelector('.search-clear')
let searchIndex
let loading
let activeResult = -1
let opener
let searchRequestId = 0
async function getSearchIndex() {
  if (searchIndex) return searchIndex
  if (!loading) loading = fetch(dialog.dataset.searchIndex).then(response => {
    if (!response.ok) throw new Error('Search index unavailable')
    return response.json()
  }).then(records => {
    searchIndex = records.map(record => ({ ...record, normalized: record.text.toLocaleLowerCase().normalize('NFKC') }))
    return searchIndex
  }).finally(() => { loading = undefined })
  return loading
}
async function runSearch() {
  const requestId = ++searchRequestId
  const query = searchInput.value.trim().toLocaleLowerCase().normalize('NFKC')
  clearButton.hidden = searchInput.value.length === 0
  activeResult = -1
  searchResults.replaceChildren()
  if (!query) { searchStatus.textContent = '输入关键词，搜索算法、模型与应用'; return }
  searchStatus.textContent = '正在搜索…'
  try {
    const records = await getSearchIndex()
    if (requestId !== searchRequestId) return
    const terms = query.split(/\s+/)
    const hits = records.filter(record => terms.every(term => record.normalized.includes(term))).sort((a, b) => Number(b.title.toLocaleLowerCase().includes(query)) - Number(a.title.toLocaleLowerCase().includes(query)))
    const visible = hits.slice(0, 30)
    searchStatus.textContent = hits.length ? `找到 ${hits.length} 个知识点${hits.length > 30 ? '，显示前 30 个，请补充关键词缩小范围' : ''}` : '没有找到相关知识点，试试更短的关键词。'
    for (const record of visible) {
      const item = document.createElement('div')
      item.className = 'search-result'
      const link = document.createElement('a')
      link.href = record.url
      const title = document.createElement('strong')
      title.textContent = record.title
      const meta = document.createElement('span')
      meta.className = 'search-result-meta'
      meta.textContent = `${record.category} / ${record.chapter}`
      link.append(title, meta)
      item.append(link)
      searchResults.append(item)
    }
  } catch {
    if (requestId === searchRequestId) searchStatus.textContent = '搜索索引暂时无法加载，请重新输入关键词重试，或使用章节目录。'
  }
}
function openSearch() {
  toggleMenu(false)
  opener = document.activeElement
  if (!dialog.open) dialog.showModal()
  searchInput.focus()
  void runSearch()
}
document.querySelector('.search-trigger').addEventListener('click', openSearch)
dialog.querySelector('.search-close').addEventListener('click', () => dialog.close())
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close() })
dialog.addEventListener('close', () => opener?.focus())
searchInput.addEventListener('input', runSearch)
clearButton.addEventListener('click', () => { searchInput.value = ''; void runSearch(); searchInput.focus() })
dialog.addEventListener('keydown', event => {
  if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return
  const links = [...searchResults.querySelectorAll('a')]
  if (!links.length) return
  if (event.key === 'Enter') {
    if (document.activeElement === searchInput) { event.preventDefault(); links[Math.max(0, activeResult)].click() }
    return
  }
  event.preventDefault()
  activeResult = activeResult < 0 ? (event.key === 'ArrowDown' ? 0 : links.length - 1) : (activeResult + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length
  links[activeResult].focus()
})
document.addEventListener('keydown', event => {
  const editing = event.target.closest('input, textarea, select, [contenteditable="true"]')
  if ((event.key === '/' && !editing) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
    event.preventDefault(); openSearch()
  }
  if (event.key === 'Escape' && document.body.classList.contains('menu-open')) toggleMenu(false, true)
  if (event.key === 'Tab' && mobile.matches && document.body.classList.contains('menu-open')) {
    const focusable = [...sidebar.querySelectorAll('a, summary')].filter(element => element.getClientRects().length)
    if (!focusable.length) return
    const first = focusable[0], last = focusable.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
})

const tocLinks = [...document.querySelectorAll('.page-toc a')]
const sections = tocLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean)
if (sections.length) {
  const updateToc = () => {
    const active = [...sections].reverse().find(section => section.getBoundingClientRect().top <= 160) || sections[0]
    for (const link of tocLinks) {
      const current = link.getAttribute('href') === `#${active.id}`
      link.classList.toggle('active', current)
      if (current) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    }
  }
  let pending = false
  addEventListener('scroll', () => {
    if (pending) return
    pending = true
    requestAnimationFrame(() => { updateToc(); pending = false })
  }, { passive: true })
  updateToc()
}
