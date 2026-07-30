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
    <div className="flex items-center gap-2 pl-1 py-1.5 text-[11px] text-gray-400">
      <span className="w-px h-4 bg-gray-200 ml-[3px]" />
      <span>{icon}</span>
      <span>{travel.mode} · {travel.minutes} min</span>
    </div>
  )
}

function PlaceRow({ data, isLast }) {
  return (
    <div>
      <div className="flex gap-2.5">
        <div className="flex flex-col items-center pt-1.5">
          <span className="w-[7px] h-[7px] rounded-full bg-gray-400 shrink-0" />
        </div>
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

function SlotCard({ slot }) {
  const meta = getSlotMeta(slot.slot)
  const span = formatSpan(slot.startTime, slot.endTime)

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} p-4`}>
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
            isLast={i === slot.places.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

export default function DayCard({ day }) {
  const normalized = normalizeDay(day)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 bg-linear-to-r from-indigo-50 to-white border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {day.day}
        </div>
        <div>
          <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide">Day {day.day}</p>
          <p className="font-semibold text-gray-800">{day.theme}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {normalized.slots.map((slot, i) => (
          <SlotCard key={`${slot.slot}-${i}`} slot={slot} />
        ))}

        {day.tips && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 mt-1">
            <span className="text-base">💡</span>
            <p className="text-xs text-gray-600 leading-relaxed">{day.tips}</p>
          </div>
        )}
      </div>
    </div>
  )
}
