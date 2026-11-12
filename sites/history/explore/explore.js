const assetVersion = new URL(import.meta.url).searchParams.get('v') || '0'
const { eventsAtYear, formattedYears, politiesAtYear, rulerTermsAtYear } = await import(`./query.js?v=${encodeURIComponent(assetVersion)}`)

const MIN_YEAR = 960
const MAX_YEAR = 1279
const MAP_WIDTH = 1200
const MAP_HEIGHT = 600
// These are camera frames, not political boundaries or coordinates assigned to a polity.
const mapViews = {
  world: { label: '世界地理', bounds: [-180, -90, 180, 90] },
  china: { label: '中国区域', bounds: [70, 5, 145, 62] },
  'europe-mediterranean': { label: '欧洲与地中海', bounds: [-25, 20, 65, 72] },
}
const byId = id => document.getElementById(id)
const yearValue = byId('year-value')
const yearInput = byId('year-input')
const slider = byId('year-slider')
const summary = byId('result-summary')
const groups = byId('region-groups')
const eventsNode = byId('event-list')
const selectedPolity = byId('selected-polity')
const mapSvg = byId('explore-map-svg')
const mapYear = byId('map-year')
const mapFocusTitle = byId('map-focus-title')
const mapActiveCount = byId('map-active-count')
const plot = byId('timeline-plot')
const lanes = byId('timeline-lanes')
const eventStrip = byId('timeline-events')
const axis = byId('timeline-axis')
const cursor = byId('timeline-cursor')
const viewport = byId('timeline-viewport')
const playButton = byId('year-play')
const clamp = value => Math.max(MIN_YEAR, Math.min(MAX_YEAR, Number.isFinite(value) ? Math.trunc(value) : 1000))
const pct = year => Math.max(0, Math.min(100, (year - MIN_YEAR) / (MAX_YEAR + 1 - MIN_YEAR) * 100))
const yearFromUrl = () => {
  const raw = new URL(location.href).searchParams.get('year')
  return raw && /^\d{3,4}$/.test(raw) ? clamp(Number(raw)) : 1000
}
const state = { year: yearFromUrl(), focus: 'world', selectedPolityId: null, playing: false }
let records
let playback

