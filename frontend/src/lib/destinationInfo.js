const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php'
const WIKIDATA_API  = 'https://www.wikidata.org/w/api.php'
const COMMONS_FILE  = 'https://commons.wikimedia.org/wiki/File:'
const MEDIA_LIST    = 'https://en.wikipedia.org/api/rest_v1/page/media-list/'

const MAX_IMAGES = 6

// Infobox furniture rather than photographs of the place
const NOT_A_PHOTO = /\.(svg|gif)$|\b(map|flag|seal|emblem|logo|locator|icon|arms|chart|graph)\b/i

const VIDEO_FILE = /\.(webm|ogv|ogg|mp4|mov)$/i

// Commons transcodes every clip to VP9; the original is often Theora or 4K
const MAX_VIDEO_HEIGHT = 720

// Anything shorter reads as a stub, so the card is dropped
const MIN_SECTION = 140

// Backoff after a throttled request
const RETRY_MS = 800

// Wikidata unit ids, converted to km² for area and metres for elevation
const UNIT_FACTORS = {
  Q712226: 1,         // square kilometre
  Q232291: 2.589988,  // square mile
  Q35852:  0.01,      // hectare
  Q11573:  1,         // metre
  Q3710:   0.3048,    // foot
}

// Article sections worth a card, in the order they are shown
const TOPICS = [
  { id: 'history',    icon: '📜', title: 'A bit of history',     names: ['history'] },
  { id: 'etymology',  icon: '🔤', title: 'Behind the name',      names: ['etymology', 'name', 'names', 'toponymy'] },
  { id: 'about',      icon: '📝', title: 'The place itself',     names: ['description', 'overview'] },
  { id: 'geography',  icon: '🗺️', title: 'Geography',            names: ['geography', 'geography and climate', 'location', 'setting'] },
  { id: 'climate',    icon: '🌤️', title: 'Climate',              names: ['climate', 'weather'] },
  { id: 'culture',    icon: '🎭', title: 'Culture',              names: ['culture', 'arts and culture', 'arts', 'cultural heritage', 'lifestyle'] },
  { id: 'food',       icon: '🍜', title: 'Food and drink',       names: ['cuisine', 'food', 'food and drink', 'gastronomy'] },
  { id: 'sights',     icon: '🏛️', title: 'Sights and landmarks', names: ['main sights', 'landmarks', 'sights', 'list of attractions', 'attractions', 'places of interest', 'tourism', 'cityscape', 'architecture', 'recreation'] },
  { id: 'people',     icon: '👥', title: 'People',               names: ['demographics', 'population'] },
  { id: 'transport',  icon: '🚇', title: 'Getting around',       names: ['transport', 'transportation', 'infrastructure'] },
  { id: 'economy',    icon: '💼', title: 'Economy',              names: ['economy', 'economy and infrastructure'] },
  { id: 'sport',      icon: '⚽', title: 'Sport',                names: ['sport', 'sports', 'sports teams'] },
  { id: 'popculture', icon: '🍿', title: 'In popular culture',  names: ['in popular culture', 'in the arts', 'in fiction'] },
]

async function callApi(url, params, signal, retried = false) {
  const query = new URLSearchParams({ format: 'json', origin: '*', ...params })
  const res = await fetch(`${url}?${query}`, {
    headers: { 'Api-User-Agent': 'Navio/1.0 (travel planner)' },
    signal,
  })

  // Wikimedia throttles bursts, and one destination takes half a dozen calls back to back
  if (res.status === 429 && !retried) {
    await new Promise(resolve => setTimeout(resolve, RETRY_MS))
    return callApi(url, params, signal, true)
  }

  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
  return res.json()
}

const isDisambiguation = page => 'disambiguation' in (page.pageprops ?? {})

// Only somewhere with coordinates counts as a destination
const isPlace = page => Boolean(page?.coordinates?.length) && !isDisambiguation(page)

function distance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i)

  for (let i = 1; i <= a.length; i++) {
    const next = [i]
    for (let j = 1; j <= b.length; j++) {
      next[j] = a[i - 1] === b[j - 1] ? row[j - 1] : 1 + Math.min(row[j - 1], row[j], next[j - 1])
    }
    row = next
  }
  return row[b.length]
}

// True when the article is the same name spelled properly, not a different place
function isSpellingOf(typed, title) {
  const a = typed.toLowerCase()
  const b = title.toLowerCase()

  if (a === b) return typed !== title
  if (a.length < 4) return false

  return distance(a, b) <= Math.max(1, Math.round(Math.max(a.length, b.length) * 0.2))
}

async function lookUp(term, signal) {
  const data = await callApi(WIKIPEDIA_API, {
    action: 'query', formatversion: '2', redirects: '1',
    generator: 'search', gsrsearch: term, gsrlimit: '1', gsrinfo: 'suggestion',
    prop: 'pageprops|coordinates', ppprop: 'wikibase_item|disambiguation', colimit: '1',
  }, signal)

  return { page: data.query?.pages?.[0], suggestion: data.query?.searchinfo?.suggestion }
}

