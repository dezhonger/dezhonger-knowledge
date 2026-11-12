// Versioned, dependency-free contracts for the history atlas source files.
export const schemaVersion = 1

export const entityDirectories = Object.freeze({
  regions: 'Region', countries: 'Country', 'country-links': 'CountryLink',
  periods: 'HistoricalPeriod', 'political-entities': 'PoliticalEntity',
  dynasties: 'Dynasty', 'ruling-houses': 'RulingHouse', people: 'Person',
  'ruler-terms': 'RulerTerm', events: 'Event', places: 'Place',
  territories: 'Territory', relationships: 'Relationship',
  successions: 'Succession', sources: 'Source', assertions: 'Assertion',
  evidence: 'Evidence',
})

export const directoryForType = Object.freeze(Object.fromEntries(
  Object.entries(entityDirectories).map(([directory, type]) => [type, directory]),
))

export const enums = Object.freeze({
  countryLinkType: ['territorial-history', 'institutional-continuity', 'historiographical-association'],
  relationshipType: ['biological-parent', 'adoptive-parent', 'spouse', 'sibling'],
  successionType: ['direct', 'restoration', 'contested', 'interregnum', 'other'],
  controlType: ['actual-control', 'de-jure', 'claimed'],
  precision: ['day', 'month', 'year', 'circa', 'range', 'unknown'],
  calendar: ['proleptic-gregorian', 'julian', 'chinese-lunisolar', 'other', 'unknown'],
  reviewStatus: ['reviewed', 'provisional', 'disputed'],
  evidenceStance: ['supports', 'contradicts', 'context'],
  boundaryPrecision: ['high', 'medium', 'low', 'schematic'],
})

const required = {
  Region: ['name'], Country: ['name'],
  CountryLink: ['countryId', 'politicalEntityId', 'relationType', 'interval'],
  HistoricalPeriod: ['name', 'interval', 'regionIds'],
  PoliticalEntity: ['name', 'interval', 'regionIds'],
  Dynasty: ['name', 'interval'], RulingHouse: ['name'], Person: ['name'],
  RulerTerm: ['personId', 'politicalEntityId', 'title', 'interval'],
  Event: ['name', 'interval'], Place: ['name'],
  Territory: ['politicalEntityId', 'interval', 'controlType', 'geometryRef', 'geometryFeatureId', 'method', 'precision', 'originalSourceIds'],
  Relationship: ['fromPersonId', 'toPersonId', 'relationType'],
  Succession: ['predecessorTermId', 'successorTermId', 'relationType'],
  Source: ['title', 'sourceType', 'license'],
  Assertion: ['target', 'reviewStatus'],
  Evidence: ['assertionId', 'candidateId', 'sourceId', 'locator', 'stance'],
}

// These historical fields require a field-level Assertion with at least one supporting Evidence.
export const criticalFields = Object.freeze({
  CountryLink: ['/countryId', '/politicalEntityId', '/relationType', '/interval'],
  HistoricalPeriod: ['/interval'], PoliticalEntity: ['/name', '/interval'],
  Dynasty: ['/interval'], Person: ['/name'],
  RulerTerm: ['/personId', '/politicalEntityId', '/title', '/interval'], Event: ['/name', '/interval'],
  Territory: ['/politicalEntityId', '/interval', '/controlType', '/geometryRef', '/geometryFeatureId', '/method', '/precision', '/originalSourceIds'],
  Relationship: ['/fromPersonId', '/toPersonId', '/relationType'],
  Succession: ['/predecessorTermId', '/successorTermId', '/relationType'],
})

export const optionalCriticalFields = Object.freeze({
  Person: ['/birth', '/death'], Place: ['/location'],
  PoliticalEntity: ['/regionIds', '/capitalPlaceIds', '/dynastyIds', '/rulingHouseIds', '/presenceIntervals'],
  Dynasty: ['/rulingHouseIds'], RulingHouse: ['/personIds'],
  Relationship: ['/interval'], Event: ['/participants', '/placeLabel'],
})

// Optional and required cross-entity links share this mapping. A Country's
// historical connection to a polity is a CountryLink, never an untyped ID list.
export const referenceFields = Object.freeze({
  Region: { parentRegionId: 'Region' }, Country: { regionIds: 'Region' },
  CountryLink: { countryId: 'Country', politicalEntityId: 'PoliticalEntity' },
  HistoricalPeriod: { regionIds: 'Region' },
  PoliticalEntity: { regionIds: 'Region', dynastyIds: 'Dynasty', rulingHouseIds: 'RulingHouse', capitalPlaceIds: 'Place' },
  Dynasty: { politicalEntityIds: 'PoliticalEntity', rulingHouseIds: 'RulingHouse' },
  RulingHouse: { personIds: 'Person', politicalEntityIds: 'PoliticalEntity' },
  Person: { rulingHouseIds: 'RulingHouse' },
  RulerTerm: { personId: 'Person', politicalEntityId: 'PoliticalEntity' },
  Event: { regionIds: 'Region', placeIds: 'Place' },
  Place: { regionIds: 'Region' }, Territory: { politicalEntityId: 'PoliticalEntity' },
  Relationship: { fromPersonId: 'Person', toPersonId: 'Person' },
  Succession: { predecessorTermId: 'RulerTerm', successorTermId: 'RulerTerm' },
  Evidence: { assertionId: 'Assertion', sourceId: 'Source' },
})

