// Shared shape + styling helpers for AI itineraries.
//
// Plans generated after the multi-slot upgrade look like:
//   day.slots = [{ slot, title, places: [{ place, startTime, endTime, travelToNext, … }] }]
// Plans saved before it look like:
//   day.morning / day.afternoon / day.evening = { place, activity, duration, … }
// normalizeDay() flattens both into the `slots` form so nothing renders blank.

export const SLOT_META = {
  'early-morning':  { label: 'Early Morning',  icon: '🌄', bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    hex: '#f43f5e' },
  'morning':        { label: 'Morning',        icon: '🌅', bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   hex: '#f59e0b' },
  'midday':         { label: 'Midday',         icon: '🍽️', bg: 'bg-lime-50',    border: 'border-lime-200',    text: 'text-lime-700',    hex: '#65a30d' },
  'afternoon':      { label: 'Afternoon',      icon: '☀️',  bg: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-700',     hex: '#0ea5e9' },
  'late-afternoon': { label: 'Late Afternoon', icon: '🌇', bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  hex: '#f97316' },
  'evening':        { label: 'Evening',        icon: '🌆', bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  hex: '#7c3aed' },
  'night':          { label: 'Night',          icon: '🌙', bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700',  hex: '#4f46e5' },
}

export const SLOT_ORDER = Object.keys(SLOT_META)

const FALLBACK_META = {
  label: 'Stop', icon: '📍', bg: 'bg-gray-50',
  border: 'border-gray-200', text: 'text-gray-700', hex: '#6366f1',
}

export const getSlotMeta = (slot) => SLOT_META[slot] || FALLBACK_META

// Legacy keys, in the order they were always rendered
const LEGACY_SLOTS = ['morning', 'afternoon', 'evening']

/** Both plan shapes -> { …day, slots: [{ slot, title, startTime, endTime, places }] } */
export function normalizeDay(day) {
  if (!day) return { slots: [] }

  const slots = Array.isArray(day.slots)
    ? day.slots.filter(s => Array.isArray(s?.places) && s.places.length > 0)
    : LEGACY_SLOTS
        .filter(key => day[key]?.place)
        .map(key => ({ slot: key, title: day[key].activity, places: [day[key]] }))

  return {
    ...day,
    slots: slots.map(s => ({
      ...s,
      // Slot span is derived from its places so there is one source of truth
      startTime: s.startTime ?? s.places[0]?.startTime,
      endTime:   s.endTime   ?? s.places[s.places.length - 1]?.endTime,
    })),
  }
}

/** Total stops across a plan's days, in either plan shape. */
export function countStops(days) {
  return (days || []).reduce(
    (total, day) => total + normalizeDay(day).slots.reduce((n, slot) => n + slot.places.length, 0),
    0,
  )
}

/** "09:30" -> 570; null when the time is missing or malformed. */
export function toMinutes(time) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time ?? '')
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

/** "09:00" + "10:30" -> "09:00 – 10:30"; falls back gracefully when times are absent. */
export function formatSpan(startTime, endTime) {
  if (startTime && endTime) return `${startTime} – ${endTime}`
  return startTime || endTime || ''
}

/** Distinct slot ids present in a plan, in canonical order — used for the map legend. */
export function slotsInPlan(days) {
  const present = new Set()
  ;(days || []).forEach(day => {
    normalizeDay(day).slots.forEach(s => {
      if (SLOT_META[s.slot]) present.add(s.slot)
    })
  })
  return SLOT_ORDER.filter(k => present.has(k))
}
