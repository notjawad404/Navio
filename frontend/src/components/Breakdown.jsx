const MAX_ROWS = 5

/** Bar list of the biggest groups, with anything past the fifth folded into one row. */
export default function Breakdown({ title, counts, unit, otherLabel = 'Other' }) {
  if (counts.size === 0) return null

  let rows = [...counts].sort((a, b) => b[1] - a[1])
  if (rows.length > MAX_ROWS) {
    const rest = rows.slice(MAX_ROWS - 1).reduce((n, [, count]) => n + count, 0)
    rows = [...rows.slice(0, MAX_ROWS - 1), [otherLabel, rest]]
  }
  const total = rows.reduce((n, [, count]) => n + count, 0)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">{title}</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {rows.map(([name, count], i) => (
          <div key={name}>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="truncate font-medium text-gray-700">{name}</span>
              <span className="shrink-0 text-gray-400 tabular-nums">
                {count} {count === 1 ? unit[0] : unit[1]}
              </span>
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
