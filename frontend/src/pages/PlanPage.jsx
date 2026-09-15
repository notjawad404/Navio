import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { tripsService, waitForAiPlan } from '../lib/trips'
import { fetchDestinationInfo } from '../lib/destinationInfo'
import DestinationInfo from '../components/DestinationInfo'
import TripItinerary from '../components/TripItinerary'

const INTERESTS = [
  { label: 'Food & Dining', emoji: '🍜' },
  { label: 'History',       emoji: '🏛️' },
  { label: 'Nature',        emoji: '🌿' },
  { label: 'Shopping',      emoji: '🛍️' },
  { label: 'Nightlife',     emoji: '🌙' },
  { label: 'Museums',       emoji: '🎨' },
  { label: 'Beaches',       emoji: '🏖️' },
  { label: 'Architecture',  emoji: '🏰' },
  { label: 'Adventure',     emoji: '🧗' },
  { label: 'Wellness',      emoji: '🧘' },
]

const BUDGETS = [
  { value: 'Budget',   emoji: '🎒', desc: 'Hostels & street food' },
  { value: 'Moderate', emoji: '✈️', desc: 'Mid-range comfort' },
  { value: 'Luxury',   emoji: '💎', desc: 'Premium experience' },
]

const STYLES = [
  { value: 'Cultural',    emoji: '🎭' },
  { value: 'Adventure',   emoji: '🧗' },
  { value: 'Relaxation',  emoji: '🧘' },
  { value: 'Romantic',    emoji: '❤️' },
  { value: 'Family',      emoji: '👨‍👩‍👧' },
]

const LOADING_MESSAGES = [
  dest => `Exploring ${dest}…`,
  ()   => 'Finding hidden gems…',
  ()   => 'Building your itinerary…',
  ()   => 'Checking local tips…',
  ()   => 'Almost ready…',
]

function LoadingDots() {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function LoadingView({ destination, destinationInfo }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LOADING_MESSAGES.length), 2000)
    return () => clearInterval(t)
  }, [])

  const message = LOADING_MESSAGES[idx](destination)

  // Nothing found about the destination, so keep the plain full-screen loader
  if (destinationInfo === null) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="text-6xl animate-bounce">🌍</div>
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Planning your trip</h2>
        <p className="text-gray-400 text-sm h-5">{message}</p>
      </div>
      <LoadingDots />
    </div>
  )

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start">
      <div className="sticky top-20 z-10 lg:top-24 lg:order-last bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
        <div className="text-4xl animate-bounce">🌍</div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-800">Planning your trip</h2>
          <p className="text-gray-400 text-sm h-5 truncate">{message}</p>
        </div>
        <LoadingDots />
      </div>
      <div className="flex flex-col gap-4 lg:col-span-2">
        <p className="text-sm text-gray-500 text-center lg:text-left">
          A detailed itinerary can take a minute — here's a little about where you're headed.
        </p>
        <DestinationInfo info={destinationInfo} />
      </div>
    </div>
  )
}

function ResultView({ plan, tripMeta, onReset, tripId }) {
  return (
    <div className="flex flex-col gap-6">

      {/* Trip header */}
      <div className="bg-linear-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm mb-1">Your AI-generated itinerary</p>
        <h1 className="text-2xl font-bold mb-4">{tripMeta.destination}</h1>
        {plan.summary && (
          <p className="max-w-3xl text-indigo-100 leading-relaxed mb-4">{plan.summary}</p>
        )}
        <div className="flex flex-wrap gap-3">
          {[
            { icon: '📅', label: `${tripMeta.days} days` },
            { icon: '💰', label: tripMeta.budget },
            { icon: '🎯', label: tripMeta.travelStyle },
          ].map(chip => (
            <span key={chip.label} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
              {chip.icon} {chip.label}
            </span>
          ))}
        </div>
      </div>

      <TripItinerary plan={plan} />

      {/* Actions */}
      <div className="flex gap-3 pb-4 sm:justify-end">
        <button
          onClick={onReset}
          className="flex-1 sm:flex-none sm:px-8 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Plan Another Trip
        </button>
        <Link
          to="/trips"
          className="flex-1 sm:flex-none sm:px-8 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors text-center"
        >
          View My Trips
        </Link>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800 text-right">{value}</dd>
    </div>
  )
}

