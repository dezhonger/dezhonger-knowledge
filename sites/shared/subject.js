(() => {
  const filterButtons = [...document.querySelectorAll('[data-filter]')]
  const groups = [...document.querySelectorAll('.subject-group')]
  const modules = [...document.querySelectorAll('.learning-module')]
  const input = document.querySelector('#subject-search')
  const counter = document.querySelector('#visible-count')
  const empty = document.querySelector('#empty-state')
  let activeFilter = 'all'

  const normalize = (value) => value.trim().toLocaleLowerCase('zh-CN')

  function refresh() {
    const query = normalize(input?.value || '')
    let visible = 0

    groups.forEach((group) => {
      const groupMatches = activeFilter === 'all' || group.dataset.group === activeFilter
      let groupVisible = 0
      group.querySelectorAll('.learning-module').forEach((item) => {
        const matches = !query || normalize(item.dataset.search || item.textContent || '').includes(query)
        item.hidden = !groupMatches || !matches
        if (!item.hidden) { visible += 1; groupVisible += 1 }
      })
      group.hidden = !groupVisible
    })

    if (counter) counter.textContent = String(visible)
    if (empty) empty.hidden = visible > 0
  }

  filterButtons.forEach((button) => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter || 'all'
    filterButtons.forEach((candidate) => candidate.classList.toggle('active', candidate === button))
    refresh()
    document.querySelector('main')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }))

  input?.addEventListener('input', refresh)
  modules.forEach((item) => item.addEventListener('click', (event) => {
    if (event.target.closest('a, button')) return
    item.classList.toggle('focused')
  }))
  refresh()
})()

