const assetVersion = new URL(import.meta.url).searchParams.get('v') || '0'
const { eventsAtYear, formattedYears, politiesAtYear, rulerTermsAtYear } = await import(`./query.js?v=${encodeURIComponent(assetVersion)}`)

const MIN_YEAR = 960
const MAX_YEAR = 1279
const slider = document.querySelector('#year-slider')
const yearValue = document.querySelector('#year-value')
const summary = document.querySelector('#result-summary')
const groups = document.querySelector('#region-groups')
const eventsNode = document.querySelector('#event-list')
const plot = document.querySelector('#timeline-plot')
const lanes = document.querySelector('#timeline-lanes')
const eventStrip = document.querySelector('#timeline-events')
const axis = document.querySelector('#timeline-axis')
const cursor = document.querySelector('#timeline-cursor')
const viewport = document.querySelector('#timeline-viewport')
const mapRegions = document.querySelector('#explore-map-regions')
const clamp = value => Math.max(MIN_YEAR, Math.min(MAX_YEAR, Number.isFinite(value) ? Math.trunc(value) : 1000))
const pct = year => Math.max(0, Math.min(100, (year - MIN_YEAR) / (MAX_YEAR + 1 - MIN_YEAR) * 100))
const initial = Number(new URL(location.href).searchParams.get('year'))
slider.value = String(clamp(initial || 1000))

