import { api } from './api'

export const tripsService = {
  getAll:         ()              => api.get('/trips'),
  create:         (data)          => api.post('/trips', data),
  getById:        (tripId)        => api.get(`/trips/${tripId}`),
  update:         (tripId, data)  => api.put(`/trips/${tripId}`, data),
  remove:         (tripId)        => api.delete(`/trips/${tripId}`),
  getShareLink:   (tripId)        => api.get(`/trips/${tripId}/share`),
  generateAiPlan: (tripId)        => api.post(`/trips/${tripId}/ai-plan`),
}
