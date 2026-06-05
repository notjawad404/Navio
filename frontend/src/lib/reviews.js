import { api } from './api'

export const reviewsService = {
  add: (tripId, data) => api.post(`/trips/${tripId}/reviews`, data),
}
