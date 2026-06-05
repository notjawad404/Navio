import { api } from './api'

export const placesService = {
  add: (tripId, data) => api.post(`/trips/${tripId}/places`, data),
}
