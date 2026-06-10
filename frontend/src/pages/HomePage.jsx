import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
  transitionDelay: visible ? `${i * 90}ms` : '0ms',
  opacity: visible ? 1 : 0,
  transform: visible ? 'none' : 'translateY(24px)',
})

// ── Data ─────────────────────────────────────────────────────────────────────

const navioFeatures = [
  {
    icon: '🤖',
    title: 'AI-Generated Itineraries',
    desc: 'Describe your dream trip and our AI builds a complete day-by-day plan — morning, afternoon, and evening — in seconds.',
  },
  {
    icon: '🌍',
    title: 'Any Destination, Any Style',
    desc: 'Cultural, adventure, romantic, family — any budget, any travel style. Navio adapts the plan entirely to your preferences.',
  },
  {
    icon: '✈️',
    title: 'Save & Manage All Your Trips',
    desc: 'Every itinerary you create is saved to your account. Review, revisit, and manage your travel plans anytime.',
  },
]

const howItWorks = [
  { num: '01', icon: '📝', title: 'Tell us your trip',     desc: 'Enter destination, duration, budget, travel style, and interests. Takes less than a minute.' },
  { num: '02', icon: '⚡', title: 'AI builds your plan',   desc: 'Our AI crafts a detailed itinerary tailored to exactly what you want — including hidden gems.' },
  { num: '03', icon: '🗺️', title: 'Save and explore',     desc: 'Your trip is saved to your account. Review every day, every activity, and start packing.' },
]

const destinations = [
  { name: 'Paris',     country: 'France',    flag: '🇫🇷', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80' },
  { name: 'Tokyo',     country: 'Japan',     flag: '🇯🇵', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80' },
  { name: 'Santorini', country: 'Greece',    flag: '🇬🇷', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=80' },
  { name: 'Bali',      country: 'Indonesia', flag: '🇮🇩', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80' },
  { name: 'New York',  country: 'USA',       flag: '🇺🇸', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80' },
  { name: 'Kyoto',     country: 'Japan',     flag: '🇯🇵', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80' },
  { name: 'Rome',      country: 'Italy',     flag: '🇮🇹', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80' },
  { name: 'Barcelona', country: 'Spain',     flag: '🇪🇸', img: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=600&q=80' },
]

const travelTips = [
  { icon: '🎒', title: 'Pack light, travel far',    tip: "Carry-on only removes lost luggage stress and long check-in queues. You'll move faster and enjoy more." },
  { icon: '🌐', title: 'Learn a few local phrases', tip: '"Hello" and "thank you" in the local language opens doors and earns genuine smiles.' },
  { icon: '📅', title: 'Travel shoulder season',    tip: 'Just before or after peak season means fewer crowds, lower prices, and often better weather.' },
  { icon: '💳', title: 'Notify your bank',          tip: 'Tell your bank before you leave to avoid having your card frozen mid-trip for "suspicious" activity.' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { userAttrs } = useAuth()
  const firstName = userAttrs?.name?.split(' ')[0] ?? 'there'

  // Mount animation
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 60); return () => clearTimeout(t) }, [])

  // Scroll-reveal
  const [featuresRef, featuresVisible] = useInView()
  const [howRef,      howVisible]      = useInView()
  const [destRef,     destVisible]     = useInView()
  const [tipsRef,     tipsVisible]     = useInView()

  return (
    <div className="flex flex-col gap-12">

      {/* ── Hero banner ── */}
      <section
        style={slideUp(loaded, 0)}
        className="relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-700 px-8 py-10 text-white shadow-xl sm:px-12 sm:py-12"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 right-32 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <p className="mb-1 text-sm font-medium tracking-wide text-indigo-200 uppercase">Welcome back</p>
            <h1 className="mb-3 text-3xl font-bold leading-tight sm:text-4xl">
              Hello, {firstName}! 👋
            </h1>
            <p className="mb-7 text-base leading-relaxed text-indigo-100">
              Ready for your next adventure? Describe where you want to go and let Navio build a personalized itinerary in seconds.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/plan"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-md transition-all hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                Plan a new trip
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                to="/trips"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                My trips
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 backdrop-blur-sm">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-xs text-indigo-200">Average planning time</p>
                <p className="text-base font-bold text-white">Under 5 seconds</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 backdrop-blur-sm">
              <span className="text-2xl">🗺️</span>
              <div>
                <p className="text-xs text-indigo-200">Destinations covered</p>
                <p className="text-base font-bold text-white">Anywhere in the world</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What Navio can do ── */}
      <section>
        <div ref={featuresRef}>
          <div style={slideUp(featuresVisible)} className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">What Navio can do for you</h2>
            <p className="mt-1 text-sm text-gray-500">Everything you need to plan and manage your travels.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {navioFeatures.map((f, i) => (
              <div key={f.title} style={slideUp(featuresVisible, i + 1)}>
                <div className="group h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-md">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl transition-colors group-hover:bg-indigo-100">
                    {f.icon}
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section>
        <div ref={howRef} className="rounded-2xl bg-gray-50 px-8 py-10">
          <div style={slideUp(howVisible)} className="mb-8">
            <h2 className="text-xl font-bold text-gray-900">How it works</h2>
            <p className="mt-1 text-sm text-gray-500">A great itinerary in three simple steps.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {howItWorks.map((step, i) => (
              <div key={i} style={slideUp(howVisible, i + 1)} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-lg">
                  {step.icon}
                </div>
                <div>
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-500">{step.num}</span>
                    <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={slideUp(howVisible, howItWorks.length + 1)} className="mt-8 text-center">
            <Link
              to="/plan"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:-translate-y-0.5"
            >
              Create your first itinerary
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Destinations ── */}
      <section>
        <div ref={destRef}>
          <div style={slideUp(destVisible)} className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Popular destinations</h2>
            <p className="mt-1 text-sm text-gray-500">Plan a trip to any of these or anywhere else in the world.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {destinations.map((d, i) => (
              <div key={d.name} style={slideUp(destVisible, i + 1)}>
                <div className="group relative h-44 cursor-default overflow-hidden rounded-2xl shadow-sm">
                  <img
                    src={d.img}
                    alt={d.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/5 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{d.flag}</span>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">{d.name}</p>
                        <p className="text-[10px] text-white/70 leading-tight">{d.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Travel tips ── */}
      <section>
        <div ref={tipsRef}>
          <div style={slideUp(tipsVisible)} className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Travel tips</h2>
            <p className="mt-1 text-sm text-gray-500">Quick tips from experienced travelers.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {travelTips.map((t, i) => (
              <div key={t.title} style={slideUp(tipsVisible, i + 1)}>
                <div className="h-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
                  <span className="mb-3 block text-2xl">{t.icon}</span>
                  <h3 className="mb-1.5 text-sm font-semibold text-gray-900">{t.title}</h3>
                  <p className="text-xs leading-relaxed text-gray-500">{t.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
