import api from './api'

export const serviceApi = {
  async list(params = {}) {
    const { data } = await api.get('/services', { params })
    return data // Laravel paginator
  },
  async create(payload) {
    const { data } = await api.post('/services', payload)
    return data
  },
  async update(id, payload) {
    const { data } = await api.put(`/services/${id}`, payload)
    return data
  },
  async remove(id) {
    await api.delete(`/services/${id}`)
  },
}
