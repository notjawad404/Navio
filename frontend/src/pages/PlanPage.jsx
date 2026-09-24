import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { tripsService, waitForAiPlan } from '../lib/trips'
import { fetchDestinationInfo, correctDestination } from '../lib/destinationInfo'
import { countStops } from '../lib/itinerary'
import GeneratingView from '../components/GeneratingView'
import TripHero from '../components/TripHero'
import TripItinerary from '../components/TripItinerary'

const MAX_DAYS  = 14
const MAX_NOTES = 400

const INTERESTS = [
  'Food & Dining', 'History', 'Nature', 'Shopping', 'Nightlife',
  'Museums', 'Beaches', 'Architecture', 'Adventure', 'Wellness',
]

const BUDGETS = [
  { value: 'Budget',   sign: '$',   desc: 'Hostels & street food' },
  { value: 'Moderate', sign: '$$',  desc: 'Mid-range comfort' },
  { value: 'Luxury',   sign: '$$$', desc: 'Premium experience' },
]

const STYLES = [
  { value: 'Cultural',   hint: 'Museums, landmarks and local traditions.' },
  { value: 'Adventure',  hint: 'Active days, hikes and outdoor experiences.' },
  { value: 'Relaxation', hint: 'Slower mornings and fewer stops per day.' },
  { value: 'Romantic',   hint: 'Scenic spots and dinners for two.' },
  { value: 'Family',     hint: 'Kid-friendly stops and shorter walks.' },
]

const FIELD = 'rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 outline-none transition-colors focus:border-indigo-600 focus:ring-3 focus:ring-indigo-50'

