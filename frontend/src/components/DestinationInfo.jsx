import { useEffect, useState } from 'react'
import DestinationStage from './DestinationStage'
import PlaceMap from './PlaceMap'

const HOLD_MS = 5200
const FADE_MS = 320

function formatCoordinates({ lat, lng }) {
  return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'W'}`
}

function Card({ icon, source, title, href, className = '', children }) {
  return (
    <section className={`flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
      <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-linear-to-r from-indigo-50/80 via-indigo-50/20 to-transparent px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[17px] shadow-sm ring-1 ring-indigo-100">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-600/70">{source}</p>
          <h3 className="truncate font-display text-base font-semibold tracking-tight text-gray-900">{title}</h3>
        </div>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-medium text-gray-400 transition-colors hover:bg-white hover:text-indigo-600"
          >
            Read ↗
          </a>
        )}
      </header>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  )
}

function Prose({ children }) {
  return <p className="px-4 py-3.5 text-[13.5px] leading-[1.75] text-gray-600">{children}</p>
}

function Facts({ facts }) {
  return (
    <div className="grid gap-2 p-3.5 sm:grid-cols-2">
      {facts.map(fact => (
        <div key={fact.label} className="rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            <span className="text-[13px] leading-none">{fact.icon}</span>
            {fact.label}
          </p>
          <p className="mt-1 text-[13.5px] font-semibold text-gray-800 wrap-break-word">{fact.value}</p>
        </div>
      ))}
    </div>
  )
}

function Timeline({ events }) {
  return (
    <ol className="my-4 ml-7 mr-4 border-l border-dashed border-indigo-200 pl-5">
      {events.map(event => (
        <li key={event.label} className="relative pb-4 last:pb-0">
          <span className="absolute -left-6.25 top-1.5 size-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
          {event.year && <p className="font-display text-[15px] font-semibold text-indigo-600">{event.year}</p>}
          <p className="text-[13.5px] leading-relaxed text-gray-700">{event.label}</p>
        </li>
      ))}
    </ol>
  )
}

// Commons transcodes are usually fine, but no card beats a dead player
function VideoCard({ video }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return (
    <Card icon="🎬" source="Wikimedia Commons" title="Video" href={video.page}>
      <video
        src={video.src}
        controls
        preload="metadata"
        onError={() => setFailed(true)}
        className="size-full bg-gray-900 object-contain"
      />
    </Card>
  )
}

// Prose and data cards alternate, so it is not one long run of paragraphs
function buildCards(info) {
  const text = [...info.sections]
  const data = [
    info.facts.length > 0 && { key: 'facts', node: (
      <Card icon="✨" source="Wikidata" title="Quick facts" className="h-full"><Facts facts={info.facts} /></Card>
    ) },
    info.essentials.length > 0 && { key: 'essentials', node: (
      <Card icon="🧭" source="Wikidata" title="Good to know" className="h-full"><Facts facts={info.essentials} /></Card>
    ) },
    info.events.length > 0 && { key: 'events', node: (
      <Card icon="⏳" source="Wikidata" title="Moments in time" className="h-full"><Timeline events={info.events} /></Card>
    ) },
  ].filter(Boolean)

  const cards = info.overview
    ? [{ key: 'overview', node: (
        <Card icon="📖" source="Wikipedia" title={`About ${info.title}`} href={info.url} className="h-full">
          <Prose>{info.overview}</Prose>
        </Card>
      ) }]
    : []

  const asCard = section => ({ key: section.id, node: (
    <Card icon={section.icon} source="Wikipedia" title={section.title} href={section.url} className="h-full">
      <Prose>{section.text}</Prose>
    </Card>
  ) })

  while (text.length || data.length) {
    if (text.length) cards.push(asCard(text.shift()))
    if (text.length) cards.push(asCard(text.shift()))
    if (data.length) cards.push(data.shift())
  }
  return cards
}

// One card at a time: it fades out, the next fades in on the same spot
function Rotator({ cards, className = '' }) {
  const [index, setIndex]     = useState(0)
  const [visible, setVisible] = useState(true)
  const total = cards.length

  useEffect(() => {
    if (total < 2) return
    const out  = setTimeout(() => setVisible(false), HOLD_MS)
    const next = setTimeout(() => {
      setIndex(i => (i + 1) % total)
      setVisible(true)
    }, HOLD_MS + FADE_MS)

    return () => { clearTimeout(out); clearTimeout(next) }
  }, [index, total])

  const show = position => {
    setIndex(position)
    setVisible(true)
  }

  return (
    <div className={`flex min-w-0 flex-col gap-3 ${className}`}>
      <div
        className={`min-h-64 flex-1 transition-all lg:min-h-0 ${visible ? 'opacity-100' : 'translate-y-1 opacity-0'}`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        {cards[index % total].node}
      </div>

      {total > 1 && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5">
          {cards.map((card, position) => (
            <button
              key={card.key}
              type="button"
              onClick={() => show(position)}
              aria-label={`Card ${position + 1} of ${total}`}
              aria-current={position === index}
              className={`h-1.5 cursor-pointer rounded-full transition-all ${
                position === index ? 'w-5 bg-indigo-600' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Skeleton({ className = '' }) {
  return (
    <div className={`grid animate-pulse gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] ${className}`}>
      <div className="min-h-72 rounded-2xl bg-gray-200 lg:min-h-0" />
      <div className="flex min-h-0 flex-col gap-4">
        <div className="min-h-64 flex-1 rounded-2xl border border-gray-200 bg-white" />
        <div className="h-52 shrink-0 rounded-2xl border border-gray-200 bg-white" />
      </div>
    </div>
  )
}

// info: undefined while loading, null when nothing was found
export default function DestinationInfo({ info, destination, className = '' }) {
  if (info === undefined) return <Skeleton className={className} />

  if (info === null) return (
    <div className={`grid place-content-center rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center ${className}`}>
      <p className="text-sm text-gray-500">
        Wikipedia has nothing that matches {destination ? `"${destination}"` : 'that destination'}.
      </p>
      <p className="mt-1 text-[13px] text-gray-400">Your itinerary is still being written.</p>
    </div>
  )

  const cards    = buildCards(info)
  const location = [info.country, info.coordinates && formatCoordinates(info.coordinates)].filter(Boolean).join(' · ')
  const extras   = [info.coordinates, info.video].filter(Boolean).length

  return (
    <div className={`grid min-h-0 animate-fade-in gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] ${className}`}>
      <DestinationStage
        images={info.images}
        title={info.title}
        description={info.description}
        location={location}
        className="min-h-72 lg:min-h-0"
      />

      <div className="flex min-h-0 flex-col gap-4">
        {cards.length > 0 && <Rotator cards={cards} className="min-h-0 flex-1" />}

        {extras > 0 && (
          <div className={`grid h-52 shrink-0 gap-4 ${extras === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {info.coordinates && (
              <Card icon="🗺️" source="OpenStreetMap" title="On the map">
                <PlaceMap
                  lat={info.coordinates.lat}
                  lng={info.coordinates.lng}
                  label={info.title}
                  className="size-full"
                />
              </Card>
            )}
            {info.video && <VideoCard video={info.video} />}
          </div>
        )}
      </div>
    </div>
  )
}