/**
 * Misspelt places land on the wrong article entirely: "Pariss" is an electric car
 * and "Zurick" is a band. When the typed name is not a place, take the spelling the
 * search engine suggests, but only if that one is. Correct names are left alone,
 * since the suggester also fires on them ("Paris" suggests "peric"), and so is
 * anything the article only shortens, like "Tokyo, Japan".
 */
export async function correctDestination(text, signal) {
  const typed = text.trim()
  if (typed.length < 3) return typed

  try {
    const { page, suggestion } = await lookUp(typed, signal)

    // A near miss still finds the right article, so take its spelling
    if (isPlace(page)) return isSpellingOf(typed, page.title) ? page.title : typed
    if (!suggestion) return typed

    const better = await lookUp(suggestion, signal)
    return isPlace(better.page) ? better.page.title : typed
  } catch {
    return typed
  }
}

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

  const clip = valuesOf(place, 'P10').find(name => VIDEO_FILE.test(name))

  let country = null
  if (countryId === id) country = place
  else if (countryId) country = (await getEntities([countryId], 'claims', signal))[countryId]

  const twinIds = idsOf(place, 'P190')
  const events = statements(place, 'P793').slice(0, 8).map(s => ({
    id:   s.mainsnak.datavalue.value.id,
    year: yearOf(dateOf(s)),
  }))

  const zoneIds = idsOf(place, 'P421').length ? idsOf(place, 'P421') : idsOf(country, 'P421')

  const linked = await getEntities([
    countryId,
    idsOf(place, 'P2184')[0],
    ...twinIds.slice(0, 4),
    ...events.map(e => e.id),
    ...zoneIds.slice(0, 2),
    ...idsOf(country, 'P38').slice(0, 2),
    ...idsOf(country, 'P37').slice(0, 3),
    idsOf(country, 'P1622')[0],
    ...idsOf(country, 'P2853').slice(0, 3),
    ...idsOf(country, 'P2852').slice(0, 2),
  ], 'labels|sitelinks', signal)

  // Many items (e.g. euro) now only carry a language-neutral "mul" label
  const label  = itemId => (linked[itemId]?.labels?.en ?? linked[itemId]?.labels?.mul)?.value
  const labels = itemIds => itemIds.map(label).filter(Boolean)

  if (countryId && countryId !== id) info.country = label(countryId)

  const population     = latest(place, 'P1082')
  const populationYear = population && yearOf(dateOf(population))
  const area           = measure(place, 'P2046')
  const elevation      = measure(place, 'P2044')
  const founded        = yearOf(latest(place, 'P571')?.mainsnak.datavalue.value.time)
  const localName      = valuesOf(place, 'P1705').map(v => v.text).find(text => text !== info.title)
  const nickname       = valuesOf(place, 'P1449').find(v => v.language === 'en')?.text
  const zones          = labels(zoneIds.slice(0, 2))
  const twins          = labels(twinIds.slice(0, 4))

  info.facts = [
    localName && { icon: '🗣️', label: 'Local name', value: localName },
    nickname  && { icon: '🏷️', label: 'Nickname', value: nickname },
    population && {
      icon: '👥',
      label: 'Population',
      value: Number(population.mainsnak.datavalue.value.amount).toLocaleString('en') + (populationYear ? ` (${populationYear})` : ''),
    },
    founded !== null && { icon: '📅', label: 'Founded', value: formatYear(founded) },
    area && { icon: '📐', label: 'Area', value: `${formatNumber(area)} km²` },
    elevation !== null && { icon: '⛰️', label: 'Elevation', value: `${formatNumber(elevation)} m` },
    zones.length > 0 && { icon: '🕒', label: 'Time zone', value: zones.join(', ') },
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
  const sockets     = labels(idsOf(country, 'P2853').slice(0, 3))
  const emergency   = labels(idsOf(country, 'P2852').slice(0, 2))

  info.essentials = [
    currencies.length > 0 && { icon: '💱', label: 'Currency', value: currencies.map(capitalize).join(', ') },
    languages.length > 0  && { icon: '💬', label: 'Language', value: languages.map(capitalize).join(', ') },
    drivingSide           && { icon: '🚗', label: 'Driving side', value: capitalize(drivingSide) },
    callingCode           && { icon: '📞', label: 'Calling code', value: callingCode },
    sockets.length > 0    && { icon: '🔌', label: 'Power sockets', value: sockets.join(', ') },
    emergency.length > 0  && { icon: '🚨', label: 'Emergency', value: emergency.join(' / ') },
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

  return { clip, historyTitle: linked[idsOf(place, 'P2184')[0]]?.sitelinks?.enwiki?.title }
}

function firstSentences(text, count) {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*(?:\s+|$)/g) ?? [text]
  return sentences.slice(0, count).join('').trim()
}

// Top-level headings only, so subsection text stays with its parent
function parseSections(extract) {
  const sections = {}
  for (const [, heading, body] of extract.matchAll(/\n==\s*([^=\n]+?)\s*==\n([\s\S]*?)(?=\n==\s*[^=\n]|$)/g)) {
    const text = body.split('\n').filter(line => line.trim() && !line.startsWith('=')).join(' ').trim()
    if (text) sections[heading.toLowerCase()] = { heading, text }
  }
  return sections
}