export default function PlanPage() {
  const [stage, setStage]   = useState('form')   // 'form' | 'loading' | 'result'
  const [plan, setPlan]     = useState(null)
  const [tripId, setTripId] = useState(null)
  const [error, setError]   = useState('')
  const [form, setForm]     = useState({
    destination: '',
    name: '',
    days: 3,
    budget: 'Moderate',
    travelStyle: 'Cultural',
    interests: [],
    notes: '',
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const toggleInterest = (label) =>
    set('interests', form.interests.includes(label)
      ? form.interests.filter(i => i !== label)
      : [...form.interests, label]
    )

  const [destinationInfo, setDestinationInfo] = useState(undefined)
  const pending = useRef(null)
  useEffect(() => () => pending.current?.abort(), [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setStage('loading')

    pending.current?.abort()
    const request = new AbortController()
    pending.current = request

    setDestinationInfo(undefined)
    fetchDestinationInfo(form.destination, request.signal).then(info => {
      if (!request.signal.aborted) setDestinationInfo(info)
    })

    try {
      const trip = await tripsService.create({
        ...form,
        name: form.name.trim() || `${form.destination} Trip`,
        status: 'planning',
      })
      setTripId(trip.tripId)
      await tripsService.generateAiPlan(trip.tripId)
      const ready = await waitForAiPlan(trip.tripId, request.signal)
      if (!ready) return
      setPlan(ready.aiPlan)
      setStage('result')
    } catch (err) {
      setError(err.message)
      setStage('form')
    }
  }

  const reset = () => {
    setStage('form')
    setPlan(null)
    setTripId(null)
    setError('')
    setForm({ destination: '', name: '', days: 3, budget: 'Moderate', travelStyle: 'Cultural', interests: [], notes: '' })
  }

  if (stage === 'loading') return <LoadingView destination={form.destination} destinationInfo={destinationInfo} />

  if (stage === 'result') return (
    <ResultView plan={plan} tripMeta={form} onReset={reset} tripId={tripId} />
  )

  const selectedBudget = BUDGETS.find(b => b.value === form.budget)
  const selectedStyle  = STYLES.find(s => s.value === form.travelStyle)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plan a Trip</h1>
        <p className="text-gray-500 text-sm mt-1">Tell us about your trip and AI will create a day-by-day itinerary.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-start">
        <div className="flex flex-col gap-6 lg:col-span-2">

          {/* Destination + Name */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
            <h2 className="font-semibold text-gray-800">Where are you going?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Destination  (e.g. Tokyo, Japan)"
                value={form.destination}
                onChange={e => set('destination', e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <input
                type="text"
                placeholder="Trip name (optional)"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">How many days?</h2>
              <span className="text-2xl font-bold text-indigo-600">{form.days}</span>
            </div>
            <input
              type="range"
              min={1}
              max={14}
              value={form.days}
              onChange={e => set('days', Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 day</span>
              <span>14 days</span>
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Budget</h2>
            <div className="grid grid-cols-3 gap-3">
              {BUDGETS.map(b => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => set('budget', b.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 px-2 transition-all text-center ${
                    form.budget === b.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{b.emoji}</span>
                  <span className="text-sm font-semibold text-gray-800">{b.value}</span>
                  <span className="text-xs text-gray-400 leading-tight">{b.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Travel style */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Travel style</h2>
            <div className="flex flex-wrap gap-2">
              {STYLES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set('travelStyle', s.value)}
                  className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                    form.travelStyle === s.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{s.emoji}</span>
                  {s.value}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-1">Interests</h2>
            <p className="text-xs text-gray-400 mb-4">Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(item => {
                const active = form.interests.includes(item.label)
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => toggleInterest(item.label)}
                    className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm transition-all ${
                      active
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>{item.emoji}</span>
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Anything else? <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
            <textarea
              placeholder="e.g. travelling with kids, no spicy food, prefer walking over taxis…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
            />
          </div>
        </div>

        {/* Summary + submit */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-linear-to-br from-indigo-600 to-indigo-700 px-5 py-4 text-white">
              <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Trip summary</p>
              <p className="text-lg font-bold truncate">{form.destination.trim() || 'Where to?'}</p>
              {form.name.trim() && <p className="text-sm text-indigo-100 truncate">{form.name}</p>}
            </div>
            <dl className="p-5 flex flex-col gap-3 text-sm">
              <SummaryRow label="Duration" value={`📅 ${form.days} ${form.days === 1 ? 'day' : 'days'}`} />
              <SummaryRow label="Budget"   value={`${selectedBudget.emoji} ${selectedBudget.value}`} />
              <SummaryRow label="Style"    value={`${selectedStyle.emoji} ${selectedStyle.value}`} />
              <div className="border-t border-gray-100 pt-3">
                <dt className="text-gray-500 mb-2">Interests</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {form.interests.length > 0
                    ? form.interests.map(i => (
                        <span key={i} className="text-xs text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">{i}</span>
                      ))
                    : <span className="text-gray-400">None selected</span>}
                </dd>
              </div>
            </dl>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            ✦ Generate My Itinerary
          </button>
        </aside>
      </form>
    </div>
  )
}
