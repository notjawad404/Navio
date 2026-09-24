import { useEffect, useState } from 'react'

const SLIDE_MS = 6000

export default function DestinationStage({ images, title, description, location, className = '' }) {
  const [index, setIndex] = useState(0)
  const total = images.length

  useEffect(() => {
    if (total < 2) return
    const timer = setTimeout(() => setIndex(i => (i + 1) % total), SLIDE_MS)
    return () => clearTimeout(timer)
  }, [index, total])

  const caption = images[index]?.caption

  return (
    <div className={`relative isolate overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-br from-indigo-700 to-violet-900 ${className}`}>
      {images.map((image, position) => (
        <img
          key={image.src}
          src={image.src}
          alt={image.title}
          decoding="async"
          fetchPriority={position === 0 ? 'high' : 'low'}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ${
            position === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/35 to-black/10" />

      {total > 1 && (
        <span className="absolute right-4 top-4 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/90 tabular-nums backdrop-blur-sm">
          {index + 1} / {total}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3.5 p-5">
        <div className="text-white">
          <h2 className="font-display text-[26px] font-semibold leading-tight tracking-tight sm:text-[32px]">{title}</h2>
          {description && <p className="mt-1 text-[13.5px] text-white/80">{description}</p>}
          {location && <p className="mt-1.5 text-[12px] text-white/65">📍 {location}</p>}
        </div>

        {caption && <p className="line-clamp-2 max-w-[60ch] text-[12px] leading-relaxed text-white/55">{caption}</p>}

        {total > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {images.map((image, position) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setIndex(position)}
                aria-label={image.title}
                aria-current={position === index}
                className={`size-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                  position === index ? 'border-white' : 'border-white/25 opacity-55 hover:opacity-100'
                }`}
              >
                <img src={image.src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
