const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php'
const WIKIDATA_API  = 'https://www.wikidata.org/w/api.php'

// Wikidata unit ids, converted to km² for area and metres for elevation
const UNIT_FACTORS = {
  Q712226: 1,         // square kilometre
  Q232291: 2.589988,  // square mile
  Q35852:  0.01,      // hectare
  Q11573:  1,         // metre
  Q3710:   0.3048,    // foot
}

async function callApi(url, params, signal) {
  const query = new URLSearchParams({ format: 'json', origin: '*', ...params })
  const res = await fetch(`${url}?${query}`, {
    headers: { 'Api-User-Agent': 'Navio/1.0 (travel planner)' },
    signal,
  })
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
  return res.json()
}

const isDisambiguation = page => 'disambiguation' in (page.pageprops ?? {})

async function findArticle(destination, signal) {
  const search = term => callApi(WIKIPEDIA_API, {
    action: 'query', formatversion: '2', redirects: '1',
    generator: 'search', gsrsearch: term, gsrlimit: '1', gsrinfo: 'suggestion',
    prop: 'pageprops|description|extracts|pageimages|info',
    ppprop: 'wikibase_item|disambiguation',
    exintro: '1', explaintext: '1', exsentences: '4',
    piprop: 'thumbnail', pithumbsize: '960',
    inprop: 'url',
  }, signal)

  let data = await search(destination)
  let page = data.query?.pages?.[0]

  // Misspelt destinations tend to land on a disambiguation page, so retry with the search suggestion
  const suggestion = data.query?.searchinfo?.suggestion
  if ((!page || isDisambiguation(page)) && suggestion) {
    data = await search(suggestion)
    page = data.query?.pages?.[0]
  }

  return page && !isDisambiguation(page) && page.pageprops?.wikibase_item ? page : null
}

async function getEntities(ids, props, signal) {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 50)
  if (!unique.length) return {}

  const data = await callApi(WIKIDATA_API, {
    action: 'wbgetentities', ids: unique.join('|'), props, languages: 'en|mul', sitefilter: 'enwiki',
  }, signal)
  return data.entities ?? {}
}

// Preferred-rank statements win; deprecated and valueless statements are dropped
function statements(entity, property) {
  const all = (entity?.claims?.[property] ?? []).filter(s => s.rank !== 'deprecated' && s.mainsnak.datavalue)
  const preferred = all.filter(s => s.rank === 'preferred')
  return preferred.length ? preferred : all
}

const valuesOf = (entity, property) => statements(entity, property).map(s => s.mainsnak.datavalue.value)
const idsOf    = (entity, property) => valuesOf(entity, property).map(v => v.id).filter(Boolean)
const dateOf   = s => (s.qualifiers?.P585 ?? s.qualifiers?.P580)?.[0]?.datavalue?.value?.time

const latest = (entity, property) =>
  statements(entity, property).sort((a, b) => (dateOf(b) ?? '').localeCompare(dateOf(a) ?? ''))[0]

function yearOf(time) {
  const match = time?.match(/^([+-])0*(\d+)-/)
  if (!match) return null
  return match[1] === '-' ? -Number(match[2]) : Number(match[2])
}

function measure(entity, property) {
  const value = latest(entity, property)?.mainsnak.datavalue.value
  const factor = UNIT_FACTORS[value?.unit?.split('/').pop()]
  return factor ? Number(value.amount) * factor : null
}

const formatYear   = year => (year < 0 ? `${-year} BC` : String(year))
const formatNumber = n => n.toLocaleString('en', { maximumFractionDigits: Math.abs(n) < 100 ? 1 : 0 })
const capitalize   = text => text.charAt(0).toUpperCase() + text.slice(1)

