const assetVersion = new URL(import.meta.url).searchParams.get('v') || '0'
const { formattedYears, politiesAtYear } = await import(`../explore/query.js?v=${encodeURIComponent(assetVersion)}`)

const focusYear = 1000
const rangeStart = 960
const rangeEnd = 1280
const ratio = year => Math.max(0, Math.min(100, (year - rangeStart) / (rangeEnd - rangeStart) * 100))
const element = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

try {
  const response = await fetch('/explore/data/atlas.json')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const { records } = await response.json()
  const active = politiesAtYear(records, focusYear)
  document.querySelector('#home-counts').textContent = `${records.Region.length} 个地区 · ${active.length} 个已核实政权 · ${records.Event.length} 件事件`
  document.querySelector('#home-sample-count').textContent = `${active.length} 个已核实的`
  const mapRegions = document.querySelector('#map-region-links')
  for (const region of records.Region) {
    const count = active.filter(item => item.regionIds.includes(region.id)).length
    const regionLink = element('a', 'map-region-link', `${region.name} · ${count} 个政权 ↗`)
    regionLink.dataset.region = region.id
    regionLink.href = `/explore/?year=${focusYear}&focus=${encodeURIComponent(region.id)}#time-control`
    mapRegions.append(regionLink)
  }

  const lanes = document.querySelector('#home-lanes')
  for (const region of [...records.Region].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const section = element('section', 'home-region')
    const heading = element('h3', '', region.name)
    const regionList = element('div', 'home-region-list')
    for (const polity of active.filter(item => item.regionIds.includes(region.id))) {
      const row = element('a', 'home-lane')
      row.href = `/explore/political-entities/${polity.id}/`
      const title = element('span', 'home-lane-name', polity.name)
      const track = element('span', 'home-lane-track')
      for (const interval of polity.presenceIntervals ?? [polity.interval]) {
        const start = interval.start?.normalized?.year ?? rangeStart
        const end = interval.endExclusive?.normalized?.year ?? rangeEnd
        const from = Math.max(rangeStart, start), to = Math.min(rangeEnd, end)
        if (to <= from) continue
        const bar = element('span', 'home-lane-bar')
        bar.style.left = `${ratio(from)}%`
        bar.style.width = `${ratio(to) - ratio(from)}%`
        track.append(bar)
      }
      const duration = element('span', 'home-lane-years', formattedYears(polity.interval))
      row.append(title, track, duration)
      regionList.append(row)
    }
    section.append(heading, regionList)
    lanes.append(section)
  }
  const scale = element('div', 'home-scale')
  for (const year of [960, 1000, 1060, 1120, 1180, 1240, 1279]) {
    const mark = element('span', year === focusYear ? 'is-focus' : '', String(year))
    mark.style.left = `${ratio(year)}%`
    scale.append(mark)
  }
  lanes.append(scale)

  const stories = document.querySelector('#home-stories')
  for (const event of [...records.Event].sort((a, b) => a.interval.start.normalized.year - b.interval.start.normalized.year)) {
    const story = element('a', 'story-panel')
    story.href = `/explore/events/${event.id}/`
    story.append(element('span', 'story-overline', 'ARCHIVE / EVENT'), element('span', 'story-year', String(event.interval.start.normalized.year)), element('h3', '', event.name), element('span', 'story-place', event.placeLabel ?? '地点待核验'), element('span', 'story-link', '阅读事件与来源 ↗'))
    stories.append(story)
  }
  const disputedTerm = records.Assertion.find(claim => claim.target.type === 'RulerTerm' && claim.alternatives?.length)
  const term = records.RulerTerm.find(item => item.id === disputedTerm?.target.id)
  if (term) document.querySelector('#method-example').href = `/explore/people/${term.personId}/`
} catch {
  document.querySelector('#home-counts').textContent = '历史数据暂时无法加载，请稍后重试。'
  document.querySelector('#home-lanes').append(element('p', 'home-error', '时间预览暂不可用。仍可进入探索页面重试。'))
}
