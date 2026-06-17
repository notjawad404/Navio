import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tripsService } from '../lib/trips'

const BUDGET_EMOJI = { Budget: '🎒', Moderate: '✈️', Luxury: '💎' }
const STYLE_EMOJI  = { Cultural: '🎭', Adventure: '🧗', Relaxation: '🧘', Romantic: '❤️', Family: '👨‍👩‍👧' }

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function TripCard({ trip, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await tripsService.remove(trip.tripId)
      onDelete(trip.tripId)
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  const date = new Date(trip.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className={`relative bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${confirming ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="h-1.5 bg-linear-to-r from-indigo-500 to-violet-500" />

      {confirming && (
        <div className="absolute inset-0 top-1.5 bg-white/97 backdrop-blur-xs z-10 flex flex-col items-center justify-center gap-5 rounded-b-2xl animate-in fade-in duration-150">
          <div className="flex flex-col items-center gap-2 text-center px-6">
            <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 text-base">Delete this trip?</p>
            <p className="text-sm text-gray-400 leading-snug max-w-[220px]">
              <span className="text-gray-600 font-medium">"{trip.name}"</span> will be permanently removed.
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => setConfirming(false)}
              className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Keep it
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-5 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Deleting…
                </>
              ) : 'Yes, delete'}
            </button>
          </div>
        </div>
      )}

      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-indigo-500 font-medium mb-0.5">{trip.destination}</p>
            <h2 className="font-bold text-gray-900 text-lg leading-snug">{trip.name}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {trip.aiPlan && (
              <span className="text-xs font-medium bg-green-50 text-green-600 border border-green-200 rounded-full px-2.5 py-1">
                ✓ Itinerary ready
              </span>
            )}
            <button
              onClick={() => setConfirming(true)}
              title="Delete trip"
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors duration-150"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
            📅 {trip.days} {trip.days === 1 ? 'day' : 'days'}
          </span>
          <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
            {BUDGET_EMOJI[trip.budget] || '💰'} {trip.budget}
          </span>
          <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
            {STYLE_EMOJI[trip.travelStyle] || '🎯'} {trip.travelStyle}
          </span>
        </div>

        {trip.interests?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trip.interests.slice(0, 3).map(i => (
              <span key={i} className="text-xs text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">{i}</span>
            ))}
            {trip.interests.length > 3 && (
              <span className="text-xs text-gray-400 bg-gray-50 rounded-full px-2 py-0.5">
                +{trip.interests.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">{date}</span>
          <Link
            to={`/trips/${trip.tripId}`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View details →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function TripsPage() {
  const [trips, setTrips]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    tripsService.getAll()
      .then(data => setTrips(Array.isArray(data) ? data : []))
      .catch(err  => setError(err.message))
      .finally(()  => setLoading(false))
  }, [])

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <span className="text-5xl">🗺️</span>
        <h1 className="text-2xl font-bold text-gray-900">No trips yet</h1>
        <p className="text-gray-500 max-w-xs text-sm">
          You haven't planned any trips yet. Let AI build your perfect itinerary.
        </p>
        <Link
          to="/plan"
          className="mt-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Plan your first trip
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'} planned
          </p>
        </div>
        <Link
          to="/plan"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          + New trip
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {trips.map(trip => (
          <TripCard
            key={trip.tripId}
            trip={trip}
            onDelete={id => setTrips(prev => prev.filter(t => t.tripId !== id))}
          />
        ))}
      </div>
    </div>
  )
}
