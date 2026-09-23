import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { tripsService } from '../lib/trips'

// How long a deleted trip can be brought back before the delete is sent
const UNDO_MS  = 5000
const MAX_TAGS = 3

const STATES = {
  ready:      { label: 'Itinerary ready',   pill: 'bg-green-50 text-green-700', dot: 'bg-green-600' },
  generating: { label: 'Generating…',       pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500 animate-pulse' },
  failed:     { label: 'Generation failed', pill: 'bg-red-50 text-red-600',     dot: 'bg-red-500' },
  draft:      { label: 'Draft',             pill: 'bg-gray-100 text-gray-500',  dot: 'bg-gray-400' },
}

// A trip stays a draft until an itinerary exists for it
const planState = trip =>
  trip.aiPlan ? 'ready'
    : trip.aiPlanStatus === 'generating' ? 'generating'
      : trip.aiPlanStatus === 'failed' ? 'failed'
        : 'draft'

const TABS = [
  { key: 'all',   label: 'All trips',       match: () => true },
  { key: 'ready', label: 'Itinerary ready', match: trip => Boolean(trip.aiPlan) },
  { key: 'draft', label: 'Drafts',          match: trip => !trip.aiPlan },
]

const SORTS = [
  { key: 'recent', label: 'Recent', compare: (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') },
  { key: 'name',   label: 'Name',   compare: (a, b) => (a.name ?? '').localeCompare(b.name ?? '') },
]

function PlusIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4.5h10M6.5 4.5V3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1.5M4.5 4.5l.6 8.1a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8.1" />
    </svg>
  )
}

function Stat({ value, label, display, divided }) {
  return (
    <div className={`min-w-0 px-3 py-2.5 ${divided ? 'border-l border-gray-100' : ''}`}>
      <p className={`truncate leading-[21px] text-gray-900 ${display ? 'font-display text-[17px] font-semibold tracking-tight' : 'text-sm font-semibold'}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-gray-400">{label}</p>
    </div>
  )
}

function TripCard({ trip, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  const state   = STATES[planState(trip)]
  const tags    = trip.interests ?? []
  const extra   = tags.slice(MAX_TAGS)
  const ready   = Boolean(trip.aiPlan)
  const created = new Date(trip.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <article className="relative flex animate-fade-in flex-col rounded-[18px] border border-gray-200 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-600/8">
      {confirming && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3.5 rounded-[18px] bg-white/96 p-6 text-center backdrop-blur-xs">
          <p className="font-display text-lg font-semibold tracking-tight text-gray-900">
            Delete &ldquo;{trip.name}&rdquo;?
          </p>
          <p className="max-w-[30ch] text-[13.5px] leading-relaxed text-gray-500">
            The itinerary and visited checkmarks will be removed.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="cursor-pointer rounded-[11px] border border-gray-200 bg-white px-4 py-2.25 text-[13.5px] font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onDelete(trip)}
              className="cursor-pointer rounded-[11px] border border-red-600 bg-red-600 px-4 py-2.25 text-[13.5px] font-medium text-white transition-colors hover:bg-red-700"
            >
              Delete trip
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3.5 p-5">
        <div className="flex items-center justify-between gap-2.5">
          <span className={`inline-flex items-center gap-1.75 rounded-full py-1 pl-2.25 pr-2.5 text-xs font-semibold ${state.pill}`}>
            <span className={`size-1.5 rounded-full ${state.dot}`} />
            {state.label}
          </span>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            title="Delete trip"
            aria-label={`Delete ${trip.name}`}
            className="-mr-1.5 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[9px] text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <TrashIcon />
          </button>
        </div>

        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium text-indigo-600">{trip.destination}</p>
          <h2 className="mt-1 font-display text-[22px] font-semibold leading-tight tracking-tight text-pretty text-gray-900">
            {trip.name}
          </h2>
        </div>

        <div className="grid grid-cols-3 rounded-xl border border-gray-100 bg-gray-50/60">
          <Stat display value={trip.days ?? '—'} label={trip.days === 1 ? 'Day' : 'Days'} />
          <Stat divided value={trip.budget || '—'} label="Budget" />
          <Stat divided value={trip.travelStyle || '—'} label="Style" />
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, MAX_TAGS).map(tag => (
              <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-[12.5px] font-medium text-gray-600">
                {tag}
              </span>
            ))}
            {extra.length > 0 && (
              <span
                title={extra.join(', ')}
                className="rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-[12.5px] text-gray-400"
              >
                +{extra.length}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-3.5">
        <span className="text-[12.5px] text-gray-400 tabular-nums">Created {created}</span>
        <Link
          to={`/trips/${trip.tripId}`}
          className={`shrink-0 rounded-[10px] px-3 py-1.75 text-[13.5px] font-semibold transition-colors ${
            ready
              ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              : 'border border-gray-200 text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
          }`}
        >
          {ready ? 'View itinerary' : 'Open trip'} →
        </Link>
      </div>
    </article>
  )
}

export default function TripsPage() {
  const [trips, setTrips]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [tab, setTab]         = useState('all')
  const [sort, setSort]       = useState('recent')
  const [toast, setToast]     = useState(null)

  const pendingRef = useRef(null)

  useEffect(() => {
    tripsService.getAll()
      .then(data => setTrips(Array.isArray(data) ? data : []))
      .catch(err  => setError(err.message))
      .finally(()  => setLoading(false))
  }, [])

  // A delete that never got undone still has to go out when the page closes
  useEffect(() => () => {
    const pending = pendingRef.current
    if (!pending) return
    clearTimeout(pending.timer)
    tripsService.remove(pending.trip.tripId).catch(() => {})
  }, [])

  useEffect(() => {
    if (!toast || toast.trip) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  const counts = useMemo(() => {
    const ready = trips.filter(trip => trip.aiPlan).length
    return { all: trips.length, ready, draft: trips.length - ready }
  }, [trips])

  const shown = useMemo(() => {
    const { match }   = TABS.find(t => t.key === tab)
    const { compare } = SORTS.find(s => s.key === sort)
    return trips.filter(match).sort(compare)
  }, [trips, tab, sort])

  const commit = trip =>
    tripsService.remove(trip.tripId).catch(err => {
      setTrips(prev => [...prev, trip])
      setToast({ text: err.message || `Could not delete "${trip.name}".` })
    })

  const flush = () => {
    const pending = pendingRef.current
    if (!pending) return
    clearTimeout(pending.timer)
    pendingRef.current = null
    commit(pending.trip)
  }

  const startDelete = trip => {
    flush()
    setTrips(prev => prev.filter(t => t.tripId !== trip.tripId))
    setToast({ text: `“${trip.name}” deleted`, trip })
    const timer = setTimeout(() => {
      pendingRef.current = null
      setToast(current => (current?.trip?.tripId === trip.tripId ? null : current))
      commit(trip)
    }, UNDO_MS)
    pendingRef.current = { trip, timer }
  }

  const undoDelete = () => {
    const pending = pendingRef.current
    if (!pending) return
    clearTimeout(pending.timer)
    pendingRef.current = null
    setTrips(prev => [...prev, pending.trip])
    setToast(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray-400">Loading your trips…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  if (trips.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <span className="text-5xl">🗺️</span>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-gray-900">No trips yet</h1>
        <p className="max-w-xs text-sm text-gray-500">
          You haven&rsquo;t planned any trips yet. Let AI build your perfect itinerary.
        </p>
        <Link
          to="/plan"
          className="mt-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Plan your first trip
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Your library</p>
          <h1 className="mt-1.5 font-display text-3xl font-semibold leading-[1.05] tracking-tight text-gray-900 sm:text-[38px]">
            My Trips
          </h1>
          <p className="mt-2 text-[14.5px] text-gray-600">
            {counts.all} {counts.all === 1 ? 'trip' : 'trips'} planned · {counts.ready} with a ready itinerary
          </p>
        </div>
        <Link
          to="/plan"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4.5 py-2.75 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-700"
        >
          <PlusIcon />
          New trip
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3.5">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(({ key, label }) => {
            const active = tab === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={active}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-[10px] border px-3.25 py-1.75 text-[13.5px] font-medium transition-colors ${
                  active
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {label}
                <span className={`rounded-full px-1.75 text-[11.5px] font-semibold tabular-nums ${
                  active ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts[key]}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
          <span>Sort</span>
          {SORTS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              className={`cursor-pointer rounded-lg px-2.5 py-1.25 font-medium transition-colors ${
                sort === key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-gray-200 px-6 py-14 text-center">
          <p className="text-sm text-gray-500">No trips in this view.</p>
          <button
            type="button"
            onClick={() => setTab('all')}
            className="cursor-pointer rounded-[11px] border border-gray-200 bg-white px-4 py-2 text-[13.5px] font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
          >
            Show all trips
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-4">
          {shown.map(trip => (
            <TripCard key={trip.tripId} trip={trip} onDelete={startDelete} />
          ))}
          <Link
            to="/plan"
            className="flex min-h-70 flex-col items-center justify-center gap-2.5 rounded-[18px] border-[1.5px] border-dashed border-indigo-200 text-sm font-medium text-indigo-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50">
              <PlusIcon size={16} />
            </span>
            Plan a new trip
          </Link>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 animate-fade-in items-center gap-4 rounded-[14px] bg-indigo-950 py-2.75 pl-4.5 pr-3 text-[13.5px] text-white shadow-xl shadow-indigo-950/25">
          <span className="max-w-[60vw] truncate">{toast.text}</span>
          {toast.trip && (
            <button
              type="button"
              onClick={undoDelete}
              className="shrink-0 cursor-pointer rounded-[9px] bg-white/15 px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/25"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  )
}
