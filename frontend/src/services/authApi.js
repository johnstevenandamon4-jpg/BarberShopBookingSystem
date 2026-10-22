import api from './api'

export const authApi = {
  async register(payload) {
    const { data } = await api.post('/register', payload)
    return data // { message, user, token }
  },
  async login(payload) {
    const { data } = await api.post('/login', payload)
    return data // { message, user, token }
  },
  async logout() {
    await api.post('/logout')
  },
  async me() {
    const { data } = await api.get('/me')
    return data.user
  },
}
