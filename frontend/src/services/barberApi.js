import api from './api'

export const barberApi = {
  async list(params = {}) {
    const { data } = await api.get('/barbers', { params })
    return data // Laravel paginator
  },
  async create(payload) {
    const { data } = await api.post('/barbers', payload)
    return data
  },
  async update(id, payload) {
    const { data } = await api.put(`/barbers/${id}`, payload)
    return data
  },
  async remove(id) {
    await api.delete(`/barbers/${id}`)
  },
}