function node(tag, className, text) {
  const item = document.createElement(tag)
  if (className) item.className = className
  if (text !== undefined) item.textContent = text
  return item
}
function link(href, text, className) {
  const item = node('a', className, text)
  item.href = href
  return item
}
const compactName = name => name.replace(/（[^）]+）$/, '')
function sourceFor(type, id, path) {
  const claim = records.Assertion.find(item => item.target.type === type && item.target.id === id && item.target.path === path)
  const evidence = records.Evidence.find(item => item.assertionId === claim?.id && item.candidateId === 'adopted' && item.stance === 'supports')
  return records.Source.find(item => item.id === evidence?.sourceId)
}
function sourceLink(source, label, className) {
  const item = link(source.url, label, className)
  item.target = '_blank'
  item.rel = 'noopener noreferrer'
  return item
}
function project([longitude, latitude]) {
  return [(longitude + 180) / 360 * MAP_WIDTH, (90 - latitude) / 180 * MAP_HEIGHT]
}
function viewBoxFor(bounds) {
  const [west, south, east, north] = bounds
  const [x, y] = project([west, north])
  const [right, bottom] = project([east, south])
  return [x, y, right - x, bottom - y].map(number => Number(number.toFixed(2))).join(' ')
}
function setMapFocus(focus, { updateUrl = true } = {}) {
  state.focus = mapViews[focus] ? focus : 'world'
  if (updateUrl) {
    const url = new URL(location.href)
    if (state.focus === 'world') url.searchParams.delete('focus')
    else url.searchParams.set('focus', state.focus)
    history.replaceState(null, '', url)
  }
  mapSvg.setAttribute('viewBox', viewBoxFor(mapViews[state.focus].bounds))
  mapFocusTitle.textContent = mapViews[state.focus].label
  document.querySelectorAll('[data-map-focus]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.mapFocus === state.focus))
  })
  document.querySelectorAll('.timeline-region').forEach(region => {
    region.classList.toggle('is-outside-focus', state.focus !== 'world' && region.dataset.region !== state.focus)
  })
  state.selectedPolityId = politiesAtYear(records, state.year)
    .find(item => state.focus === 'world' || item.regionIds.includes(state.focus))?.id ?? null
  renderCurrentYear()
}
function plotLabelWidth() {
  return parseFloat(getComputedStyle(plot).getPropertyValue('--label-width')) || 150
}
function cursorAt(year) {
  const labelWidth = plotLabelWidth()
  const x = labelWidth + (plot.clientWidth - labelWidth) * pct(year) / 100
  cursor.style.left = `${x}px`
  cursor.querySelector('span').textContent = String(year)
  if (window.innerWidth <= 700) viewport.scrollLeft = Math.max(0, x - viewport.clientWidth * .56)
}
function eventLanes() {
  const markers = [...eventStrip.querySelectorAll('.event-marker')]
    .sort((a, b) => Number(a.dataset.year) - Number(b.dataset.year))
  const lastEnd = []
  const width = plot.clientWidth - plotLabelWidth()
  const laneStep = window.innerWidth <= 700 ? 44 : 23
  for (const marker of markers) {
    const x = width * pct(Number(marker.dataset.year)) / 100
    const estimatedWidth = Math.max(100, marker.textContent.length * 11)
    let lane = lastEnd.findIndex(end => x > end + 6)
    if (lane < 0) lane = lastEnd.length
    lastEnd[lane] = x + estimatedWidth
    marker.dataset.lane = String(lane)
    marker.style.top = `${2 + lane * laneStep}px`
  }
  eventStrip.style.height = `${Math.max(46, laneStep * lastEnd.length + 2)}px`
}
function renderTimeline() {
  for (const year of [960, 1000, 1050, 1100, 1150, 1200, 1250, 1279]) {
    const mark = node('span', 'axis-mark', String(year))
    mark.style.left = `${pct(year)}%`
    axis.append(mark)
  }
  eventStrip.append(node('span', 'strip-label', '事件 / EVENTS'))
  for (const event of records.Event) {
    const year = event.interval.start.normalized.year
    const marker = link(`/explore/events/${event.id}/`, `${year} · ${event.name}`, 'event-marker')
    marker.dataset.year = String(year)
    marker.style.left = `${pct(year)}%`
    marker.title = `${event.name} · ${year}年 · 点击阅读事件与来源`
    eventStrip.append(marker)
  }
  for (const region of [...records.Region].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const group = node('section', 'timeline-region')
    group.dataset.region = region.id
    group.id = `region-${region.id}`
    group.append(node('h3', '', region.name))
    for (const polity of records.PoliticalEntity.filter(item => item.regionIds.includes(region.id))) {
      const row = node('div', 'timeline-row')
      row.dataset.polityId = polity.id
      const label = link(`/explore/political-entities/${polity.id}/`, compactName(polity.name), 'timeline-row-label')
      label.title = polity.name
      label.append(node('small', '', formattedYears(polity.interval)))
      const track = node('div', 'timeline-row-track')
      for (const interval of polity.presenceIntervals ?? [polity.interval]) {
        const start = interval.start?.normalized?.year ?? MIN_YEAR
        const end = interval.endExclusive?.normalized?.year ?? MAX_YEAR + 1
        const from = Math.max(MIN_YEAR, start)
        const to = Math.min(MAX_YEAR + 1, end)
        if (to <= from) continue
        const bar = link(`/explore/political-entities/${polity.id}/`, compactName(polity.name), 'timeline-bar')
        bar.style.left = `${pct(from)}%`
        bar.style.width = `${pct(to) - pct(from)}%`
        bar.dataset.startYear = String(from)
        bar.dataset.endYear = String(to)
        bar.title = `${polity.name} · ${formattedYears(polity.interval)} · 点击查看详情`
        bar.dataset.polityId = polity.id
        track.append(bar)
      }
      row.append(label, track)
      group.append(row)
    }
    lanes.append(group)
  }
  eventLanes()
}
function inspectPolity(polityId) {
  const polity = records.PoliticalEntity.find(item => item.id === polityId)
  if (!polity) return
  state.selectedPolityId = polity.id
  selectedPolity.replaceChildren()
  selectedPolity.append(
    link(`/explore/political-entities/${polity.id}/`, polity.name, 'inspector-polity-name'),
    node('span', 'inspector-polity-years', formattedYears(polity.interval)),
  )
  const terms = rulerTermsAtYear(records, polity.id, state.year)
  if (!terms.length) selectedPolity.append(node('span', 'inspector-person', '该年君主尚未纳入样本'))
  for (const term of terms) {
    const person = records.Person.find(item => item.id === term.personId)
    if (person) selectedPolity.append(link(`/explore/people/${person.id}/`, `${person.name} · ${term.title} ↗`, 'inspector-person'))
    const termSource = sourceFor('RulerTerm', term.id, '/interval')
    if (termSource) selectedPolity.append(sourceLink(termSource, '任期来源 ↗', 'inspector-source'))
  }
  const source = sourceFor('PoliticalEntity', polity.id, '/interval')
  if (source) selectedPolity.append(sourceLink(source, `年代来源：${source.creator} ↗`, 'inspector-source'))
  document.querySelectorAll('[data-polity-id]').forEach(item => {
    item.classList.toggle('is-highlighted', item.dataset.polityId === polity.id)
  })
}
function renderCurrentYear() {
  if (!records) return
  const year = state.year
  const active = politiesAtYear(records, year)
  const focused = state.focus === 'world' ? active : active.filter(item => item.regionIds.includes(state.focus))
  mapYear.textContent = `${year} CE`
  mapActiveCount.textContent = `${focused.length} 个已收录政权 · 现代地理参照`
  summary.textContent = `${active.length} 个已收录政权 · ${eventsAtYear(records, year).length} 件已收录事件`
  groups.replaceChildren()
  for (const region of [...records.Region].sort((a, b) =>
    Number(b.id === state.focus) - Number(a.id === state.focus) || a.sortOrder - b.sortOrder)) {
    const section = node('section', 'region-group')
    section.dataset.region = region.id
    section.classList.toggle('is-outside-focus', state.focus !== 'world' && region.id !== state.focus)
    const local = active.filter(item => item.regionIds.includes(region.id))
    const head = node('div', 'region-head')
    head.append(node('h3', '', region.name), node('span', '', `${local.length} 个`))
    section.append(head)
    if (!local.length) section.append(node('p', 'empty-state', '该年暂无已核实条目'))
    for (const polity of local) {
      const row = node('article', 'polity-row')
      row.dataset.polityId = polity.id
      const title = link(`/explore/political-entities/${polity.id}/`, compactName(polity.name), 'polity-title')
      title.title = polity.name
      row.append(title)
      row.append(node('p', 'polity-years', formattedYears(polity.interval)))
      const reigns = node('div', 'polity-reigns')
      const terms = rulerTermsAtYear(records, polity.id, year)
      if (!terms.length) reigns.append(node('span', 'muted', '该年君主尚未纳入样本'))
      for (const term of terms) {
        const person = records.Person.find(item => item.id === term.personId)
        if (!person) continue
        const line = node('div', 'ruler-line')
        line.append(link(`/explore/people/${person.id}/`, person.name, 'ruler-link'))
        const termSource = sourceFor('RulerTerm', term.id, '/interval')
        if (termSource) line.append(sourceLink(termSource, '任期来源 ↗', 'ruler-source'))
        reigns.append(line)
      }
      row.append(reigns)
      const source = sourceFor('PoliticalEntity', polity.id, '/interval')
      const foot = node('div', 'polity-foot')
      if (source) foot.append(sourceLink(source, '年代来源 ↗', 'source-link'))
      foot.append(link(`/explore/political-entities/${polity.id}/`, '详情与证据 ↗', 'detail-link'))
      row.append(foot)
      row.addEventListener('pointerenter', () => inspectPolity(polity.id))
      row.addEventListener('focusin', () => inspectPolity(polity.id))
      section.append(row)
    }
    groups.append(section)
  }
  eventsNode.replaceChildren()
  const events = eventsAtYear(records, year)
  if (!events.length) eventsNode.append(node('p', 'empty-state', '该年暂无已核实事件。'))
  for (const event of events) {
    const row = node('article', 'event-row')
    row.append(node('span', 'event-year', String(year)), link(`/explore/events/${event.id}/`, event.name, 'event-title'))
    if (event.placeLabel) row.append(node('span', 'event-place', event.placeLabel))
    const source = sourceFor('Event', event.id, '/interval')
    if (source) row.append(sourceLink(source, '时间来源 ↗', 'source-link'))
    eventsNode.append(row)
  }
  if (!focused.some(item => item.id === state.selectedPolityId)) state.selectedPolityId = focused[0]?.id ?? null
  if (state.selectedPolityId) inspectPolity(state.selectedPolityId)
  else selectedPolity.textContent = '当前地图视图在该年暂无已核实并收录的政权。'
  document.querySelectorAll('.timeline-bar').forEach(bar => {
    const current = active.some(item => item.id === bar.dataset.polityId)
      && year >= Number(bar.dataset.startYear) && year < Number(bar.dataset.endYear)
    bar.classList.toggle('is-current', current)
    bar.classList.toggle('is-dimmed', !current)
  })
  document.querySelectorAll('.event-marker').forEach(marker => {
    marker.classList.toggle('is-current', Number(marker.dataset.year) === year)
  })
}
function setYear(value, { updateUrl = true } = {}) {
  state.year = clamp(value)
  yearValue.textContent = String(state.year)
  yearInput.value = String(state.year)
  slider.value = String(state.year)
  slider.setAttribute('aria-valuetext', `公元 ${state.year} 年`)
  if (updateUrl) {
    const url = new URL(location.href)
    url.searchParams.set('year', String(state.year))
    history.replaceState(null, '', url)
  }
  cursorAt(state.year)
  renderCurrentYear()
}
function stopPlayback() {
  clearInterval(playback)
  state.playing = false
  playButton.setAttribute('aria-pressed', 'false')
  playButton.innerHTML = '播放 <span aria-hidden="true">▶</span>'
  playButton.setAttribute('aria-label', '播放年份')
}
function togglePlayback() {
  if (state.playing) return stopPlayback()
  state.playing = true
  playButton.setAttribute('aria-pressed', 'true')
  playButton.textContent = '暂停 Ⅱ'
  playButton.setAttribute('aria-label', '暂停播放')
  playback = setInterval(() => {
    if (state.year >= MAX_YEAR) return stopPlayback()
    setYear(state.year + 1)
  }, 700)
}