function sectionCards(extract, articleUrl) {
  const sections = parseSections(extract)

  return TOPICS.flatMap(topic => {
    const name = topic.names.find(n => sections[n])
    if (!name) return []

    const text = firstSentences(sections[name].text, 4)
    if (text.length < MIN_SECTION) return []

    return [{
      id: topic.id,
      icon: topic.icon,
      title: topic.title,
      text,
      url: `${articleUrl}#${sections[name].heading.replace(/ /g, '_')}`,
    }]
  })
}

function bestSrc(srcset) {
  const pick = srcset.find(s => s.scale === '2x') ?? srcset[srcset.length - 1]
  return pick.src.startsWith('//') ? `https:${pick.src}` : pick.src
}

// Article order, so the lead photographs come first
async function fetchImages(title, signal) {
  const res = await fetch(MEDIA_LIST + encodeURIComponent(title), {
    headers: { 'Api-User-Agent': 'Navio/1.0 (travel planner)' },
    signal,
  })
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)

  const data = await res.json()
  return (data.items ?? [])
    .filter(item => item.type === 'image' && item.showInGallery && item.srcset?.length)
    .map(item => ({
      src:     bestSrc(item.srcset),
      title:   item.title.replace(/^File:/, '').replace(/\.[^.]+$/, '').replace(/_/g, ' '),
      caption: item.caption?.text,
    }))
    .filter(image => !NOT_A_PHOTO.test(image.title))
    .slice(0, MAX_IMAGES)
}

async function fetchVideo(file, signal) {
  const data = await callApi(WIKIPEDIA_API, {
    action: 'query', formatversion: '2', prop: 'videoinfo', viprop: 'derivatives', titles: `File:${file}`,
  }, signal)

  const webm = (data.query?.pages?.[0]?.videoinfo?.[0]?.derivatives ?? [])
    .filter(d => d.transcodekey && d.type?.startsWith('video/webm'))
  if (!webm.length) return null

  // Biggest that still starts quickly, or the smallest on offer
  const small = webm.filter(d => d.height <= MAX_VIDEO_HEIGHT)
  const pick  = small.length
    ? small.reduce((best, d) => (d.height > best.height ? d : best))
    : webm.reduce((best, d) => (d.height < best.height ? d : best))

  return {
    src:  pick.src,
    page: COMMONS_FILE + encodeURIComponent(file),
    name: file.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
  }
}

async function fetchIntro(title, signal) {
  const data = await callApi(WIKIPEDIA_API, {
    action: 'query', formatversion: '2', prop: 'extracts|info', inprop: 'url',
    exintro: '1', explaintext: '1', exsentences: '4', titles: title,
  }, signal)
  const page = data.query?.pages?.[0]
  return page?.extract ? { text: page.extract, url: page.fullurl } : null
}

async function fetchSections(article, historyTitle, signal) {
  const data = await callApi(WIKIPEDIA_API, {
    action: 'query', formatversion: '2', prop: 'extracts',
    explaintext: '1', exsectionformat: 'wiki', titles: article.title,
  }, signal)

  const cards = sectionCards(data.query?.pages?.[0]?.extract ?? '', article.fullurl)
  if (!historyTitle) return cards

  // A dedicated history article beats the summary section in the main one
  let dedicated = null
  try {
    dedicated = await fetchIntro(historyTitle, signal)
  } catch {
    // Not worth losing every other card over
  }
  if (!dedicated || dedicated.text.length < MIN_SECTION) return cards

  const card  = { id: 'history', icon: '📜', title: 'A bit of history', ...dedicated }
  const index = cards.findIndex(c => c.id === 'history')
  if (index === -1) return [card, ...cards]

  cards[index] = card
  return cards
}

// Wikipedia + Wikidata summary of a destination, shown while the itinerary generates
export async function fetchDestinationInfo(destination, signal) {
  let article

  try {
    article = await findArticle(destination, signal)
  } catch {
    return null
  }
  if (!article) return null

  const info = {
    title:       article.title,
    description: article.description,
    overview:    article.extract,
    image:       article.thumbnail?.source,
    url:         article.fullurl,
    coordinates: null,
    country:     null,
    video:       null,
    images:      [],
    facts:       [],
    essentials:  [],
    events:      [],
    sections:    [],
  }

  // Every source below is an extra, so one failing must not empty the others
  let details = {}
  try {
    details = await addWikidataDetails(info, article.pageprops.wikibase_item, signal)
  } catch {
    // Keep the article on its own
  }

  try {
    info.images = await fetchImages(article.title, signal)
  } catch {
    // The article thumbnail below is enough
  }
  if (!info.images.length && info.image) info.images = [{ src: info.image, title: info.title }]

  if (details.clip) {
    try {
      info.video = await fetchVideo(details.clip, signal)
    } catch {
      // Keep the cards that do not need a video
    }
  }

  try {
    info.sections = await fetchSections(article, details.historyTitle, signal)
  } catch {
    // Keep the facts on their own
  }

  return info
}
