// Shared by the build tests and the browser. A selected year means any part of
// that calendar year; it does not imply a reign lasted for the whole year.
export function overlapsYear(interval, year) {
  if (!interval) return false
  const start = interval.start?.uncertainty?.earliest?.year ?? interval.start?.normalized?.year ?? -Infinity
  const end = interval.endExclusive?.uncertainty?.latest?.year ?? interval.endExclusive?.normalized?.year ?? Infinity
  return start <= year && year < end
}

export function politiesAtYear(records, year) {
  return (records.PoliticalEntity ?? []).filter(entity =>
    (entity.presenceIntervals ?? [entity.interval]).some(interval => overlapsYear(interval, year)),
  )
}

export function rulerTermsAtYear(records, polityId, year) {
  return (records.RulerTerm ?? []).filter(term =>
    term.politicalEntityId === polityId && overlapsYear(term.interval, year),
  )
}

export function eventsAtYear(records, year) {
  return (records.Event ?? []).filter(event => overlapsYear(event.interval, year))
}

export function relatedEvents(records, type, id) {
  return (records.Event ?? []).filter(event => event.participants?.some(participant => participant.type === type && participant.id === id))
}

export function formattedYears(interval) {
  const start = interval?.start?.normalized?.year
  const end = interval?.endExclusive?.normalized?.year
  const label = year => year === 0 ? '公元前1' : year < 0 ? `公元前${1 - year}` : `${year}`
  const startLabel = start == null ? '不详' : `${interval.start?.precision === 'circa' ? '约' : ''}${label(start)}`
  if (start != null && end === start + 1) return `${startLabel}年`
  return `${startLabel}—${end == null ? '不详' : label(end - 1)}年`
}
