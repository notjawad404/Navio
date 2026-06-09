import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tripsService } from '../lib/trips'

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

const SLOT_STYLE = {
  morning:   { label: 'Morning',   icon: '🌅', bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700' },
  afternoon: { label: 'Afternoon', icon: '☀️',  bg: 'bg-sky-50',   border: 'border-sky-200',    text: 'text-sky-700' },
  evening:   { label: 'Evening',   icon: '🌙',  bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
}

function LoadingView({ destination }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LOADING_MESSAGES.length), 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="text-6xl animate-bounce">🌍</div>
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Planning your trip</h2>
        <p className="text-gray-400 text-sm h-5">{LOADING_MESSAGES[idx](destination)}</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

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

function ResultView({ plan, tripMeta, onReset, tripId }) {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">

      {/* Trip header */}
      <div className="bg-linear-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm mb-1">Your AI-generated itinerary</p>
        <h1 className="text-2xl font-bold mb-4">{tripMeta.destination}</h1>
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

      {/* Summary */}
      {plan.summary && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-gray-700 leading-relaxed italic">"{plan.summary}"</p>
        </div>
      )}

      {/* Day cards */}
      {plan.days?.map(day => <DayCard key={day.day} day={day} />)}

      {/* Tips & cost */}
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
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <span>💵</span> Estimated Cost
              </h3>
              <p className="text-sm text-gray-600">{plan.estimatedCost}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pb-4">
        <button
          onClick={onReset}
          className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Plan Another Trip
        </button>
        <Link
          to="/trips"
          className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors text-center"
        >
          View My Trips
        </Link>
      </div>
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setStage('loading')
    try {
      const trip = await tripsService.create({
        ...form,
        name: form.name.trim() || `${form.destination} Trip`,
        status: 'planning',
      })
      setTripId(trip.tripId)
      const result = await tripsService.generateAiPlan(trip.tripId)
      setPlan(result.plan)
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

  if (stage === 'loading') return <LoadingView destination={form.destination} />

  if (stage === 'result') return (
    <ResultView plan={plan} tripMeta={form} onReset={reset} tripId={tripId} />
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plan a Trip</h1>
        <p className="text-gray-500 text-sm mt-1">Tell us about your trip and AI will create a day-by-day itinerary.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Destination + Name */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">Where are you going?</h2>
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
      </form>
    </div>
  )
}
