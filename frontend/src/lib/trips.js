import { api } from './api'

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS  = 10 * 60 * 1000

export const tripsService = {
  getAll:         ()              => api.get('/trips'),
  create:         (data)          => api.post('/trips', data),
  getById:        (tripId)        => api.get(`/trips/${tripId}`),
  update:         (tripId, data)  => api.put(`/trips/${tripId}`, data),
  remove:         (tripId)        => api.delete(`/trips/${tripId}`),
  getShareLink:   (tripId)        => api.get(`/trips/${tripId}/share`),
  generateAiPlan: (tripId)        => api.post(`/trips/${tripId}/ai-plan`),
}

// Plans are generated in the background — poll the trip until it's ready or failed
export async function waitForAiPlan(tripId, signal) {
  const giveUpAt = Date.now() + POLL_TIMEOUT_MS

  while (Date.now() < giveUpAt) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    if (signal?.aborted) return null

    const trip = await tripsService.getById(tripId)
    if (trip.aiPlanStatus === 'ready')  return trip
    if (trip.aiPlanStatus === 'failed') throw new Error(trip.aiPlanError || 'Could not generate your itinerary. Please try again.')
  }

  throw new Error('Your itinerary is taking longer than expected. Check your trips again in a few minutes.')
}