async function addWikidataDetails(info, id, signal) {
  const place = (await getEntities([id], 'claims', signal))[id]
  const countryId = idsOf(place, 'P17')[0]

  const coordinates = valuesOf(place, 'P625')[0]
  if (coordinates) info.coordinates = { lat: coordinates.latitude, lng: coordinates.longitude }

  let country = null
  if (countryId === id) country = place
  else if (countryId) country = (await getEntities([countryId], 'claims', signal))[countryId]

  const twinIds = idsOf(place, 'P190')
  const events = statements(place, 'P793').slice(0, 8).map(s => ({
    id:   s.mainsnak.datavalue.value.id,
    year: yearOf(dateOf(s)),
  }))

  const linked = await getEntities([
    countryId,
    idsOf(place, 'P2184')[0],
    ...twinIds.slice(0, 4),
    ...events.map(e => e.id),
    ...idsOf(country, 'P38').slice(0, 2),
    ...idsOf(country, 'P37').slice(0, 3),
    idsOf(country, 'P1622')[0],
  ], 'labels|sitelinks', signal)

  // Many items (e.g. euro) now only carry a language-neutral "mul" label
  const label  = itemId => (linked[itemId]?.labels?.en ?? linked[itemId]?.labels?.mul)?.value
  const labels = itemIds => itemIds.map(label).filter(Boolean)

  if (countryId && countryId !== id) info.country = label(countryId)

  const population     = latest(place, 'P1082')
  const populationYear = population && yearOf(dateOf(population))
  const area           = measure(place, 'P2046')
  const elevation      = measure(place, 'P2044')
  const localName      = valuesOf(place, 'P1705').map(v => v.text).find(text => text !== info.title)
  const nickname       = valuesOf(place, 'P1449').find(v => v.language === 'en')?.text
  const twins          = labels(twinIds.slice(0, 4))

  info.facts = [
    localName && { icon: '🗣️', label: 'Local name', value: localName },
    nickname  && { icon: '🏷️', label: 'Nickname', value: nickname },
    population && {
      icon: '👥',
      label: 'Population',
      value: Number(population.mainsnak.datavalue.value.amount).toLocaleString('en') + (populationYear ? ` (${populationYear})` : ''),
    },
    area && { icon: '📐', label: 'Area', value: `${formatNumber(area)} km²` },
    elevation !== null && { icon: '⛰️', label: 'Elevation', value: `${formatNumber(elevation)} m` },
    twins.length > 0 && {
      icon: '🤝',
      label: 'Twinned with',
      value: twins.join(', ') + (twinIds.length > twins.length ? ` +${twinIds.length - twins.length} more` : ''),
    },
  ].filter(Boolean)

  const currencies  = labels(idsOf(country, 'P38').slice(0, 2))
  const languages   = labels(idsOf(country, 'P37').slice(0, 3))
  const drivingSide = label(idsOf(country, 'P1622')[0])
  const callingCode = valuesOf(country, 'P474')[0]

  info.essentials = [
    currencies.length > 0 && { icon: '💱', label: 'Currency', value: currencies.map(capitalize).join(', ') },
    languages.length > 0  && { icon: '💬', label: 'Language', value: languages.map(capitalize).join(', ') },
    drivingSide           && { icon: '🚗', label: 'Driving side', value: capitalize(drivingSide) },
    callingCode           && { icon: '📞', label: 'Calling code', value: callingCode },
  ].filter(Boolean)

  const undated = Number.MAX_SAFE_INTEGER
  info.events = events
    .map(e => ({ year: e.year, label: label(e.id) }))
    .filter(e => e.label)
    .sort((a, b) => (a.year ?? undated) - (b.year ?? undated))
    .slice(0, 5)
    .map(e => {
      const year = e.year === null ? null : formatYear(e.year)
      // Avoid "1964 1964 Summer Olympics" when the label already starts with the year
      return { year, label: year && e.label.startsWith(`${year} `) ? e.label.slice(year.length + 1) : e.label }
    })

  return linked[idsOf(place, 'P2184')[0]]?.sitelinks?.enwiki?.title
}

function firstSentences(text, count) {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*(?:\s+|$)/g) ?? [text]
  return sentences.slice(0, count).join('').trim()
}

async function fetchHistory(historyTitle, article, signal) {
  if (historyTitle) {
    const data = await callApi(WIKIPEDIA_API, {
      action: 'query', formatversion: '2', prop: 'extracts|info', inprop: 'url',
      exintro: '1', explaintext: '1', exsentences: '4', titles: historyTitle,
    }, signal)
    const page = data.query?.pages?.[0]
    if (page?.extract) return { text: page.extract, url: page.fullurl }
  }

  // No dedicated history article, so use the opening of the main article's History section
  const data = await callApi(WIKIPEDIA_API, {
    action: 'query', formatversion: '2', prop: 'extracts',
    explaintext: '1', exsectionformat: 'wiki', titles: article.title,
  }, signal)
  const section = data.query?.pages?.[0]?.extract?.match(/\n== History ==\n([\s\S]*?)(?:\n== [^=]|$)/)?.[1]
  if (!section) return null

  const text = section.split('\n').filter(line => line.trim() && !line.startsWith('=')).join(' ')
  return { text: firstSentences(text, 4), url: `${article.fullurl}#History` }
}

// Wikipedia + Wikidata summary of a destination, shown while the itinerary generates
export async function fetchDestinationInfo(destination, signal) {
  let info = null

  try {
    const article = await findArticle(destination, signal)
    if (!article) return null

    info = {
      title:       article.title,
      description: article.description,
      overview:    article.extract,
      image:       article.thumbnail?.source,
      url:         article.fullurl,
      facts:       [],
      essentials:  [],
      events:      [],
      history:     null,
    }

    const historyTitle = await addWikidataDetails(info, article.pageprops.wikibase_item, signal)
    info.history = await fetchHistory(historyTitle, article, signal)
  } catch {
    // Keep whatever loaded before the failure — this is only filler while the plan generates
  }

  return info
}
