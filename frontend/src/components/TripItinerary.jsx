import { useEffect, useMemo, useRef, useState } from 'react'
import TripMap from './TripMap'
import TripOverview, { AreaSplit } from './TripOverview'
import DayTimeline, { DayGlance } from './DayTimeline'
import { countStops, normalizeDay, slotsInPlan } from '../lib/itinerary'
import { useVisited } from '../lib/visited'

// Header height, so switching views lands the day strip right under it
const HEADER_OFFSET = 60

const hasCoords = place => place?.lat != null && place?.lng != null

const dayLabel = day => `Day ${day.day} · ${day.area || day.theme}`

const chipClass = (active, layout) =>
  `flex shrink-0 cursor-pointer rounded-[11px] border px-3.5 py-[7px] transition-colors ${layout} ${
    active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
  }`

export default function TripItinerary({ plan, tripId, interests, notes }) {
  const days       = useMemo(() => (plan.days || []).map(day => normalizeDay(day)), [plan.days])
  const tripSlots  = useMemo(() => slotsInPlan(plan.days), [plan.days])
  const totalStops = useMemo(() => countStops(plan.days), [plan.days])

  const [view, setView]          = useState(0) // 0 is the overview, otherwise a day number
  const [filters, setFilters]    = useState([])
  const [hover, setHover]        = useState(0)
  const [recenter, setRecenter]  = useState(0)
  const [visited, toggleVisited] = useVisited(tripId)

  const rootRef  = useRef(null)
  const stripRef = useRef(null)

  const index   = days.findIndex(day => day.day === view)
  const current = days[index]

  // Numbered after filtering, so the timeline and the map pins agree
  const blocks = useMemo(() => {
    if (!current) return []
    let num = 0
    return current.slots
      .filter(slot => filters.length === 0 || filters.includes(slot.slot))
      .map(slot => ({ ...slot, places: slot.places.map(place => ({ ...place, num: ++num })) }))
  }, [current, filters])

  const tripStops = useMemo(
    () => days.flatMap(day => day.slots.flatMap(slot =>
      slot.places.filter(hasCoords).map(place => ({ ...place, day: day.day, slot: slot.slot })),
    )),
    [days],
  )

  const dayStops = useMemo(
    () => blocks.flatMap(slot => slot.places.filter(hasCoords).map(place => ({ ...place, slot: slot.slot }))),
    [blocks],
  )

  // Keep the selected chip in view when the day changes from the prev/next buttons
  useEffect(() => {
    const strip = stripRef.current
    const chip  = strip.querySelector('[aria-current="true"]')
    if (!chip) return
    strip.scrollTo({ left: chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' })
  }, [view])

  const go = next => {
    setView(next)
    setFilters([])
    setHover(0)
    const top = rootRef.current.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' })
  }

  const toggleFilter = slot =>
    setFilters(prev => (prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]))

  const prev     = index > 0 ? days[index - 1] : null
  const next     = index >= 0 && index < days.length - 1 ? days[index + 1] : null
  const hovered  = days.find(day => day.day === hover)
  const mapStops = current ? dayStops : tripStops

  const mapCaption = current
    ? dayLabel(current)
    : hovered
      ? dayLabel(hovered)
      : `All ${days.length} ${days.length === 1 ? 'day' : 'days'} · ${totalStops} stops`

  return (
    <div ref={rootRef}>
      <div className="sticky top-15 z-30 -mx-(--page-gutter) border-b border-gray-200 bg-gray-50/90 px-(--page-gutter) py-2.5 backdrop-blur-md">
        <div ref={stripRef} className="no-scrollbar relative flex gap-2 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => go(0)}
            aria-current={current ? undefined : 'true'}
            className={chipClass(!current, 'items-center whitespace-nowrap text-[13.5px] font-medium')}
          >
            Overview
          </button>
          <span className="mx-1 my-1 w-px shrink-0 bg-gray-200" />
          {days.map(day => (
            <button
              key={day.day}
              type="button"
              onClick={() => go(day.day)}
              aria-current={view === day.day ? 'true' : undefined}
              className={chipClass(view === day.day, 'flex-col items-start gap-px text-left')}
            >
              <span className="text-[10.5px] font-semibold uppercase tracking-widest opacity-65">Day {day.day}</span>
              <span className="max-w-44 truncate text-[13.5px] font-medium">{day.area || day.theme}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid items-start gap-4.5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4.5">
          {current ? (
            <DayTimeline
              day={current}
              totalDays={days.length}
              blocks={blocks}
              tripSlots={tripSlots}
              filters={filters}
              onToggleFilter={toggleFilter}
              onClearFilters={() => setFilters([])}
              visited={visited}
              onToggleVisited={toggleVisited}
              prevLabel={prev ? `Day ${prev.day}` : 'Overview'}
              nextLabel={next ? `Day ${next.day}` : 'Overview'}
              onPrev={() => go(prev ? prev.day : 0)}
              onNext={() => go(next ? next.day : 0)}
            />
          ) : (
            <TripOverview
              days={days}
              hover={hover}
              onHover={setHover}
              onOpen={go}
              hasMap={tripStops.length > 0}
              tips={plan.generalTips}
              estimatedCost={plan.estimatedCost}
              interests={interests}
              notes={notes}
            />
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-3.5 max-lg:order-first lg:sticky lg:top-37">
          {tripStops.length > 0 && (
            <div className="isolate overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between gap-2.5 px-4 pb-3 pt-3.5">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    {current ? 'Route map' : 'Whole trip'}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">{mapCaption}</p>
                </div>
                {current && (
                  <button
                    type="button"
                    onClick={() => setRecenter(n => n + 1)}
                    className="shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-gray-600 transition-colors hover:border-indigo-200 hover:text-indigo-600"
                  >
                    Recenter
                  </button>
                )}
              </div>
              {mapStops.length > 0 ? (
                <TripMap
                  stops={mapStops}
                  numbered={Boolean(current)}
                  highlightDay={current ? 0 : hover}
                  recenter={recenter}
                />
              ) : (
                <p className="border-t border-gray-100 px-4 py-6 text-center text-sm text-gray-400">
                  No map locations for this day.
                </p>
              )}
            </div>
          )}
          {current ? <DayGlance blocks={blocks} /> : <AreaSplit days={days} />}
        </aside>
      </div>
    </div>
  )
}
