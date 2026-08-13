(() => {
  const buttons = [...document.querySelectorAll('[data-filter]')]
  const groups = [...document.querySelectorAll('.subject-group')]
  const modules = [...document.querySelectorAll('.learning-module')]
  const input = document.querySelector('#subject-search')
  const counter = document.querySelector('#visible-count')
  const empty = document.querySelector('#empty-state')
  let filter = 'all'
  const normalize = (value) => value.trim().toLocaleLowerCase('zh-CN')
  function refresh() {
    const query = normalize(input?.value || '')
    let visible = 0
    groups.forEach((group) => {
      let count = 0
      group.querySelectorAll('.learning-module').forEach((item) => {
        const match = (filter === 'all' || group.dataset.group === filter) && (!query || normalize(item.dataset.search || item.textContent || '').includes(query))
        item.hidden = !match
        if (match) { count += 1; visible += 1 }
      })
      group.hidden = count === 0
    })
    if (counter) counter.textContent = String(visible)
    if (empty) empty.hidden = visible > 0
  }
  buttons.forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.filter || 'all'
    buttons.forEach((item) => item.classList.toggle('active', item === button))
    refresh()
  }))
  input?.addEventListener('input', refresh)
  refresh()
})()
