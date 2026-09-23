import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { tripsService } from '../lib/trips'
import { countStops } from '../lib/itinerary'
import TripHero from '../components/TripHero'
import TripItinerary from '../components/TripItinerary'

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

  const plan  = trip.aiPlan
  const stops = countStops(plan?.days)
  const title = trip.name || trip.destination

  const stats = [
    { value: trip.days, label: trip.days === 1 ? 'Day' : 'Days' },
    plan && { value: stops, label: stops === 1 ? 'Stop' : 'Stops' },
    trip.budget && { value: trip.budget, label: trip.travelStyle ? `Budget · ${trip.travelStyle}` : 'Budget' },
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-5">
      <TripHero
        eyebrow={title.includes(trip.destination) ? 'AI-generated itinerary' : trip.destination}
        title={title}
        summary={plan?.summary}
        stats={stats}
      />

      {plan ? (
        <TripItinerary
          key={tripId}
          plan={plan}
          tripId={tripId}
          interests={trip.interests}
          notes={trip.notes}
        />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-400">No itinerary generated yet.</p>
        </div>
      )}
    </div>
  )
}
