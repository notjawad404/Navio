import { formatSpan, getSlotMeta } from '../lib/itinerary'

const LABEL = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400'

function Stat({ label, value, accent }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</dt>
      <dd className={`text-[15px] font-semibold ${accent ? 'text-indigo-600' : 'text-gray-900'}`}>{value}</dd>
    </div>
  )
}

function StopRow({ place, meta, isLast, done, onToggle }) {
  const travel = place.travelToNext

  return (
    <li className="grid grid-cols-[44px_24px_minmax(0,1fr)_22px] gap-x-2.5 sm:grid-cols-[52px_24px_minmax(0,1fr)_22px]">
      <span className="pt-[3px] text-right text-[12.5px] font-semibold text-gray-500 tabular-nums">
        {place.startTime}
      </span>

      <span className="flex flex-col items-center">
        <span
          className="flex size-6 items-center justify-center rounded-full text-[11.5px] font-semibold transition-colors"
          style={done
            ? { color: meta.hex, backgroundColor: `${meta.hex}22` }
            : { color: '#fff', backgroundColor: meta.hex }}
        >
          {place.num}
        </span>
        {!isLast && <span className="my-1.5 w-[1.5px] flex-1 bg-gray-200" />}
      </span>

      <div className={`min-w-0 ${isLast ? '' : 'pb-4'}`}>
        <div className="flex items-baseline justify-between gap-2.5">
          <p className={`text-base font-semibold tracking-tight transition-colors ${
            done ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-900'
          }`}>
            {place.place}
          </p>
          {place.duration && (
            <span className="shrink-0 text-xs text-gray-400 tabular-nums">{place.duration}</span>
          )}
        </div>
        {place.activity && (
          <p className={`mt-0.5 text-[13.5px] leading-normal text-pretty ${done ? 'text-gray-400' : 'text-gray-600'}`}>
            {place.activity}
          </p>
        )}
        {place.description && (
          <p className="mt-0.5 text-[13px] leading-normal text-pretty text-gray-500">{place.description}</p>
        )}
        {travel?.minutes > 0 && !isLast && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-500">
            <span className="size-1.5 rounded-full bg-gray-400" />
            {travel.mode} · {travel.minutes} min
          </span>
        )}
      </div>

      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Mark ${place.place} as visited`}
        title="Mark as visited"
        onClick={onToggle}
        className={`mt-px flex size-5.5 cursor-pointer items-center justify-center rounded-[7px] border-[1.5px] transition-colors ${
          done
            ? 'border-indigo-600 bg-indigo-600 text-white'
            : 'border-gray-300 bg-white text-transparent hover:border-indigo-400 hover:text-indigo-300'
        }`}
      >
        <svg className="size-3" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2.5 7.4 5.4 10.3 11.5 4.2" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </li>
  )
}

export function DayGlance({ blocks }) {
  if (blocks.length === 0) return null

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className={LABEL}>Day at a glance</p>
      <ul className="mt-3 flex flex-col gap-2">
        {blocks.map((block, i) => {
          const meta = getSlotMeta(block.slot)
          return (
            <li key={`${block.slot}-${i}`} className="flex items-center gap-2.5">
              <span className="size-2.25 shrink-0 rounded-full" style={{ backgroundColor: meta.hex }} />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-gray-700">{meta.label}</span>
              <span className="text-[12.5px] text-gray-400 tabular-nums">{formatSpan(block.startTime, block.endTime)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function DayTimeline({
  day, totalDays, blocks, tripSlots, filters, onToggleFilter, onClearFilters,
  visited, onToggleVisited, prevLabel, nextLabel, onPrev, onNext,
}) {
  const keyOf  = place => `${day.day}:${place.place}`
  const places = day.slots.flatMap(slot => slot.places)
  const shown  = blocks.reduce((n, block) => n + block.places.length, 0)
  const done   = places.filter(place => visited[keyOf(place)]).length
  const span   = formatSpan(day.slots[0]?.startTime, day.slots[day.slots.length - 1]?.endTime)

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-end justify-between gap-3.5 border-b border-gray-100 px-5.5 pb-4 pt-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-indigo-600">
            Day {day.day} of {totalDays}
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-semibold leading-tight tracking-tight text-pretty text-gray-900 sm:text-[27px]">
            {day.theme}
          </h2>
        </div>
        <dl className="flex gap-4.5 tabular-nums">
          {span && <Stat label="Window" value={span} />}
          <Stat label="Stops shown" value={shown} />
          <Stat label="Visited" value={`${done} / ${places.length}`} accent />
        </dl>
      </div>

      {tripSlots.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 bg-gray-50/60 px-5.5 py-3">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Filter</span>
          {tripSlots.map(slot => {
            const meta      = getSlotMeta(slot)
            const available = day.slots.some(s => s.slot === slot)
            const on        = filters.includes(slot)
            return (
              <button
                key={slot}
                type="button"
                disabled={!available}
                aria-pressed={on}
                onClick={() => onToggleFilter(slot)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                  !available
                    ? 'cursor-default border-gray-200 bg-white text-gray-300'
                    : on
                      ? `cursor-pointer ${meta.border} ${meta.bg} text-gray-800`
                      : 'cursor-pointer border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <span
                  className={`size-2 rounded-full ${available ? '' : 'opacity-40'}`}
                  style={{ backgroundColor: meta.hex }}
                />
                {meta.label}
              </button>
            )
          })}
          {filters.length > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="ml-0.5 cursor-pointer p-1 text-[12.5px] font-medium text-indigo-600 hover:text-indigo-700"
            >
              Reset
            </button>
          )}
        </div>
      )}

      <div className="px-5.5 pb-5.5 pt-1.5">
        {blocks.map((block, i) => {
          const meta      = getSlotMeta(block.slot)
          const blockSpan = formatSpan(block.startTime, block.endTime)
          return (
            <div key={`${block.slot}-${block.startTime ?? i}`} className="pt-5">
              <div className="flex items-center gap-3">
                <span className={`text-[11.5px] font-semibold uppercase tracking-[0.13em] ${meta.text}`}>{meta.label}</span>
                <span className="h-px flex-1 bg-gray-100" />
                {blockSpan && <span className="text-[12.5px] text-gray-400 tabular-nums">{blockSpan}</span>}
              </div>
              {block.title && <p className="mt-1 text-[13.5px] text-gray-500">{block.title}</p>}

              <ol className="mt-3">
                {block.places.map(place => (
                  <StopRow
                    key={place.num}
                    place={place}
                    meta={meta}
                    isLast={place.num === shown}
                    done={Boolean(visited[keyOf(place)])}
                    onToggle={() => onToggleVisited(keyOf(place))}
                  />
                ))}
              </ol>
            </div>
          )
        })}

        {day.tips && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
            <span className="pt-0.5 text-[10.5px] font-semibold uppercase tracking-widest text-indigo-600">Tip</span>
            <p className="text-[13.5px] leading-relaxed text-pretty text-gray-700">{day.tips}</p>
          </div>
        )}

        <div className="mt-5.5 flex justify-between gap-2.5 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onPrev}
            className="cursor-pointer rounded-[11px] border border-gray-200 bg-white px-4 py-2 text-[13.5px] font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
          >
            ← {prevLabel}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="cursor-pointer rounded-[11px] border border-indigo-600 bg-indigo-600 px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-indigo-700"
          >
            {nextLabel} →
          </button>
        </div>
      </div>
    </section>
  )
}
