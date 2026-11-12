import { formattedYears, relatedEvents } from './query.mjs'

const labels = {
  name: '名称', interval: '时间范围', regionIds: '所属地区', presenceIntervals: '有效展示时段',
  personId: '人物', politicalEntityId: '所属政权', title: '头衔', participants: '参与者', placeLabel: '地点',
}
const typeNames = { PoliticalEntity: '政权', Person: '人物', Event: '事件' }
const typePaths = { PoliticalEntity: 'political-entities', Person: 'people', Event: 'events' }

export const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
export const hrefFor = (type, id) => `/explore/${typePaths[type]}/${encodeURIComponent(id)}/`

export function formatFact(value, records) {
  if (value?.start && 'endExclusive' in value) return formattedYears(value)
  if (Array.isArray(value)) {
    if (value.every(item => item?.start && 'endExclusive' in item)) return value.map(formattedYears).join('、')
    if (value.every(item => typeof item === 'string')) return value.map(id => records.Region?.find(region => region.id === id)?.name ?? id).join('、')
    return value.map(item => `${records[item.type]?.find(record => record.id === item.id)?.name ?? item.id}（${item.role}）`).join('、')
  }
  if (typeof value === 'string') return records.Person?.find(item => item.id === value)?.name ?? records.PoliticalEntity?.find(item => item.id === value)?.name ?? value
  return String(value ?? '未记录')
}

function sourceLink(source, locator) {
  const url = /^https:\/\//.test(source.url ?? '') ? source.url : '#'
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)}</a><span>${escapeHtml(source.creator)}${source.publicationYear ? ` · ${source.publicationYear}` : ' · 年份未标明'} · ${escapeHtml(locator.reference)}</span>`
}

export function renderEvidence(type, entity, records) {
  const sources = new Map(records.Source.map(source => [source.id, source]))
  const claims = records.Assertion.filter(assertion => assertion.target.type === type && assertion.target.id === entity.id)
  return claims.map(assertion => {
    const field = assertion.target.path.slice(1)
    const adoptedValue = entity[field]
    const supporting = records.Evidence.filter(evidence => evidence.assertionId === assertion.id && evidence.candidateId === 'adopted' && evidence.stance === 'supports')
    const citations = supporting.map(evidence => sourceLink(sources.get(evidence.sourceId), evidence.locator)).map(html => `<li>${html}</li>`).join('')
    const alternatives = (assertion.alternatives ?? []).map(alternative => {
      const cited = records.Evidence.filter(evidence => evidence.assertionId === assertion.id && evidence.candidateId === alternative.id).map(evidence => sourceLink(sources.get(evidence.sourceId), evidence.locator)).map(html => `<li>${html}</li>`).join('')
      return `<div class="alternative"><strong>${alternative.disposition === 'rejected' ? '未采用说法' : '尚待裁定'}：${escapeHtml(formatFact(alternative.value, records))}</strong><p>${escapeHtml(alternative.reason ?? '')}</p><ul>${cited}</ul></div>`
    }).join('')
    return `<div class="evidence-row"><div class="evidence-name">${escapeHtml(labels[field] ?? field)}</div><div class="evidence-content"><strong>${escapeHtml(formatFact(adoptedValue, records))}</strong>${assertion.decisionRationale ? `<p class="decision">${escapeHtml(assertion.decisionRationale)}</p>` : ''}<ul>${citations}</ul>${alternatives}</div></div>`
  }).join('')
}

function renderArticle(article) {
  return article.content.trim().split(/\n\s*\n/).filter(Boolean).map(paragraph => `<p>${escapeHtml(paragraph.trim())}</p>`).join('')
}

function renderArticleSources(article, records) {
  const sources = article.data.sourceIds.map(id => records.Source.find(source => source.id === id))
  return `<div class="article-sources"><strong>本文资料</strong><ul>${sources.map(source => `<li>${sourceLink(source, { reference: source.locatorGuide })}</li>`).join('')}</ul></div>`
}

function linkItem(type, item, detail) {
  return `<li><a href="${hrefFor(type, item.id)}"><strong>${escapeHtml(item.name)}</strong>${detail ? `<span>${escapeHtml(detail)}</span>` : ''}<span aria-hidden="true">↗</span></a></li>`
}

function relatedSection(title, items) {
  return `<section><h3>${escapeHtml(title)}</h3>${items.length ? `<ul>${items.join('')}</ul>` : '<p class="related-empty">本样本暂无关联条目</p>'}</section>`
}

function renderVisual(type, entity, records) {
  if (type === 'PoliticalEntity') {
    const terms = records.RulerTerm.filter(term => term.politicalEntityId === entity.id)
    const start = entity.interval.start?.normalized?.year
    const end = entity.interval.endExclusive?.normalized?.year
    const span = end - start
    const segments = (entity.presenceIntervals ?? [entity.interval]).map(interval => {
      const from = interval.start?.normalized?.year ?? start
      const to = interval.endExclusive?.normalized?.year ?? end
      const left = Math.max(0, Math.min(100, (from - start) / span * 100))
      const width = Math.max(0, Math.min(100 - left, (to - from) / span * 100))
      return `<span class="period-segment" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%"></span>`
    }).join('')
    const termList = terms.map(term => {
      const person = records.Person.find(item => item.id === term.personId)
      return `<li><a href="${hrefFor('Person', person.id)}"><span>${escapeHtml(person.name)}</span><strong>${escapeHtml(formattedYears(term.interval))}</strong></a></li>`
    }).join('')
    return `<div class="visual-overline">POLITY / TIME SPAN</div><div class="visual-big-number">${escapeHtml(String(start))}<span>—</span>${escapeHtml(String(end - 1))}</div><p>全时段 · ${escapeHtml(formattedYears(entity.interval))}</p><div class="period-track" aria-label="有效展示时段">${segments}</div><div class="period-ends"><span>${escapeHtml(String(start))}</span><span>${escapeHtml(String(end - 1))}</span></div><div class="visual-records"><span>本样本君主任期</span>${terms.length ? `<ul>${termList}</ul>` : '<p>尚未收录君主任期</p>'}</div>`
  }
  if (type === 'Person') {
    const terms = records.RulerTerm.filter(term => term.personId === entity.id)
    const events = relatedEvents(records, type, entity.id)
    const termItems = terms.map(term => `<li><span>${escapeHtml(records.PoliticalEntity.find(polity => polity.id === term.politicalEntityId)?.name ?? '')}</span><strong>${escapeHtml(formattedYears(term.interval))}</strong></li>`).join('')
    const eventItems = events.map(event => `<li><a href="${hrefFor('Event', event.id)}"><span>${escapeHtml(event.name)}</span><strong>${escapeHtml(formattedYears(event.interval))}</strong></a></li>`).join('')
    return `<div class="visual-overline">PERSON / CHRONICLE</div><div class="person-image-state"><span>图像档案</span><strong>暂无经许可核验的画像</strong><small>使用任期与事件记录建立人物索引</small></div><div class="person-chronicle"><h2>任期与事件</h2>${terms.length ? `<ul>${termItems}</ul>` : '<p>本样本未录入任期</p>'}${events.length ? `<ul>${eventItems}</ul>` : '<p>本样本未录入事件</p>'}</div>`
  }
  const year = entity.interval.start?.normalized?.year
  const participants = (entity.participants ?? []).filter(item => item.type in typePaths).map(item => {
    const participant = records[item.type].find(record => record.id === item.id)
    return `<li><a href="${hrefFor(item.type, item.id)}"><span>${escapeHtml(participant.name)}</span><small>${escapeHtml(item.role)}</small></a></li>`
  }).join('')
  return `<div class="visual-overline">EVENT / CONVERGENCE</div><strong class="event-visual-year">${escapeHtml(String(year))}</strong><span class="event-visual-place">${escapeHtml(entity.placeLabel ?? '地点未记录')}</span><div class="event-participants"><h2>同一事件的参与者</h2><ul>${participants}</ul></div>`
}

