import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { tripsService } from '../lib/trips'
import TripItinerary from '../components/TripItinerary'

const BUDGET_EMOJI = { Budget: '🎒', Moderate: '✈️', Luxury: '💎' }
const STYLE_EMOJI  = { Cultural: '🎭', Adventure: '🧗', Relaxation: '🧘', Romantic: '❤️', Family: '👨‍👩‍👧' }

export default function TripDetailPage() {
  const { tripId }          = useParams()
  const [trip, setTrip]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    tripsService.getById(tripId)
      .then(setTrip)
      .catch(err  => setError(err.message))
      .finally(()  => setLoading(false))
  }, [tripId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray-400">Loading trip…</p>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <p className="text-sm text-red-500">{error || 'Trip not found.'}</p>
        <Link to="/trips" className="text-sm text-indigo-600 hover:underline">← Back to My Trips</Link>
      </div>
    )
  }

  const plan = trip.aiPlan
  const hasInterests = trip.interests?.length > 0

  return (
    <div className="flex flex-col gap-6">

      <Link to="/trips" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors w-fit">
        ← My Trips
      </Link>

      <div className="bg-linear-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm mb-1">{trip.destination}</p>
        <h1 className="text-2xl font-bold mb-4">{trip.name}</h1>
        {plan?.summary && (
          <p className="max-w-3xl text-indigo-100 leading-relaxed mb-4">{plan.summary}</p>
        )}
        <div className="flex flex-wrap gap-3">
          {[
            { icon: '📅', label: `${trip.days} ${trip.days === 1 ? 'day' : 'days'}` },
            { icon: BUDGET_EMOJI[trip.budget] || '💰', label: trip.budget },
            { icon: STYLE_EMOJI[trip.travelStyle] || '🎯', label: trip.travelStyle },
          ].map(chip => (
            <span key={chip.label} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
              {chip.icon} {chip.label}
            </span>
          ))}
        </div>
      </div>

      {(hasInterests || trip.notes) && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 md:flex-row md:gap-8">
          {hasInterests && (
            <div className="md:flex-1">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {trip.interests.map(i => (
                  <span key={i} className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1">
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
          {trip.notes && (
            <div className={`md:flex-1 ${hasInterests ? 'border-t border-gray-100 pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-8' : ''}`}>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Notes</h3>
              <p className="text-sm text-gray-600">{trip.notes}</p>
            </div>
          )}
        </div>
      )}

      {plan ? (
        <TripItinerary plan={plan} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
          <p className="text-gray-400 text-sm">No itinerary generated yet.</p>
        </div>
      )}

    </div>
  )
}
