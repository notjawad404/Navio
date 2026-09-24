import { useState } from 'react'

// Longer summaries start clamped to two lines
const CLAMP_AT = 160

export default function TripHero({ eyebrow, title, summary, stats = [], credit }) {
  const [expanded, setExpanded] = useState(false)
  const long = summary?.length > CLAMP_AT

  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
      <div className="min-w-0 flex-[1_1_420px]">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">{eyebrow}</p>
        )}
        <h1 className="mt-1.5 font-display text-3xl font-semibold leading-[1.05] tracking-tight text-gray-900 sm:text-[38px]">
          {title}
        </h1>
        {summary && (
          <>
            <p className={`mt-2.5 max-w-[62ch] text-[14.5px] leading-relaxed text-pretty text-gray-600 ${long && !expanded ? 'line-clamp-2' : ''}`}>
              {summary}
            </p>
            {long && (
              <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                className="mt-1.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-700"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </>
        )}
        {credit && <p className="mt-3 text-[12.5px] text-gray-400">{credit}</p>}
      </div>

      {stats.length > 0 && (
        <dl className="flex flex-wrap gap-2.5">
          {stats.map(stat => (
            <div key={stat.label} className="flex min-w-23 flex-col-reverse rounded-xl border border-gray-200 bg-white px-3.5 py-2.5">
              <dt className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">{stat.label}</dt>
              <dd className="font-display text-xl font-semibold tracking-tight text-gray-900">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
