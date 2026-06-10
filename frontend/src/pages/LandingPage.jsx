import { useState, useEffect, useRef } from 'react'

// ── Animation helpers ────────────────────────────────────────────────────────

function useInView(rootMargin = '-60px') {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { rootMargin, threshold: 0.05 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [rootMargin])
  return [ref, visible]
}

const slideUp = (visible, i = 0) => ({
  transition: 'opacity 0.55s ease-out, transform 0.55s ease-out',
  transitionDelay: visible ? `${i * 100}ms` : '0ms',
  opacity: visible ? 1 : 0,
  transform: visible ? 'none' : 'translateY(28px)',
})

// ── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Itineraries',
    desc: 'Tell us your destination and preferences. Our AI crafts a personalized day-by-day plan in seconds — morning, afternoon, and evening included.',
  },
  {
    icon: '🌍',
    title: 'Any Destination, Any Style',
    desc: 'Cultural, adventure, romantic, family — any budget, any style. Navio adapts the entire plan to your preferences.',
  },
  {
    icon: '✈️',
    title: 'Save & Organize Trips',
    desc: 'All your travel plans in one place. Save, revisit, and manage every itinerary — no more scattered notes.',
  },
]

const steps = [
  { num: '01', title: 'Describe your dream trip', desc: 'Enter destination, duration, budget, and interests. Takes less than a minute.' },
  { num: '02', title: 'AI builds your plan',       desc: 'Our AI generates a detailed itinerary tailored to exactly what you want — hidden gems included.' },
  { num: '03', title: 'Explore and enjoy',         desc: 'Review your plan, save it, and start counting down the days.' },
]

