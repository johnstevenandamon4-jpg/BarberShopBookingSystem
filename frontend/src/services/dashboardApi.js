import api from './api'

export const dashboardApi = {
  async get() {
    const { data } = await api.get('/admin/dashboard')
    return data // { summary, bookings_by_barber, recent_appointments }
  },
}