try {
  const response = await fetch('/explore/data/atlas.json')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  ;({ records } = await response.json())
  renderTimeline()
  document.querySelectorAll('[data-map-focus]').forEach(button => button.addEventListener('click', () => setMapFocus(button.dataset.mapFocus)))
  document.querySelectorAll('.timeline-row').forEach(row => {
    row.addEventListener('pointerenter', () => inspectPolity(row.dataset.polityId))
    row.addEventListener('focusin', () => inspectPolity(row.dataset.polityId))
  })
  slider.addEventListener('input', () => setYear(Number(slider.value)))
  yearInput.addEventListener('change', () => setYear(Number(yearInput.value)))
  yearInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') { setYear(Number(yearInput.value)); yearInput.blur() }
  })
  byId('year-back').addEventListener('click', () => setYear(state.year - 10))
  byId('year-prev').addEventListener('click', () => setYear(state.year - 1))
  byId('year-next').addEventListener('click', () => setYear(state.year + 1))
  byId('year-forward').addEventListener('click', () => setYear(state.year + 10))
  playButton.addEventListener('click', togglePlayback)
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayback() })
  window.addEventListener('popstate', () => {
    setYear(yearFromUrl(), { updateUrl: false })
    setMapFocus(new URL(location.href).searchParams.get('focus'), { updateUrl: false })
  })
  viewport.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setYear(state.year + (event.key === 'ArrowRight' ? 1 : -1))
  })
  const selectAt = clientX => {
    const bounds = plot.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - bounds.left - plotLabelWidth()) / (plot.clientWidth - plotLabelWidth())))
    setYear(MIN_YEAR + Math.round(x * (MAX_YEAR - MIN_YEAR)))
  }
  let dragging = false
  plot.addEventListener('pointerdown', event => {
    if (event.target.closest('a') || event.pointerType !== 'mouse') return
    dragging = true
    plot.setPointerCapture(event.pointerId)
    selectAt(event.clientX)
  })
  plot.addEventListener('pointermove', event => { if (dragging) selectAt(event.clientX) })
  plot.addEventListener('pointerup', () => { dragging = false })
  plot.addEventListener('pointercancel', () => { dragging = false })
  plot.addEventListener('click', event => { if (!event.target.closest('a') && event.pointerType !== 'mouse') selectAt(event.clientX) })
  window.addEventListener('resize', () => { eventLanes(); cursorAt(state.year) })
  setMapFocus(new URL(location.href).searchParams.get('focus'), { updateUrl: false })
  setYear(state.year)
} catch (error) {
  summary.textContent = '历史数据暂时无法加载，请稍后重试。'
  groups.replaceChildren(node('p', 'empty-state', String(error.message)))
  stopPlayback()
}
