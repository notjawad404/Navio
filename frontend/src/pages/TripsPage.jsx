import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tripsService } from '../lib/trips'

const BUDGET_EMOJI = { Budget: '🎒', Moderate: '✈️', Luxury: '💎' }
const STYLE_EMOJI  = { Cultural: '🎭', Adventure: '🧗', Relaxation: '🧘', Romantic: '❤️', Family: '👨‍👩‍👧' }

function TripCard({ trip }) {
  const date = new Date(trip.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="h-1.5 bg-linear-to-r from-indigo-500 to-violet-500" />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-indigo-500 font-medium mb-0.5">{trip.destination}</p>
            <h2 className="font-bold text-gray-900 text-lg leading-snug">{trip.name}</h2>
          </div>
          {trip.aiPlan && (
            <span className="shrink-0 text-xs font-medium bg-green-50 text-green-600 border border-green-200 rounded-full px-2.5 py-1">
              ✓ Itinerary ready
            </span>
          )}
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
        {trips.map(trip => <TripCard key={trip.tripId} trip={trip} />)}
      </div>
    </div>
  )
}