const destinations = [
  { name: 'Paris',     country: 'France',    flag: '🇫🇷', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80' },
  { name: 'Kyoto',     country: 'Japan',     flag: '🇯🇵', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80' },
  { name: 'Santorini', country: 'Greece',    flag: '🇬🇷', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=80' },
  { name: 'Bali',      country: 'Indonesia', flag: '🇮🇩', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80' },
  { name: 'New York',  country: 'USA',       flag: '🇺🇸', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80' },
  { name: 'Istanbul',  country: 'Turkey',    flag: '🇹🇷', img: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=600&q=80' },
]

const KYOTO_IMG     = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=300&q=80'
const SANTORINI_IMG = 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=300&q=80'

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage({ onGetStarted, onSignIn }) {
  // Page-load animation
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 60); return () => clearTimeout(t) }, [])

  // Scroll-reveal refs
  const [featuresRef, featuresVisible] = useInView()
  const [stepsRef,    stepsVisible]    = useInView()
  const [destRef,     destVisible]     = useInView()
  const [ctaRef,      ctaVisible]      = useInView('-40px')

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Header ── */}
      <header
        style={slideUp(loaded, 0)}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-indigo-600 tracking-tight">Navio</span>
              <span className="text-indigo-400 text-xl leading-none">✦</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onSignIn} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">
                Sign In
              </button>
              <button onClick={onGetStarted} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white pt-16 pb-28 px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-40 -right-40 w-175 h-175 rounded-full bg-indigo-100 opacity-30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-125 h-125 rounded-full bg-violet-100 opacity-25 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Text — staggered entry */}
            <div className="max-w-xl">
              <div style={slideUp(loaded, 0)}>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                  AI-Powered Travel Planning
                </div>
              </div>

              <div style={slideUp(loaded, 1)}>
                <h1 className="mb-6 text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-tight text-gray-900">
                  Your next adventure,{' '}
                  <span className="bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    perfectly planned
                  </span>
                </h1>
              </div>

              <div style={slideUp(loaded, 2)}>
                <p className="mb-8 text-lg leading-relaxed text-gray-600">
                  Navio uses AI to generate personalized travel itineraries in seconds. Tell us where you want to go — we'll handle every detail.
                </p>
              </div>

              <div style={slideUp(loaded, 3)} className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:-translate-y-0.5"
                >
                  Start planning free
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                <button
                  onClick={onSignIn}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Sign in
                </button>
              </div>

              <div style={slideUp(loaded, 4)}>
                <p className="mt-4 text-sm text-gray-400">Free to use · No credit card required</p>
              </div>
            </div>

            {/* Trip card + floating accent photos */}
            <div
              className="relative flex justify-center lg:justify-end"
              style={{
                transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
                transitionDelay: '250ms',
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'none' : 'translateX(32px)',
              }}
            >
              <div className="relative w-full max-w-sm pb-8">

                {/* Accent photo: Kyoto (top-right) */}
                <div
                  className="absolute -top-8 -right-4 z-20 hidden h-36 w-28 overflow-hidden rounded-2xl border-4 border-white shadow-2xl lg:block"
                  style={{
                    transform: 'rotate(4deg)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                    transitionDelay: '700ms',
                    opacity: loaded ? 1 : 0,
                  }}
                >
                  <img src={KYOTO_IMG} alt="Kyoto, Japan" className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1.5">
                    <p className="text-xs font-semibold text-white">Kyoto 🇯🇵</p>
                  </div>
                </div>

                {/* Accent photo: Santorini (bottom-left) */}
                <div
                  className="absolute -bottom-2 -left-8 z-20 hidden h-28 w-24 overflow-hidden rounded-2xl border-4 border-white shadow-xl lg:block"
                  style={{
                    transform: 'rotate(-3deg)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                    transitionDelay: '900ms',
                    opacity: loaded ? 1 : 0,
                  }}
                >
                  <img src={SANTORINI_IMG} alt="Santorini, Greece" className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1.5">
                    <p className="text-xs font-semibold text-white">Santorini 🇬🇷</p>
                  </div>
                </div>

                {/* Background glow */}
                <div className="pointer-events-none absolute inset-0 scale-90 rounded-3xl bg-linear-to-br from-indigo-200 to-violet-200 opacity-20 blur-3xl" />

                {/* Trip card */}
                <div className="relative z-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl">🗼</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900">Paris, France</p>
                      <p className="text-sm text-gray-500">7 days · Moderate · Cultural</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      AI Ready
                    </span>
                  </div>
                  <div className="mb-4 space-y-2">
                    {[
                      { day: 'Day 1', activity: 'Eiffel Tower & Champ de Mars' },
                      { day: 'Day 2', activity: 'Louvre Museum & Tuileries' },
                      { day: 'Day 3', activity: 'Montmartre & Sacré-Cœur' },
                    ].map(({ day, activity }, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-gray-50 p-2.5 text-sm">
                        <span className="w-10 shrink-0 text-xs font-semibold text-indigo-600">{day}</span>
                        <span className="text-gray-700">{activity}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-2.5 text-sm">
                      <span className="w-10 shrink-0 text-xs font-semibold text-gray-300">+4</span>
                      <span className="text-gray-400">more days in your plan…</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      Navio ✦
                    </div>
                    <span>Est. €1,200 – €1,800</span>
                  </div>
                </div>

                {/* Badge */}
                <div className="absolute -bottom-4 left-6 z-20 flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
                  <span className="text-lg">⚡</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Generated in 3s</p>
                    <p className="text-xs text-gray-400">powered by AI</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div ref={featuresRef} className="mx-auto max-w-7xl">
          <div style={slideUp(featuresVisible)} className="mb-14 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything you need to travel smarter
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-500">
              From first idea to packed bags — Navio gives you the tools to plan, organize, and enjoy every trip.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} style={slideUp(featuresVisible, i + 1)}>
                <div className="group h-full rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-md">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl transition-colors group-hover:bg-indigo-100">
                    {f.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div ref={stepsRef} className="mx-auto max-w-5xl">
          <div style={slideUp(stepsVisible)} className="mb-14 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">How Navio works</h2>
            <p className="mx-auto max-w-xl text-lg text-gray-500">
              Planning your perfect trip takes just three simple steps.
            </p>
          </div>
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-6">
            {steps.map((step, i) => (
              <div key={i} style={slideUp(stepsVisible, i + 1)} className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-indigo-100 bg-indigo-50 shadow-sm">
                  <span className="text-2xl font-bold text-indigo-600">{step.num}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinations ── */}
      <section className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div ref={destRef} className="mx-auto max-w-7xl">
          <div style={slideUp(destVisible)} className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              Explore the world with Navio
            </h2>
            <p className="text-lg text-gray-500">Popular destinations planned by our travelers</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {destinations.map((d, i) => (
              <div key={d.name} style={slideUp(destVisible, i + 1)}>
                <div className="group relative h-60 cursor-default overflow-hidden rounded-2xl shadow-md">
                  <img
                    src={d.img}
                    alt={d.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{d.flag}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{d.name}</p>
                        <p className="text-xs text-white/70">{d.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        ref={ctaRef}
        style={slideUp(ctaVisible)}
        className="bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-700 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-3xl text-center text-white">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Ready to explore the world?</h2>
          <p className="mb-8 text-lg text-indigo-100">
            Join travelers who plan smarter, stress-free trips with Navio.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-700 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-indigo-50"
          >
            Get started for free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-indigo-600">Navio</span>
            <span className="text-indigo-400 leading-none">✦</span>
          </div>
          <p className="text-sm text-gray-400">© 2025 Navio. Your AI-powered travel companion.</p>
        </div>
      </footer>
    </div>
  )
}