export function renderDetail(template, type, entity, records, article) {
  const people = new Map(records.Person.map(item => [item.id, item]))
  const polities = new Map(records.PoliticalEntity.map(item => [item.id, item]))
  const regions = new Map(records.Region.map(item => [item.id, item]))
  let period = '', related = ''
  if (type === 'PoliticalEntity') {
    period = formattedYears(entity.interval)
    const terms = records.RulerTerm.filter(term => term.politicalEntityId === entity.id).map(term => linkItem('Person', people.get(term.personId), `${term.title} · ${formattedYears(term.interval)}`))
    const events = relatedEvents(records, type, entity.id).map(event => linkItem('Event', event, formattedYears(event.interval)))
    related = relatedSection('本样本君主', terms) + relatedSection('相关事件', events)
    if (entity.presenceIntervals) related += `<p class="coverage-note">${escapeHtml(regions.get(entity.regionIds[0])?.name ?? '')} · 本条目的总时间范围与可展示时段不同，请查看下方的年代证据。</p>`
  } else if (type === 'Person') {
    const terms = records.RulerTerm.filter(term => term.personId === entity.id)
    period = terms.length ? terms.map(term => `${term.title} · ${formattedYears(term.interval)}`).join('；') : '本样本未录入君主任期'
    related = relatedSection('任职政权', terms.map(term => linkItem('PoliticalEntity', polities.get(term.politicalEntityId), formattedYears(term.interval))))
      + relatedSection('相关事件', relatedEvents(records, type, entity.id).map(event => linkItem('Event', event, formattedYears(event.interval))))
  } else {
    period = `${formattedYears(entity.interval)} · ${entity.placeLabel ?? '地点未记录'}`
    related = relatedSection('参与者与政权', (entity.participants ?? []).filter(participant => participant.type in typePaths).map(participant => linkItem(participant.type, (participant.type === 'Person' ? people : polities).get(participant.id), participant.role)))
  }
  const ownEvidence = renderEvidence(type, entity, records)
  const termsForEvidence = type === 'PoliticalEntity' ? records.RulerTerm.filter(term => term.politicalEntityId === entity.id)
    : type === 'Person' ? records.RulerTerm.filter(term => term.personId === entity.id) : []
  const termEvidence = termsForEvidence.map(term => `<h3 class="evidence-subtitle">${escapeHtml(people.get(term.personId)?.name ?? '')} · ${escapeHtml(term.title)}任期</h3>${renderEvidence('RulerTerm', term, records)}`).join('')
  const replacements = {
    DESCRIPTION: `${entity.name}：时间、关联条目与史料来源`, TITLE: entity.name,
    EYEBROW: `${typeNames[type]} / HISTORY ATLAS`, PERIOD: period,
    TYPE_CLASS: `detail--${typePaths[type]}`, VISUAL: renderVisual(type, entity, records),
    ARTICLE: renderArticle(article) + renderArticleSources(article, records), RELATED: related,
    EVIDENCE: ownEvidence + termEvidence,
  }
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => ['ARTICLE','RELATED','EVIDENCE','VISUAL'].includes(key) ? replacements[key] : escapeHtml(replacements[key] ?? ''))
}
