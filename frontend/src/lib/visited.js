import { useState } from 'react'

const storageKey = tripId => `navio:visited:${tripId}`

function load(tripId) {
  if (!tripId) return {}
  try {
    return JSON.parse(localStorage.getItem(storageKey(tripId))) ?? {}
  } catch {
    return {}
  }
}

// Visited stops are remembered in this browser, keyed by day and venue
export function useVisited(tripId) {
  const [visited, setVisited] = useState(() => load(tripId))

  const toggle = key => {
    const next = { ...visited }
    if (next[key]) delete next[key]
    else next[key] = true
    setVisited(next)

    if (!tripId) return
    try {
      localStorage.setItem(storageKey(tripId), JSON.stringify(next))
    } catch {
      // Blocked or full storage: the ticks still work until the page reloads
    }
  }

  return [visited, toggle]
}
