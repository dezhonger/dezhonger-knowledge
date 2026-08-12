(() => {
  const buttons = [...document.querySelectorAll('[data-filter]')]
  const sections = [...document.querySelectorAll('.catalog-section')]
  const input = document.querySelector('#catalog-search')
  const counter = document.querySelector('#visible-count')
  const empty = document.querySelector('#empty-state')
  let activeFilter = 'all'

  const normalize = (value) => value.trim().toLocaleLowerCase('zh-CN')

  function refresh() {
    const query = normalize(input?.value || '')
    let visibleSections = 0

    sections.forEach((section) => {
      const groups = section.dataset.groups?.split(/\s+/) || []
      const groupMatches = activeFilter === 'all' || groups.includes(activeFilter)
      let visibleItems = 0

      section.querySelectorAll('li').forEach((item) => {
        const matches = !query || normalize(item.textContent || '').includes(query)
        item.hidden = !matches
        item.classList.toggle('match', Boolean(query && matches))
        if (matches) visibleItems += 1
      })

      section.hidden = !groupMatches || visibleItems === 0
      if (!section.hidden) visibleSections += 1
    })

    if (counter) counter.textContent = String(visibleSections)
    if (empty) empty.hidden = visibleSections > 0
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter || 'all'
      buttons.forEach((candidate) => candidate.classList.toggle('active', candidate === button))
      refresh()
      document.querySelector('main')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })

  input?.addEventListener('input', refresh)
  refresh()
})()
