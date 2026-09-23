import { getSlotMeta, normalizeDay, formatSpan } from '../lib/itinerary'

const MODE_ICON = {
  Walk:  '🚶',
  Metro: '🚇',
  Subway:'🚇',
  Train: '🚆',
  Bus:   '🚌',
  Taxi:  '🚕',
  Car:   '🚗',
  Ferry: '⛴️',
  Bike:  '🚲',
}

function TravelLeg({ travel }) {
  if (!travel?.minutes) return null
  const icon = MODE_ICON[travel.mode] || '➡️'
  return (
    <div className="flex items-center gap-3 py-1.5 text-[11px] text-gray-400">
      <span className="flex w-5 shrink-0 justify-center">
        <span className="w-px h-4 bg-gray-200" />
      </span>
      <span>{icon} {travel.mode} · {travel.minutes} min</span>
    </div>
  )
}

function PlaceRow({ data, color, isLast }) {
  return (
    <div>
      <div className="flex gap-3">
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ backgroundColor: data.pin ? color : undefined }}
        >
          {data.pin ?? <span className="w-[7px] h-[7px] rounded-full bg-gray-400" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            {data.startTime && (
              <span className="text-[11px] font-semibold text-gray-500 tabular-nums">
                {data.startTime}
              </span>
            )}
            <p className="font-semibold text-gray-900 text-sm">{data.place}</p>
            {data.duration && (
              <span className="ml-auto text-[11px] text-gray-400 shrink-0">⏱ {data.duration}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{data.activity}</p>
          {data.description && (
            <p className="text-xs text-gray-600 leading-relaxed mt-1">{data.description}</p>
          )}
        </div>
      </div>
      {!isLast && <TravelLeg travel={data.travelToNext} />}
    </div>
  )
}

function SlotSection({ slot }) {
  const meta = getSlotMeta(slot.slot)
  const span = formatSpan(slot.startTime, slot.endTime)

  return (
    <section className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2 mb-1">
        <span>{meta.icon}</span>
        <span className={`text-xs font-bold uppercase tracking-wider ${meta.text}`}>
          {meta.label}
        </span>
        {span && <span className="ml-auto text-xs text-gray-400 tabular-nums">{span}</span>}
      </div>

      {slot.title && <p className="text-xs text-gray-500 mb-3">{slot.title}</p>}

      <div className="flex flex-col gap-2">
        {slot.places.map((place, i) => (
          <PlaceRow
            key={`${place.place}-${i}`}
            data={place}
            color={meta.hex}
            isLast={i === slot.places.length - 1}
          />
        ))}
      </div>
    </section>
  )
}

// Numbered in the same order as the day's map pins
function withPins(slots) {
  let pin = 0
  return slots.map(slot => ({
    ...slot,
    places: slot.places.map(p => ({ ...p, pin: p.lat != null && p.lng != null ? ++pin : null })),
  }))
}

export default function DayCard({ day, active }) {
  const slots = withPins(normalizeDay(day).slots)
  const stops = slots.reduce((n, s) => n + s.places.length, 0)
  const span  = formatSpan(slots[0]?.startTime, slots[slots.length - 1]?.endTime)

  return (
    <article
      className={`bg-white rounded-2xl border overflow-hidden transition ${
        active ? 'border-indigo-300 shadow-md ring-4 ring-indigo-100' : 'border-gray-200 shadow-sm'
      }`}
    >
      <header className="flex items-center gap-3 px-5 py-4 bg-linear-to-r from-indigo-50 to-white border-b border-gray-100">
        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {day.day}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide">Day {day.day}</p>
          <p className="font-semibold text-gray-800">{day.theme}</p>
        </div>
        {stops > 0 && (
          <div className="shrink-0 text-right text-xs text-gray-500">
            <p className="font-medium text-gray-700">{stops} {stops === 1 ? 'stop' : 'stops'}</p>
            {span && <p className="tabular-nums">{span}</p>}
          </div>
        )}
      </header>

      <div className="p-5">
        <div className="divide-y divide-gray-100">
          {slots.map((slot, i) => (
            <SlotSection key={`${slot.slot}-${i}`} slot={slot} />
          ))}
        </div>

        {day.tips && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 mt-4">
            <span className="text-base">💡</span>
            <p className="text-xs text-gray-600 leading-relaxed">{day.tips}</p>
          </div>
        )}
      </div>
    </article>
  )
}
