import { formatSpan, toMinutes } from '../lib/itinerary'

const LABEL = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400'

// Every day is drawn on the same 07:00–24:00 scale so the bars line up
const SCALE_START = 7 * 60
const SCALE_END   = 24 * 60

const MAX_AREAS = 5

function spanBar(startTime, endTime) {
  const start = toMinutes(startTime)
  let end = toMinutes(endTime)
  if (start == null || end == null) return null
  if (end <= start) end = SCALE_END

  const pct = minutes =>
    Math.min(Math.max((minutes - SCALE_START) / (SCALE_END - SCALE_START), 0), 1) * 100
  return { left: `${pct(start)}%`, width: `${Math.max(pct(end) - pct(start), 2)}%` }
}

function DayRow({ day, first, active, onHover, onOpen }) {
  const places    = day.slots.flatMap(slot => slot.places)
  const startTime = day.slots[0]?.startTime
  const endTime   = day.slots[day.slots.length - 1]?.endTime
  const bar       = spanBar(startTime, endTime)
  const preview   = places.slice(0, 3).map(p => p.place).join(' · ')
  const more      = places.length - 3

  return (
    <button
      type="button"
      onClick={() => onOpen(day.day)}
      onMouseEnter={() => onHover(day.day)}
      onMouseLeave={() => onHover(0)}
      onFocus={() => onHover(day.day)}
      onBlur={() => onHover(0)}
      className={`grid w-full cursor-pointer grid-cols-[34px_minmax(0,1fr)_56px] items-center gap-x-4 px-5.5 py-3.5 text-left transition-colors sm:grid-cols-[34px_minmax(0,1fr)_150px_62px] ${
        first ? '' : 'border-t border-gray-100'
      } ${active ? 'bg-indigo-50/40' : 'bg-white'}`}
    >
      <span
        className={`flex size-8.5 items-center justify-center rounded-[11px] border font-display text-[15px] font-semibold transition-colors ${
          active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 bg-gray-50 text-gray-500'
        }`}
      >
        {day.day}
      </span>

      <span className="min-w-0">
        <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="font-display text-[17px] font-semibold leading-tight tracking-tight text-gray-900">{day.theme}</span>
          {day.area && <span className="text-xs text-gray-400">{day.area}</span>}
        </span>
        {preview && (
          <span className="mt-1 block text-[13px] leading-snug text-pretty text-gray-500">
            {preview}{more > 0 && ` +${more} more`}
          </span>
        )}
      </span>

      <span className="hidden sm:block">
        {bar && (
          <>
            <span className="relative block h-2 rounded-full bg-gray-100">
              <span
                className={`absolute inset-y-0 rounded-full transition-colors ${active ? 'bg-indigo-600' : 'bg-indigo-200'}`}
                style={bar}
              />
            </span>
            <span className="mt-1.5 block text-xs text-gray-400 tabular-nums">{formatSpan(startTime, endTime)}</span>
          </>
        )}
      </span>

      <span className="whitespace-nowrap text-right">
        <span className="block text-[15px] font-semibold text-gray-900 tabular-nums">{places.length}</span>
        <span className="mt-0.5 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-gray-400">
          {places.length === 1 ? 'Stop' : 'Stops'}
        </span>
      </span>
    </button>
  )
}

export function AreaSplit({ days }) {
  const totals = new Map()
  days.forEach(day => {
    if (!day.area) return
    const stops = day.slots.reduce((n, slot) => n + slot.places.length, 0)
    totals.set(day.area, (totals.get(day.area) ?? 0) + stops)
  })
  if (totals.size === 0) return null

  let rows = [...totals].sort((a, b) => b[1] - a[1])
  if (rows.length > MAX_AREAS) {
    const rest = rows.slice(MAX_AREAS - 1).reduce((n, [, count]) => n + count, 0)
    rows = [...rows.slice(0, MAX_AREAS - 1), ['Other areas', rest]]
  }
  const total = rows.reduce((n, [, count]) => n + count, 0)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className={LABEL}>Where the time goes</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {rows.map(([area, count], i) => (
          <div key={area}>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="truncate font-medium text-gray-700">{area}</span>
              <span className="shrink-0 text-gray-400 tabular-nums">{count} {count === 1 ? 'stop' : 'stops'}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${i === 0 ? 'bg-indigo-600' : 'bg-indigo-400'}`}
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TripOverview({ days, hover, onHover, onOpen, hasMap, tips, estimatedCost, interests, notes }) {
  const timed        = days.some(day => toMinutes(day.slots[0]?.startTime) != null)
  const hasTips      = tips?.length > 0
  const hasInterests = interests?.length > 0
  const hasDetails   = estimatedCost || hasInterests || notes

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4.5 gap-y-2.5 border-b border-gray-100 px-5.5 pb-3.5 pt-4.5">
          <div>
            <h2 className="font-display text-[22px] font-semibold tracking-tight text-gray-900">
              {days.length === 1 ? 'Your day' : `All ${days.length} days`}
            </h2>
            <p className="mt-1 text-[13px] text-gray-400">
              {hasMap ? 'Hover a day to preview its route, or open it for the full schedule' : 'Open a day for its full schedule'}
            </p>
          </div>
          {timed && (
            <div className="hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-300 tabular-nums sm:flex">
              <span>07:00</span>
              <span className="h-px w-18 bg-gray-200" />
              <span>24:00</span>
            </div>
          )}
        </div>

        {days.map((day, i) => (
          <DayRow
            key={day.day}
            day={day}
            first={i === 0}
            active={hover === day.day}
            onHover={onHover}
            onOpen={onOpen}
          />
        ))}
      </section>

      {(hasTips || hasDetails) && (
        <section className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5.5">
          {hasTips && (
            <div>
              <h3 className={LABEL}>Travel tips</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {tips.map((tip, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-gray-600">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-indigo-300" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasDetails && (
            <div className={`grid gap-5 sm:grid-cols-2 ${hasTips ? 'border-t border-gray-100 pt-5' : ''}`}>
              {estimatedCost && (
                <div>
                  <h3 className={LABEL}>Estimated cost</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{estimatedCost}</p>
                </div>
              )}
              {(hasInterests || notes) && (
                <div>
                  <h3 className={LABEL}>Your preferences</h3>
                  {hasInterests && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {interests.map(interest => (
                        <span key={interest} className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-600">
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                  {notes && <p className="mt-2 text-sm leading-relaxed text-gray-600">{notes}</p>}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </>
  )
}
