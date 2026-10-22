import api from './api'

export const appointmentApi = {
  /** Customers get their own appointments, admins get everyone's. */
  async list(params = {}) {
    const { data } = await api.get('/appointments', { params })
    return data
  },
  async create(payload) {
    const { data } = await api.post('/appointments', payload)
    return data
  },
  /** Customers edit their pending bookings; admins change `status`. */
  async update(id, payload) {
    const { data } = await api.patch(`/appointments/${id}`, payload)
    return data
  },
  /** For customers this cancels a pending appointment. */
  async cancel(id) {
    const { data } = await api.delete(`/appointments/${id}`)
    return data
  },
  async complete(id) {
    const { data } = await api.post(`/appointments/${id}/complete`)
    return data
  },
}
