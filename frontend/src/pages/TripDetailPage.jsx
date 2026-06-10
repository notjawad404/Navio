import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { tripsService } from '../lib/trips'

const SLOT_STYLE = {
  morning:   { label: 'Morning',   icon: '🌅', bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-700' },
  afternoon: { label: 'Afternoon', icon: '☀️',  bg: 'bg-sky-50',    border: 'border-sky-200',    text: 'text-sky-700' },
  evening:   { label: 'Evening',   icon: '🌙',  bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
}

const BUDGET_EMOJI = { Budget: '🎒', Moderate: '✈️', Luxury: '💎' }
const STYLE_EMOJI  = { Cultural: '🎭', Adventure: '🧗', Relaxation: '🧘', Romantic: '❤️', Family: '👨‍👩‍👧' }

function SlotCard({ slot, data }) {
  const s = SLOT_STYLE[slot]
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span>{s.icon}</span>
        <span className={`text-xs font-bold uppercase tracking-wider ${s.text}`}>{s.label}</span>
        <span className="ml-auto text-xs text-gray-400">{data.duration}</span>
      </div>
      <p className="font-semibold text-gray-900 text-sm">{data.place}</p>
      <p className="text-xs text-gray-500 mt-0.5 mb-2">{data.activity}</p>
      <p className="text-xs text-gray-600 leading-relaxed">{data.description}</p>
    </div>
  )
}

function DayCard({ day }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 bg-linear-to-r from-indigo-50 to-white border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {day.day}
        </div>
        <div>
          <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide">Day {day.day}</p>
          <p className="font-semibold text-gray-800">{day.theme}</p>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {['morning', 'afternoon', 'evening'].map(slot => (
          day[slot] && <SlotCard key={slot} slot={slot} data={day[slot]} />
        ))}
        {day.tips && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 mt-1">
            <span className="text-base">💡</span>
            <p className="text-xs text-gray-600 leading-relaxed">{day.tips}</p>
          </div>
        )}
      </div>
    </div>
  )
}

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

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-8">

      <Link to="/trips" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors w-fit">
        ← My Trips
      </Link>

      <div className="bg-linear-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm mb-1">{trip.destination}</p>
        <h1 className="text-2xl font-bold mb-4">{trip.name}</h1>
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

      {(trip.interests?.length > 0 || trip.notes) && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
          {trip.interests?.length > 0 && (
            <div>
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
            <div className={trip.interests?.length > 0 ? 'border-t border-gray-100 pt-4' : ''}>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Notes</h3>
              <p className="text-sm text-gray-600">{trip.notes}</p>
            </div>
          )}
        </div>
      )}

      {plan ? (
        <>
          {plan.summary && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-gray-700 leading-relaxed italic">"{plan.summary}"</p>
            </div>
          )}

          {plan.days?.map(day => <DayCard key={day.day} day={day} />)}

          {(plan.generalTips?.length > 0 || plan.estimatedCost) && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
              {plan.generalTips?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>📌</span> Travel Tips
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {plan.generalTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-indigo-400 font-bold mt-0.5">·</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.estimatedCost && (
                <div className={plan.generalTips?.length > 0 ? 'border-t border-gray-100 pt-4' : ''}>
                  <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                    <span>💵</span> Estimated Cost
                  </h3>
                  <p className="text-sm text-gray-600">{plan.estimatedCost}</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
          <p className="text-gray-400 text-sm">No itinerary generated yet.</p>
        </div>
      )}

    </div>
  )
}
