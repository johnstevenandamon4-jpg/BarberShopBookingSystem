import api from './api'

export const notificationApi = {
  async list(params = {}) {
    const { data } = await api.get('/notifications', { params })
    return data
  },
  async markAsRead(id) {
    const { data } = await api.patch(`/notifications/${id}/read`)
    return data
  },
}