export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

export function validateDatePoint(point, location = 'date') {
  const errors = []
  if (!isObject(point) || !Number.isSafeInteger(point.year)) return [`${location}.year must be an astronomical integer`]
  if (point.month !== undefined && (!Number.isInteger(point.month) || point.month < 1 || point.month > 12)) errors.push(`${location}.month must be 1–12`)
  if (point.day !== undefined) {
    if (point.month === undefined) errors.push(`${location}.day requires month`)
    else {
      const days = [31, isLeapYear(point.year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
      if (!Number.isInteger(point.day) || point.day < 1 || point.day > days[point.month - 1]) errors.push(`${location}.day is invalid for the proleptic Gregorian month`)
    }
  }
  return errors
}

export function compareDatePoints(a, b) {
  for (const part of ['year', 'month', 'day']) {
    const difference = (a[part] ?? 1) - (b[part] ?? 1)
    if (difference) return Math.sign(difference)
  }
  return 0
}

export function validateHistoricalDate(date, location = 'date') {
  const errors = []
  if (!isObject(date)) return [`${location} must be an object`]
  if (!enums.precision.includes(date.precision)) errors.push(`${location}.precision is invalid`)
  if (!isObject(date.original) || typeof date.original.text !== 'string' || !date.original.text.trim() || !enums.calendar.includes(date.original.calendar)) errors.push(`${location}.original needs text and calendar`)
  if (date.normalized !== null && date.normalized !== undefined) errors.push(...validateDatePoint(date.normalized, `${location}.normalized`))
  if (date.precision !== 'unknown' && date.normalized == null && !isObject(date.uncertainty)) errors.push(`${location} needs normalized or uncertainty`)
  if (date.precision === 'day' && date.normalized && (date.normalized.month === undefined || date.normalized.day === undefined)) errors.push(`${location} day precision needs month and day`)
  if (date.precision === 'month' && date.normalized && date.normalized.month === undefined) errors.push(`${location} month precision needs month`)
  if (date.uncertainty !== undefined) {
    if (!isObject(date.uncertainty) || !date.uncertainty.earliest || !date.uncertainty.latest) errors.push(`${location}.uncertainty needs earliest and latest`)
    else {
      errors.push(...validateDatePoint(date.uncertainty.earliest, `${location}.uncertainty.earliest`))
      errors.push(...validateDatePoint(date.uncertainty.latest, `${location}.uncertainty.latest`))
      if (errors.length === 0 && compareDatePoints(date.uncertainty.earliest, date.uncertainty.latest) > 0) errors.push(`${location}.uncertainty is reversed`)
      if (errors.length === 0 && date.normalized && (compareDatePoints(date.normalized, date.uncertainty.earliest) < 0 || compareDatePoints(date.normalized, date.uncertainty.latest) > 0)) errors.push(`${location}.normalized is outside uncertainty`)
    }
  }
  if (date.original?.calendar !== 'proleptic-gregorian' && date.normalized != null) {
    if (!isObject(date.conversion) || !date.conversion.method || !Array.isArray(date.conversion.sourceIds) || date.conversion.sourceIds.length === 0) errors.push(`${location}.conversion needs method and sourceIds`)
  }
  return errors
}

export function validateInterval(interval, location = 'interval') {
  if (!isObject(interval) || !('start' in interval) || !('endExclusive' in interval)) return [`${location} needs start and endExclusive`]
  const errors = []
  for (const endpoint of ['start', 'endExclusive']) {
    if (interval[endpoint] !== null) errors.push(...validateHistoricalDate(interval[endpoint], `${location}.${endpoint}`))
  }
  const start = interval.start?.normalized
  const end = interval.endExclusive?.normalized
  if (start && end && compareDatePoints(start, end) >= 0) errors.push(`${location} must have start < endExclusive`)
  const earliestStart = interval.start?.uncertainty?.earliest ?? start
  const latestEnd = interval.endExclusive?.uncertainty?.latest ?? end
  if (earliestStart && latestEnd && compareDatePoints(earliestStart, latestEnd) >= 0 && !errors.some(error => error.includes('start < endExclusive'))) errors.push(`${location} has no possible positive duration`)
  return errors
}

export function validateSourceLicense(license, location = 'license') {
  if (!isObject(license)) return [`${location} must be an object`]
  const errors = []
  if (typeof license.name !== 'string' || !license.name.trim()) errors.push(`${location}.name is required`)
  if (typeof license.attribution !== 'string') errors.push(`${location}.attribution must be explicit`)
  if (typeof license.modifyAllowed !== 'boolean') errors.push(`${location}.modifyAllowed must be explicit`)
  if (typeof license.redistributeAllowed !== 'boolean') errors.push(`${location}.redistributeAllowed must be explicit`)
  return errors
}

export function validateRecord(record, type) {
  const errors = []
  if (!isObject(record)) return [`${type} must be an object`]
  if (record.schemaVersion !== schemaVersion) errors.push(`${type}.schemaVersion must be ${schemaVersion}`)
  if (typeof record.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id)) errors.push(`${type}.id must be a stable kebab-case identifier`)
  for (const field of required[type] ?? []) if (record[field] === undefined || record[field] === null || record[field] === '') errors.push(`${type}.${field} is required`)
  for (const [field, values] of [['relationType', type === 'CountryLink' ? enums.countryLinkType : type === 'Relationship' ? enums.relationshipType : type === 'Succession' ? enums.successionType : null], ['controlType', type === 'Territory' ? enums.controlType : null], ['reviewStatus', type === 'Assertion' ? enums.reviewStatus : null], ['stance', type === 'Evidence' ? enums.evidenceStance : null]]) {
    if (values && record[field] !== undefined && !values.includes(record[field])) errors.push(`${type}.${field} is invalid`)
  }
  if (record.interval !== undefined) errors.push(...validateInterval(record.interval, `${type}.interval`))
  if (type === 'PoliticalEntity' && record.presenceIntervals !== undefined) {
    if (!Array.isArray(record.presenceIntervals) || !record.presenceIntervals.length) errors.push('PoliticalEntity.presenceIntervals must be a nonempty array')
    else record.presenceIntervals.forEach((interval, index) => errors.push(...validateInterval(interval, `PoliticalEntity.presenceIntervals[${index}]`)))
  }
  for (const field of ['birth', 'death']) if (record[field] !== undefined && record[field] !== null) errors.push(...validateHistoricalDate(record[field], `${type}.${field}`))
  if (type === 'Source') errors.push(...validateSourceLicense(record.license, 'Source.license'))
  if (type === 'Territory') {
    if (!isObject(record.precision) || !enums.boundaryPrecision.includes(record.precision.level) || !(record.precision.approximateKm >= 0)) errors.push('Territory.precision needs level and approximateKm')
    if (!Array.isArray(record.originalSourceIds) || record.originalSourceIds.length === 0) errors.push('Territory.originalSourceIds is required')
    if (typeof record.method !== 'string' || !record.method.trim()) errors.push('Territory.method is required')
  }
  if (type === 'Assertion' && (!isObject(record.target) || !directoryForType[record.target.type] || !record.target.id || !/^\/(?:[^/~]|~[01])+(?:\/(?:[^/~]|~[01])+)*$/.test(record.target.path ?? ''))) errors.push('Assertion.target needs type, id and JSON Pointer path')
  if (type === 'Assertion') {
    if ('value' in record || 'proposedValue' in record) errors.push('Assertion must not duplicate the entity field value')
    if (record.adoptedCandidateId !== 'adopted') errors.push('Assertion.adoptedCandidateId must be adopted (the entity field)')
    if (record.alternatives !== undefined) {
      if (!Array.isArray(record.alternatives)) errors.push('Assertion.alternatives must be an array')
      else {
        const ids = new Set()
        for (const alternative of record.alternatives) {
          if (!isObject(alternative) || typeof alternative.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(alternative.id) || alternative.id === 'adopted' || ids.has(alternative.id)) errors.push('Assertion alternative needs a unique id')
          if (!('value' in alternative)) errors.push('Assertion alternative needs value')
          if (!['rejected', 'unresolved'].includes(alternative.disposition)) errors.push('Assertion alternative disposition is invalid')
          if (alternative.disposition === 'rejected' && !alternative.reason) errors.push('Rejected assertion alternative needs reason')
          ids.add(alternative.id)
        }
        if (record.alternatives.length && !record.decisionRationale) errors.push('Assertion with alternatives needs decisionRationale')
      }
    }
  }
  if (type === 'Country' && ('politicalEntityIds' in record || 'politicalEntityLinks' in record)) errors.push('Country political entities must use typed, dated CountryLink records')
  if (type === 'Evidence' && (!isObject(record.locator) || !record.locator.reference)) errors.push('Evidence.locator.reference is required')
  return errors
}

export function pointerValue(object, pointer) {
  return pointer.slice(1).split('/').reduce((value, part) => value?.[part.replaceAll('~1', '/').replaceAll('~0', '~')], object)
}
