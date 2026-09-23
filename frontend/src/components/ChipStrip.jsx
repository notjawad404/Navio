import { useEffect, useRef } from 'react'

export function Chip({ active, eyebrow, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-active={active ? 'true' : undefined}
      className={`flex shrink-0 cursor-pointer rounded-[11px] border px-3.5 py-[7px] transition-colors ${
        eyebrow ? 'flex-col items-start gap-px text-left' : 'items-center whitespace-nowrap text-[13.5px] font-medium'
      } ${
        active
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
      }`}
    >
      {eyebrow && (
        <span className="text-[10.5px] font-semibold uppercase tracking-widest opacity-65">{eyebrow}</span>
      )}
      <span className={eyebrow ? 'max-w-44 truncate text-[13.5px] font-medium' : undefined}>{label}</span>
    </button>
  )
}

export function ChipDivider() {
  return <span className="mx-1 my-1 w-px shrink-0 bg-gray-200" />
}

// Pinned row of chips that keeps the selected one in view
export default function ChipStrip({ activeKey, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const strip = ref.current
    const chip  = strip.querySelector('[data-active="true"]')
    if (!chip) return
    strip.scrollTo({ left: chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' })
  }, [activeKey])

  return (
    <div className="sticky top-15 z-30 -mx-(--page-gutter) border-b border-gray-200 bg-gray-50/90 px-(--page-gutter) py-2.5 backdrop-blur-md">
      <div ref={ref} className="no-scrollbar relative flex gap-2 overflow-x-auto py-0.5">
        {children}
      </div>
    </div>
  )
}
