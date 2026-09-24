import { useEffect, useState } from 'react'
import DestinationInfo from './DestinationInfo'

const MESSAGE_SECONDS = 5

const MESSAGES = [
  dest => `Reading up on ${dest}…`,
  ()   => 'Gemini is drafting your days…',
  ()   => 'Choosing stops worth your time…',
  ()   => 'Grouping stops by neighbourhood…',
  ()   => 'Working out timings…',
  ()   => 'Leaving room for lunch…',
  ()   => 'Checking how far apart the stops are…',
  ()   => 'Matching places to your interests…',
  dest => `Looking for the quieter side of ${dest}…`,
  ()   => 'Balancing busy days with slower ones…',
  ()   => 'Writing the local tips…',
  ()   => 'Pinning everything to the map…',
  ()   => 'Putting the final plan together…',
]

export default function GeneratingView({ destination, days, budget, travelStyle, info, correctedFrom }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const message = MESSAGES[Math.floor(seconds / MESSAGE_SECONDS) % MESSAGES.length](destination)
  const clock   = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  const meta    = [days && `${days} ${days === 1 ? 'day' : 'days'}`, budget, travelStyle].filter(Boolean)

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100svh-7.75rem)]">
      <div className="shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3.5 px-4 py-3">
          <span className="size-9 shrink-0 animate-spin rounded-full border-[3px] border-indigo-100 border-t-indigo-600" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.14em] text-indigo-600">
              Generating itinerary · {destination}
              {correctedFrom && (
                <span className="font-medium normal-case tracking-normal text-gray-400">
                  {' '}· corrected from “{correctedFrom}”
                </span>
              )}
            </p>
            <p className="mt-0.5 truncate font-display text-[17px] font-semibold tracking-tight text-gray-900">
              {message}
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-1.5 md:flex">
            {meta.map(item => (
              <span key={item} className="rounded-full border border-gray-200 px-2.5 py-1 text-[11.5px] font-medium text-gray-600">
                {item}
              </span>
            ))}
          </div>

          <span className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1 text-[12.5px] font-semibold tabular-nums text-gray-500">
            {clock}
          </span>
        </div>

        <div className="h-1 overflow-hidden bg-gray-100">
          <div className="h-full w-1/3 animate-track bg-indigo-600" />
        </div>
      </div>

      <DestinationInfo info={info} destination={destination} className="min-h-0 flex-1" />

      <p className="shrink-0 text-center text-[11.5px] leading-relaxed text-gray-400">
        Usually under a minute — leaving this page will not stop it, the trip is already in My Trips.
        Itinerary by <span className="font-medium text-gray-500">Google Gemini</span>; destination details
        from Wikipedia, Wikidata and Wikimedia Commons.
      </p>
    </div>
  )
}