function ResultView({ plan, tripMeta, onReset, tripId }) {
  const stops = countStops(plan.days)

  return (
    <div className="flex flex-col gap-5">
      <TripHero
        eyebrow="Your AI-generated itinerary"
        title={tripMeta.name.trim() || `${tripMeta.destination} Trip`}
        summary={plan.summary}
        stats={[
          { value: tripMeta.days, label: tripMeta.days === 1 ? 'Day' : 'Days' },
          { value: stops, label: stops === 1 ? 'Stop' : 'Stops' },
          { value: tripMeta.budget, label: `Budget · ${tripMeta.travelStyle}` },
        ]}
        credit="Itinerary generated with Google Gemini."
      />

      <TripItinerary
        key={tripId}
        plan={plan}
        tripId={tripId}
        interests={tripMeta.interests}
        notes={tripMeta.notes}
      />

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

function Section({ step, done, title, aside, first, children }) {
  return (
    <section className={`grid grid-cols-[28px_minmax(0,1fr)] gap-x-3.5 px-6 py-5.5 ${first ? '' : 'border-t border-gray-100'}`}>
      <span
        className={`flex size-7 items-center justify-center rounded-[9px] text-[13px] font-semibold transition-colors ${
          done ? 'bg-indigo-600 text-white' : 'border border-gray-200 bg-gray-100 text-gray-500'
        }`}
      >
        {step}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="font-display text-[19px] font-semibold tracking-tight text-gray-900">{title}</h2>
          {aside}
        </div>
        {children}
      </div>
    </section>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-gray-50 py-2.5">
      <dt className="text-[13.5px] text-gray-500">{label}</dt>
      <dd className="text-right text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  )
}

function TickIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7.4 5.4 10.3 11.5 4.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PlanPage() {
  const [stage, setStage]   = useState('form')   // 'form' | 'loading' | 'result'
  const [plan, setPlan]     = useState(null)
  const [tripId, setTripId] = useState(null)
  const [error, setError]   = useState('')
  const [tried, setTried]   = useState(false)
  const [spelling, setSpelling] = useState({ suggestion: '', keepTyped: false, correctedFrom: '' })
  const [form, setForm]     = useState({
    destination: '',
    name: '',
    days: 3,
    budget: 'Moderate',
    travelStyle: 'Cultural',
    interests: [],
    notes: '',
  })

  const destinationRef = useRef(null)
  const checked        = useRef('')

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const setDestination = value => {
    set('destination', value)
    setSpelling({ suggestion: '', keepTyped: false, correctedFrom: '' })
  }

  // One lookup when the field is left, so a typo is caught before anything is created
  const checkSpelling = async () => {
    const typed = form.destination.trim()
    if (!typed || typed === checked.current) return
    checked.current = typed

    const name = await correctDestination(typed)
    if (name !== typed) setSpelling(s => ({ ...s, suggestion: name }))
  }

  const toggleInterest = (label) =>
    set('interests', form.interests.includes(label)
      ? form.interests.filter(i => i !== label)
      : [...form.interests, label]
    )

  const stepDays = delta => set('days', Math.min(Math.max(form.days + delta, 1), MAX_DAYS))

  const [destinationInfo, setDestinationInfo] = useState(undefined)
  const pending = useRef(null)
  useEffect(() => () => pending.current?.abort(), [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.destination.trim()) {
      setTried(true)
      destinationRef.current?.focus()
      return
    }

    setError('')
    setStage('loading')

    pending.current?.abort()
    const request = new AbortController()
    pending.current = request

    setDestinationInfo(undefined)

    try {
      const typed = form.destination.trim()
      const destination = spelling.keepTyped ? typed : await correctDestination(typed, request.signal)

      if (destination !== typed) {
        set('destination', destination)
        setSpelling({ suggestion: '', keepTyped: false, correctedFrom: typed })
      }

      fetchDestinationInfo(destination, request.signal).then(info => {
        if (!request.signal.aborted) setDestinationInfo(info)
      })

      const trip = await tripsService.create({
        ...form,
        destination,
        name: form.name.trim() || `${destination} Trip`,
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
    setTried(false)
    setSpelling({ suggestion: '', keepTyped: false, correctedFrom: '' })
    checked.current = ''
    setForm({ destination: '', name: '', days: 3, budget: 'Moderate', travelStyle: 'Cultural', interests: [], notes: '' })
  }

  if (stage === 'loading') return (
    <GeneratingView
      destination={form.destination}
      days={form.days}
      budget={form.budget}
      travelStyle={form.travelStyle}
      info={destinationInfo}
      correctedFrom={spelling.correctedFrom}
    />
  )

  if (stage === 'result') return (
    <ResultView plan={plan} tripMeta={form} onReset={reset} tripId={tripId} />
  )

  const destination  = form.destination.trim()
  const destError    = tried && !destination
  const selectedCost = BUDGETS.find(b => b.value === form.budget)
  const styleHint    = STYLES.find(s => s.value === form.travelStyle).hint

  return (
    <div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">New itinerary</p>
        <h1 className="mt-1.5 font-display text-3xl font-semibold leading-[1.05] tracking-tight text-gray-900 sm:text-[38px]">
          Plan a Trip
        </h1>
        <p className="mt-2 text-[14.5px] text-gray-600">
          Tell us about your trip and AI will create a day-by-day itinerary.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid items-start gap-4.5 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-[18px] border border-gray-200 bg-white">

          <Section first step={1} done={Boolean(destination)} title="Where are you going?">
            <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-gray-600">
                  Destination <span className="text-red-600">*</span>
                </span>
                <input
                  ref={destinationRef}
                  type="text"
                  value={form.destination}
                  onChange={e => setDestination(e.target.value)}
                  onBlur={checkSpelling}
                  placeholder="e.g. Tokyo, Japan"
                  aria-invalid={destError}
                  className={`h-11.5 px-3.5 ${FIELD} ${destError ? 'border-red-300 ring-3 ring-red-50' : ''}`}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-gray-600">
                  Trip name <span className="font-normal text-gray-400">optional</span>
                </span>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder={destination ? `${destination} Trip` : 'e.g. Spring in Kyoto'}
                  className={`h-11.5 px-3.5 ${FIELD}`}
                />
              </label>
            </div>
            {destError && (
              <p className="mt-2 text-[12.5px] text-red-600">Add a destination to generate your itinerary.</p>
            )}
            {spelling.suggestion && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-gray-600">
                <span>Did you mean <span className="font-semibold text-gray-900">{spelling.suggestion}</span>?</span>
                <button
                  type="button"
                  onClick={() => setDestination(spelling.suggestion)}
                  className="cursor-pointer rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                >
                  Use it
                </button>
                <button
                  type="button"
                  onClick={() => setSpelling({ suggestion: '', keepTyped: true, correctedFrom: '' })}
                  className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
                >
                  Keep mine
                </button>
              </p>
            )}
          </Section>

          <Section
            step={2}
            done
            title="How many days?"
            aside={
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => stepDays(-1)}
                  aria-label="Fewer days"
                  className="flex size-8.5 cursor-pointer items-center justify-center rounded-[10px] border border-gray-200 bg-white text-lg text-gray-600 transition-colors hover:border-indigo-200 hover:text-indigo-600"
                >
                  −
                </button>
                <span className="min-w-21 text-center font-display text-[22px] font-semibold tracking-tight text-indigo-600 tabular-nums">
                  {form.days} {form.days === 1 ? 'day' : 'days'}
                </span>
                <button
                  type="button"
                  onClick={() => stepDays(1)}
                  aria-label="More days"
                  className="flex size-8.5 cursor-pointer items-center justify-center rounded-[10px] border border-gray-200 bg-white text-lg text-gray-600 transition-colors hover:border-indigo-200 hover:text-indigo-600"
                >
                  +
                </button>
              </div>
            }
          >
            <div className="mt-3.5 grid grid-cols-7 gap-1 sm:grid-cols-[repeat(14,minmax(0,1fr))]">
              {Array.from({ length: MAX_DAYS }, (_, i) => i + 1).map(day => {
                const current = day === form.days
                const inRange = day <= form.days
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => set('days', day)}
                    aria-pressed={current}
                    title={`${day} ${day === 1 ? 'day' : 'days'}`}
                    className={`h-9 cursor-pointer rounded-lg border text-[12.5px] font-semibold tabular-nums transition-colors ${
                      current
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : inRange
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
            <div className="mt-1.5 hidden justify-between text-xs text-gray-400 sm:flex">
              <span>Weekend</span>
              <span>One week</span>
              <span>Two weeks</span>
            </div>
          </Section>

          <Section step={3} done title="Budget">
            <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
              {BUDGETS.map(budget => {
                const active = form.budget === budget.value
                return (
                  <button
                    key={budget.value}
                    type="button"
                    onClick={() => set('budget', budget.value)}
                    aria-pressed={active}
                    className={`cursor-pointer rounded-[14px] border-[1.5px] p-4 text-left transition-colors ${
                      active ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className={`font-display text-[17px] font-semibold ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {budget.sign}
                      </span>
                      <span className={`size-4.5 rounded-full bg-white transition-colors ${
                        active ? 'border-5 border-indigo-600' : 'border-[1.5px] border-gray-300'
                      }`} />
                    </span>
                    <span className="mt-3 block text-[15px] font-semibold text-gray-900">{budget.value}</span>
                    <span className="mt-0.5 block text-[12.5px] text-gray-500">{budget.desc}</span>
                  </button>
                )
              })}
            </div>
          </Section>

          <Section step={4} done title="Travel style">
            <div className="mt-3.5 flex flex-wrap gap-2">
              {STYLES.map(style => {
                const active = form.travelStyle === style.value
                return (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => set('travelStyle', style.value)}
                    aria-pressed={active}
                    className={`cursor-pointer rounded-full border px-4 py-2.25 text-sm font-medium transition-colors ${
                      active
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {style.value}
                  </button>
                )
              })}
            </div>
            <p className="mt-2.5 text-[13px] text-gray-500">{styleHint}</p>
          </Section>

          <Section
            step={5}
            done={form.interests.length > 0}
            title="Interests"
            aside={
              <span className="text-[12.5px] text-gray-500">
                {form.interests.length > 0 ? `${form.interests.length} selected` : 'Select all that apply'}
              </span>
            }
          >
            <div className="mt-3.5 flex flex-wrap gap-2">
              {INTERESTS.map(interest => {
                const active = form.interests.includes(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    role="checkbox"
                    aria-checked={active}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border py-2 pl-2.5 pr-3.5 text-sm font-medium transition-colors ${
                      active
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className={`flex size-4 items-center justify-center rounded-[5px] border-[1.5px] transition-colors ${
                      active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white text-transparent'
                    }`}>
                      <TickIcon />
                    </span>
                    {interest}
                  </button>
                )
              })}
            </div>
          </Section>

          <Section
            step={6}
            done={form.notes.trim().length > 0}
            title={<>Anything else? <span className="text-[12.5px] font-normal text-gray-400">optional</span></>}
          >
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              maxLength={MAX_NOTES}
              placeholder="e.g. travelling with kids, no spicy food, prefer walking over taxis…"
              className={`mt-3.5 w-full resize-y px-3.5 py-3 leading-relaxed ${FIELD}`}
            />
            <p className="mt-1.5 text-right text-xs text-gray-400 tabular-nums">
              {form.notes.length} / {MAX_NOTES}
            </p>
          </Section>
        </div>

        <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-21">
          <div className="overflow-hidden rounded-[18px] border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 pb-4 pt-4.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Trip summary</p>
              <p className={`mt-1.5 truncate font-display text-2xl font-semibold leading-tight tracking-tight ${
                destination ? 'text-gray-900' : 'text-gray-300'
              }`}>
                {destination || 'Where to?'}
              </p>
              {form.name.trim() && <p className="mt-0.5 truncate text-[13px] text-gray-500">{form.name.trim()}</p>}
            </div>

            <dl className="px-5 pb-3.5">
              <SummaryRow label="Duration" value={`${form.days} ${form.days === 1 ? 'day' : 'days'}`} />
              <SummaryRow label="Budget" value={`${selectedCost.value} · ${selectedCost.sign}`} />
              <SummaryRow label="Style" value={form.travelStyle} />
              <div className="pt-3">
                <dt className="text-[13.5px] text-gray-500">Interests</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {form.interests.length > 0
                    ? form.interests.map(interest => (
                        <span key={interest} className="rounded-full bg-indigo-50 px-2.5 py-1 text-[12.5px] font-medium text-indigo-700">
                          {interest}
                        </span>
                      ))
                    : <span className="text-[13.5px] text-gray-400">None selected</span>}
                </dd>
              </div>
            </dl>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`flex h-13 w-full items-center justify-center rounded-[14px] border text-[15px] font-semibold transition-colors ${
              destination
                ? 'cursor-pointer border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700'
                : 'border-gray-200 bg-gray-100 text-gray-400'
            }`}
          >
            Generate my itinerary
          </button>
          <p className="text-center text-[12.5px] leading-relaxed text-gray-500">
            {destination ? 'Generating usually takes under a minute.' : 'Add a destination to continue.'}
          </p>
        </aside>
      </form>
    </div>
  )
}
