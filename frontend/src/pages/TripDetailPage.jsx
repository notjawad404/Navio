import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { tripsService, waitForAiPlan } from '../lib/trips'
import { fetchDestinationInfo } from '../lib/destinationInfo'
import { countStops } from '../lib/itinerary'
import GeneratingView from '../components/GeneratingView'
import TripHero from '../components/TripHero'
import TripItinerary from '../components/TripItinerary'

export default function TripDetailPage() {
  const { tripId }              = useParams()
  const [trip, setTrip]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [planError, setPlanError] = useState('')
  const [info, setInfo]         = useState(undefined)

  useEffect(() => {
    tripsService.getById(tripId)
      .then(setTrip)
      .catch(err  => setError(err.message))
      .finally(()  => setLoading(false))
  }, [tripId])

  const generating  = Boolean(trip) && !trip.aiPlan && trip.aiPlanStatus === 'generating'
  const destination = trip?.destination

  // Picked up when a plan was still being written on another page or an earlier visit
  useEffect(() => {
    if (!generating) return

    const request = new AbortController()

    fetchDestinationInfo(destination, request.signal)
      .then(found => { if (!request.signal.aborted) setInfo(found) })

    waitForAiPlan(tripId, request.signal)
      .then(ready => { if (ready) setTrip(ready) })
      .catch(err => { if (!request.signal.aborted) setPlanError(err.message) })

    return () => request.abort()
  }, [generating, destination, tripId])

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

  if (generating && !planError) return (
    <GeneratingView
      destination={trip.destination}
      days={trip.days}
      budget={trip.budget}
      travelStyle={trip.travelStyle}
      info={info}
    />
  )

  const plan  = trip.aiPlan
  const stops = countStops(plan?.days)
  const title = trip.name || trip.destination

  const stats = [
    { value: trip.days, label: trip.days === 1 ? 'Day' : 'Days' },
    plan && { value: stops, label: stops === 1 ? 'Stop' : 'Stops' },
    trip.budget && { value: trip.budget, label: trip.travelStyle ? `Budget · ${trip.travelStyle}` : 'Budget' },
  ].filter(Boolean)

  const blocked = planError || (trip.aiPlanStatus === 'failed' && (trip.aiPlanError || 'Generating this itinerary failed.'))

  return (
    <div className="flex flex-col gap-5">
      <TripHero
        eyebrow={title.includes(trip.destination) ? 'AI-generated itinerary' : trip.destination}
        title={title}
        summary={plan?.summary}
        stats={stats}
        credit={plan ? 'Itinerary generated with Google Gemini.' : undefined}
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
          <p className={`text-sm ${blocked ? 'text-red-500' : 'text-gray-400'}`}>
            {blocked || 'No itinerary generated yet.'}
          </p>
        </div>
      )}
    </div>
  )
}