function node(tag, className, text) {
  const element = document.createElement(tag)
  if (className) element.className = className
  if (text !== undefined) element.textContent = text
  return element
}
function link(href, text, className) {
  const element = node('a', className, text)
  element.href = href
  return element
}
function sourceFor(records, type, id, path) {
  const claim = records.Assertion.find(item => item.target.type === type && item.target.id === id && item.target.path === path)
  const evidence = records.Evidence.find(item => item.assertionId === claim?.id && item.candidateId === 'adopted' && item.stance === 'supports')
  return records.Source.find(item => item.id === evidence?.sourceId)
}
function plotLabelWidth() { return parseFloat(getComputedStyle(plot).getPropertyValue('--label-width')) || 210 }
function cursorAt(year) {
  const labelWidth = plotLabelWidth()
  const x = labelWidth + (plot.clientWidth - labelWidth) * pct(year) / 100
  cursor.style.left = `${x}px`
  cursor.querySelector('span').textContent = String(year)
  if (window.innerWidth <= 760) viewport.scrollLeft = Math.max(0, x - viewport.clientWidth * .55)
}
function renderTimeline(records) {
  const focus = new URL(location.href).searchParams.get('focus')
  for (const region of records.Region) {
    const count = records.PoliticalEntity.filter(item => item.regionIds.includes(region.id)).length
    const regionLink = link(`#region-${region.id}`, `${region.name} · ${count} 个政权 ↗`, 'explore-map-region-link')
    regionLink.dataset.region = region.id
    mapRegions.append(regionLink)
  }
  for (const year of [960, 1000, 1050, 1100, 1150, 1200, 1250, 1279]) {
    const mark = node('span', 'axis-mark', String(year))
    mark.style.left = `${pct(year)}%`
    axis.append(mark)
  }
  eventStrip.append(node('span', 'strip-label', '事件 / EVENTS'))
  for (const event of records.Event) {
    const marker = link(`/explore/events/${event.id}/`, `${event.interval.start.normalized.year} · ${event.name}`, 'event-marker')
    marker.style.left = `${pct(event.interval.start.normalized.year)}%`
    marker.title = `${event.name} · ${event.interval.start.normalized.year}年`
    eventStrip.append(marker)
  }
  for (const region of [...records.Region].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const group = node('section', 'timeline-region')
    group.id = `region-${region.id}`
    if (region.id === focus) group.classList.add('is-focused-region')
    const heading = node('h3', '', region.name)
    group.append(heading)
    for (const polity of records.PoliticalEntity.filter(item => item.regionIds.includes(region.id))) {
      const row = node('div', 'timeline-row')
      const label = link(`/explore/political-entities/${polity.id}/`, polity.name, 'timeline-row-label')
      label.append(node('small', '', formattedYears(polity.interval)))
      const track = node('div', 'timeline-row-track')
      for (const interval of polity.presenceIntervals ?? [polity.interval]) {
        const start = interval.start?.normalized?.year ?? MIN_YEAR
        const end = interval.endExclusive?.normalized?.year ?? MAX_YEAR + 1
        const from = Math.max(MIN_YEAR, start), to = Math.min(MAX_YEAR + 1, end)
        if (to <= from) continue
        const bar = link(`/explore/political-entities/${polity.id}/`, polity.name, 'timeline-bar')
        bar.style.left = `${pct(from)}%`
        bar.style.width = `${pct(to) - pct(from)}%`
        bar.title = `${polity.name} · ${formattedYears(polity.interval)}`
        track.append(bar)
      }
      row.append(label, track)
      group.append(row)
    }
    lanes.append(group)
  }
  cursorAt(Number(slider.value))
}
function draw(records, year) {
  yearValue.textContent = String(year)
  slider.value = String(year)
  slider.setAttribute('aria-valuetext', `公元 ${year} 年`)
  const url = new URL(location.href)
  url.searchParams.set('year', String(year))
  history.replaceState(null, '', url)
  cursorAt(year)
  const active = politiesAtYear(records, year)
  summary.textContent = `公元 ${year} 年，本样本可展示 ${active.length} 个政权。未收录不代表不存在。`
  groups.replaceChildren()
  for (const region of [...records.Region].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const section = node('section', 'region-group')
    const head = node('div', 'region-head')
    const local = active.filter(item => item.regionIds.includes(region.id))
    head.append(node('h3', '', region.name), node('span', '', `${local.length} 个已核实条目`))
    section.append(head)
    const list = node('div', 'polity-list')
    if (!local.length) list.append(node('p', 'empty-state', '该年暂无已核实并收录的政权；这不是对历史存在与否的判断。'))
    for (const polity of local) {
      const row = node('article', 'polity-row')
      const main = node('div', 'polity-main')
      main.append(link(`/explore/political-entities/${polity.id}/`, polity.name, 'polity-title'), node('p', 'polity-years', formattedYears(polity.interval)))
      const terms = rulerTermsAtYear(records, polity.id, year)
      const reigns = node('div', 'polity-reigns')
      if (!terms.length) reigns.append(node('span', 'muted', '该年君主尚未纳入样本'))
      else for (const term of terms) {
        const person = records.Person.find(item => item.id === term.personId)
        const termLine = node('div', 'ruler-line')
        termLine.append(link(`/explore/people/${person.id}/`, `${person.name} · ${term.title}`, 'ruler-link'))
        const termSource = sourceFor(records, 'RulerTerm', term.id, '/interval')
        if (termSource) {
          const cited = link(termSource.url, '任期来源 ↗', 'ruler-source')
          cited.target = '_blank'; cited.rel = 'noopener noreferrer'
          termLine.append(cited)
        }
        reigns.append(termLine)
      }
      const source = sourceFor(records, 'PoliticalEntity', polity.id, '/interval')
      const foot = node('div', 'polity-foot')
      if (source) {
        const cited = link(source.url, `年代来源：${source.creator}`, 'source-link')
        cited.target = '_blank'; cited.rel = 'noopener noreferrer'
        foot.append(cited)
      }
      foot.append(link(`/explore/political-entities/${polity.id}/`, '打开详情与证据 ↗', 'detail-link'))
      row.append(main, reigns, foot)
      list.append(row)
    }
    section.append(list)
    groups.append(section)
  }
  eventsNode.replaceChildren()
  const events = eventsAtYear(records, year)
  if (!events.length) eventsNode.append(node('p', 'empty-state', '该年暂无已核实并收录的事件。'))
  for (const event of events) {
    const row = node('article', 'event-row')
    row.append(node('span', 'event-year', String(year)), link(`/explore/events/${event.id}/`, event.name, 'event-title'), node('span', 'event-place', event.placeLabel))
    eventsNode.append(row)
  }
}

try {
  const response = await fetch('/explore/data/atlas.json')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const { records } = await response.json()
  renderTimeline(records)
  const update = value => draw(records, clamp(value))
  slider.addEventListener('input', () => update(Number(slider.value)))
  document.querySelector('#year-back').addEventListener('click', () => update(Number(slider.value) - 10))
  document.querySelector('#year-forward').addEventListener('click', () => update(Number(slider.value) + 10))
  const selectAt = clientX => {
    const bounds = plot.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - bounds.left - plotLabelWidth()) / (plot.clientWidth - plotLabelWidth())))
    update(MIN_YEAR + Math.round(x * (MAX_YEAR - MIN_YEAR)))
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
  plot.addEventListener('click', event => { if (event.target.closest('a') || event.pointerType === 'mouse') return; selectAt(event.clientX) })
  window.addEventListener('resize', () => cursorAt(Number(slider.value)))
  update(Number(slider.value))
} catch (error) {
  summary.textContent = '历史数据暂时无法加载，请稍后重试。'
  groups.replaceChildren(node('p', 'empty-state', String(error.message)))
}
