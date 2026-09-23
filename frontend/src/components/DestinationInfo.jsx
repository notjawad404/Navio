function formatCoordinates({ lat, lng }) {
  return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'W'}`
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</h3>
      {children}
    </section>
  )
}

function FactGrid({ facts }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {facts.map(fact => (
        <div key={fact.label} className="flex items-start gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
          <span className="text-lg leading-none mt-0.5">{fact.icon}</span>
          <div className="min-w-0">
            <dt className="text-xs text-gray-400">{fact.label}</dt>
            <dd className="text-sm font-medium text-gray-800 wrap-break-word">{fact.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

function DestinationInfoSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
      <div className="h-56 sm:h-64 bg-gray-100" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-3 w-24 rounded bg-gray-100" />
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-11/12 rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  )
}

// info: undefined while loading, null when nothing was found
export default function DestinationInfo({ info }) {
  if (info === null) return null
  if (info === undefined) return <DestinationInfoSkeleton />

  const location = [info.country, info.coordinates && formatCoordinates(info.coordinates)].filter(Boolean).join(' · ')

  const heading = (
    <>
      <h2 className="text-2xl font-bold">{info.title}</h2>
      {info.description && <p className="text-sm opacity-80">{info.description}</p>}
      {location && <p className="text-xs opacity-70 mt-1">📍 {location}</p>}
    </>
  )

  return (
    <article className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {info.image ? (
        <div className="relative h-56 sm:h-64 bg-gray-100">
          <img src={info.image} alt={info.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">{heading}</div>
        </div>
      ) : (
        <div className="px-5 pt-5 text-gray-800">{heading}</div>
      )}

      <div className="p-5 flex flex-col gap-6">
        {info.overview && (
          <Section title="Overview">
            <p className="text-sm text-gray-600 leading-relaxed">{info.overview}</p>
          </Section>
        )}

        {info.facts.length > 0 && (
          <Section title="Fun facts">
            <FactGrid facts={info.facts} />
          </Section>
        )}

        {(info.history || info.events.length > 0) && (
          <Section title="A bit of history">
            {info.history && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {info.history.text}{' '}
                <a href={info.history.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                  Read more
                </a>
              </p>
            )}
            {info.events.length > 0 && (
              <ol className="mt-3 flex flex-col gap-2 border-l-2 border-indigo-100 pl-4">
                {info.events.map(event => (
                  <li key={event.label} className="text-sm text-gray-700">
                    {event.year && <span className="font-semibold text-indigo-600 mr-2">{event.year}</span>}
                    {event.label}
                  </li>
                ))}
              </ol>
            )}
          </Section>
        )}

        {info.essentials.length > 0 && (
          <Section title="Good to know">
            <FactGrid facts={info.essentials} />
          </Section>
        )}

        <p className="text-xs text-gray-400">
          From{' '}
          <a href={info.url} target="_blank" rel="noreferrer" className="underline hover:text-gray-600">Wikipedia</a>
          {' '}and Wikidata
        </p>
      </div>
    </article>
  )
}
