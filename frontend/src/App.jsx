import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import HomePage from './pages/HomePage'
import MyAppointments from './pages/MyAppointments'

const API_URL = 'http://127.0.0.1:8000/api'
const GMAIL_PATTERN = /^[A-Z0-9]+(?:\.[A-Z0-9]+)*@gmail\.com$/i

function getRoleLabel(role) {
  if (role === 'admin') return 'ADMIN'
  if (role === 'customer') return 'CUSTOMER'
  return 'ROLE NOT SET'
}

function getRoleBadgeStyle(role) {
  const isAdmin = role === 'admin'

  return {
    display: 'inline-block',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    color: isAdmin ? '#ffffff' : '#222222',
    backgroundColor: isAdmin ? '#276749' : '#e5e7eb',
  }
}

function scrollToSection(sectionId, event) {
  event?.preventDefault()

  if (sectionId === 'home') {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    return
  }

  document.getElementById(sectionId)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function useDraftState(storageKey, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const savedValue = localStorage.getItem(storageKey)
      return savedValue !== null ? JSON.parse(savedValue) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // Continue if browser storage is unavailable.
    }
  }, [storageKey, value])

  return [value, setValue]
}

function useSessionDraftState(storageKey, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const savedValue = sessionStorage.getItem(storageKey)
      return savedValue !== null ? savedValue : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      if (value === '') {
        sessionStorage.removeItem(storageKey)
      } else {
        sessionStorage.setItem(storageKey, value)
      }
    } catch {
      // Continue if browser storage is unavailable.
    }
  }, [storageKey, value])

  return [value, setValue]
}

function formatAppointmentDate(dateValue) {
  if (!dateValue) return '—'

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateValue)

  if (match) {
    const [, year, month, day] = match
    const date = new Date(Number(year), Number(month) - 1, Number(day))

    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return dateValue

  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatAppointmentTime(timeValue) {
  if (!timeValue) return '—'

  const match = /^(\d{1,2}):(\d{2})/.exec(timeValue)

  if (!match) return timeValue

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (hours > 23 || minutes > 59) return timeValue

  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return date.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatStatus(status) {
  if (!status) return '—'

  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Check whether the appointment's scheduled local date and time have arrived.
function hasAppointmentTimeArrived(dateValue, timeValue) {
  if (!dateValue || !timeValue) return false

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateValue)
  const timeMatch = /^(\d{1,2}):(\d{2})/.exec(timeValue)

  if (!dateMatch || !timeMatch) return false

  const [, year, month, day] = dateMatch
  const hours = Number(timeMatch[1])
  const minutes = Number(timeMatch[2])

  if (hours > 23 || minutes > 59) return false

  const appointmentDateTime = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    hours,
    minutes,
    0,
    0
  )

  return appointmentDateTime.getTime() <= Date.now()
}

function App() {
  const [barbers, setBarbers] = useState([])

  // All barber pages for the booking dropdown.
  const [bookingBarbers, setBookingBarbers] = useState([])

  const [services, setServices] = useState([])
  const [bookingServices, setBookingServices] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [dashboardError, setDashboardError] = useState('')
  const [dashboardLoading, setDashboardLoading] = useState(false)

  // Administrator appointment actions.
  const [appointmentActionLoadingId, setAppointmentActionLoadingId] =
    useState(null)
  const [appointmentActionError, setAppointmentActionError] = useState('')
  const [appointmentActionMessage, setAppointmentActionMessage] = useState('')

  // Administrator barber availability actions.
  const [barberAvailabilityLoadingId, setBarberAvailabilityLoadingId] =
    useState(null)
  const [barberAvailabilityError, setBarberAvailabilityError] = useState('')
  const [barberAvailabilityMessage, setBarberAvailabilityMessage] =
    useState('')

  // Customer appointment history, cancellation, and completion.
  const [customerAppointments, setCustomerAppointments] = useState([])
  const [customerAppointmentPagination, setCustomerAppointmentPagination] =
    useState(null)
  const [customerAppointmentPage, setCustomerAppointmentPage] = useState(1)
  const [customerAppointmentsLoading, setCustomerAppointmentsLoading] =
    useState(false)
  const [customerAppointmentsError, setCustomerAppointmentsError] =
    useState('')
  const [customerAppointmentActionLoadingId, setCustomerAppointmentActionLoadingId] =
    useState(null)
  const [customerAppointmentActionError, setCustomerAppointmentActionError] =
    useState('')
  const [customerAppointmentActionMessage, setCustomerAppointmentActionMessage] =
    useState('')

  // Persistent notifications sent to the authenticated customer.
  const [customerNotifications, setCustomerNotifications] = useState([])
  const [customerNotificationPagination, setCustomerNotificationPagination] =
    useState(null)
  const [customerNotificationPage, setCustomerNotificationPage] = useState(1)
  const [customerNotificationsLoading, setCustomerNotificationsLoading] =
    useState(false)
  const [customerNotificationsError, setCustomerNotificationsError] =
    useState('')
  const [customerNotificationActionLoadingId, setCustomerNotificationActionLoadingId] =
    useState(null)
  const [customerNotificationActionMessage, setCustomerNotificationActionMessage] =
    useState('')

  const [barberPage, setBarberPage] = useDraftState(
    'barberbook_barber_page',
    1
  )
  const [servicePage, setServicePage] = useDraftState(
    'barberbook_service_page',
    1
  )

  const [barberPagination, setBarberPagination] = useState(null)
  const [servicePagination, setServicePagination] = useState(null)
  const [barbersLoading, setBarbersLoading] = useState(true)
  const [servicesLoading, setServicesLoading] = useState(true)
  const [error, setError] = useState('')

  const [showLogin, setShowLogin] = useDraftState(
    'barberbook_login_open',
    false
  )
  const [email, setEmail] = useDraftState('barberbook_login_email', '')
  const [password, setPassword] = useSessionDraftState(
    'barberbook_login_password',
    ''
  )

  const [loginType, setLoginType] = useState('customer')
  const [user, setUser] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [loginMessage, setLoginMessage] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [bookingBarberId, setBookingBarberId] = useState('')
  const [bookingServiceId, setBookingServiceId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)

  const loginButtonText =
    loginType === 'admin' ? 'Login as Admin' : 'Login as Customer'

  const isAdmin = user?.role === 'admin'
  const isCustomer = user?.role === 'customer'

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  // Load public barber information for the paginated barber cards.
  useEffect(() => {
    const controller = new AbortController()

    async function loadBarbers() {
      setBarbersLoading(true)

      try {
        const response = await axios.get(
          `${API_URL}/barbers?page=${barberPage}`,
          { signal: controller.signal }
        )

        setBarbers(response.data.data ?? [])
        setBarberPagination(response.data)
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError(
            'Unable to load data. Please check that the Laravel server is running.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setBarbersLoading(false)
        }
      }
    }

    void loadBarbers()
    return () => controller.abort()
  }, [barberPage])

  // Load every barber page separately for the booking dropdown.
  // This does not change the pagination of the public barber cards.
  useEffect(() => {
    const controller = new AbortController()

    async function loadAllBookingBarbers() {
      try {
        const firstResponse = await axios.get(`${API_URL}/barbers?page=1`, {
          signal: controller.signal,
        })

        const allBarbers = [...(firstResponse.data.data ?? [])]
        const lastPage = Number(firstResponse.data.last_page ?? 1)

        for (let page = 2; page <= lastPage; page += 1) {
          const response = await axios.get(
            `${API_URL}/barbers?page=${page}`,
            { signal: controller.signal }
          )

          allBarbers.push(...(response.data.data ?? []))
        }

        if (!controller.signal.aborted) {
          setBookingBarbers(allBarbers)
        }
      } catch (err) {
        if (!axios.isCancel(err) && !controller.signal.aborted) {
          console.error('Unable to load all booking barbers:', err)
          setError(
            'Unable to load data. Please check that the Laravel server is running.'
          )
        }
      }
    }

    void loadAllBookingBarbers()

    return () => controller.abort()
  }, [])

  // Load public service information.
  useEffect(() => {
    const controller = new AbortController()

    async function loadServices() {
      setServicesLoading(true)

      try {
        const response = await axios.get(
          `${API_URL}/services?page=${servicePage}`,
          { signal: controller.signal }
        )

        setServices(response.data.data)
        setServicePagination(response.data)
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError(
            'Unable to load data. Please check that the Laravel server is running.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setServicesLoading(false)
        }
      }
    }

    void loadServices()
    return () => controller.abort()
  }, [servicePage])

  // Load every service page for the booking dropdown without changing
  // pagination in the public Services section.
  useEffect(() => {
    const controller = new AbortController()

    async function loadAllBookingServices() {
      try {
        const firstResponse = await axios.get(`${API_URL}/services?page=1`, {
          signal: controller.signal,
        })

        const allServices = [...(firstResponse.data.data ?? [])]
        const lastPage = Number(firstResponse.data.last_page ?? 1)

        for (let page = 2; page <= lastPage; page += 1) {
          const response = await axios.get(
            `${API_URL}/services?page=${page}`,
            { signal: controller.signal }
          )

          allServices.push(...(response.data.data ?? []))
        }

        if (!controller.signal.aborted) {
          setBookingServices(allServices)
        }
      } catch (err) {
        if (!axios.isCancel(err) && !controller.signal.aborted) {
          console.error('Unable to load all booking services:', err)
        }
      }
    }

    void loadAllBookingServices()

    return () => controller.abort()
  }, [])

  // Restore an existing login session.
  useEffect(() => {
    async function restoreLogin() {
      const savedToken = localStorage.getItem('barber_token')

      if (!savedToken) return

      try {
        axios.defaults.headers.common.Authorization = `Bearer ${savedToken}`

        const response = await axios.get(`${API_URL}/me`)
        setUser(response.data.user ?? response.data)
      } catch {
        localStorage.removeItem('barber_token')
        delete axios.defaults.headers.common.Authorization
      }
    }

    void restoreLogin()
  }, [])

  // Load administrator dashboard data only for administrators.
  useEffect(() => {
    if (!isAdmin) {
      setDashboardData(null)
      setDashboardError('')
      setDashboardLoading(false)
      setAppointmentActionError('')
      setAppointmentActionMessage('')
      setBarberAvailabilityError('')
      setBarberAvailabilityMessage('')
      return
    }

    const controller = new AbortController()

    async function loadDashboard() {
      setDashboardLoading(true)
      setDashboardError('')

      try {
        const response = await axios.get(`${API_URL}/admin/dashboard`, {
          signal: controller.signal,
        })

        setDashboardData(response.data)
      } catch (err) {
        if (!axios.isCancel(err)) {
          setDashboardError(
            err.response?.data?.message ||
              'Unable to load administrator dashboard data.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setDashboardLoading(false)
        }
      }
    }

    void loadDashboard()
    return () => controller.abort()
  }, [user?.id, user?.role])

  // Fetch only the authenticated customer's appointments.
  // The API returns each appointment's current barber availability.
  useEffect(() => {
    if (!isCustomer) {
      setCustomerAppointments([])
      setCustomerAppointmentPagination(null)
      setCustomerAppointmentPage(1)
      setCustomerAppointmentsLoading(false)
      setCustomerAppointmentsError('')
      setCustomerAppointmentActionError('')
      setCustomerAppointmentActionMessage('')
      return
    }

    const controller = new AbortController()

    async function loadCustomerAppointments() {
      setCustomerAppointmentsLoading(true)
      setCustomerAppointmentsError('')

      try {
        const response = await axios.get(
          `${API_URL}/appointments?page=${customerAppointmentPage}`,
          { signal: controller.signal }
        )

        setCustomerAppointments(response.data.data ?? [])
        setCustomerAppointmentPagination(response.data)
      } catch (err) {
        if (!axios.isCancel(err)) {
          setCustomerAppointmentsError(
            err.response?.data?.message ||
              'Unable to load your appointments. Please try again.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setCustomerAppointmentsLoading(false)
        }
      }
    }

    void loadCustomerAppointments()
    return () => controller.abort()
  }, [user?.id, user?.role, customerAppointmentPage])

  // Fetch persistent notifications for the authenticated customer.
  useEffect(() => {
    if (!isCustomer) {
      setCustomerNotifications([])
      setCustomerNotificationPagination(null)
      setCustomerNotificationPage(1)
      setCustomerNotificationsLoading(false)
      setCustomerNotificationsError('')
      setCustomerNotificationActionLoadingId(null)
      setCustomerNotificationActionMessage('')
      return
    }

    const controller = new AbortController()

    async function loadCustomerNotifications() {
      setCustomerNotificationsLoading(true)
      setCustomerNotificationsError('')

      try {
        const response = await axios.get(
          `${API_URL}/notifications?page=${customerNotificationPage}`,
          { signal: controller.signal }
        )

        setCustomerNotifications(response.data.data ?? [])
        setCustomerNotificationPagination(response.data)
      } catch (err) {
        if (!axios.isCancel(err)) {
          setCustomerNotificationsError(
            err.response?.data?.message ||
              'Unable to load your notifications. Please try again.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setCustomerNotificationsLoading(false)
        }
      }
    }

    void loadCustomerNotifications()
    return () => controller.abort()
  }, [user?.id, user?.role, customerNotificationPage])

  // Clear booking messages when the logged-in account changes.
  useEffect(() => {
    setBookingError('')
    setBookingMessage('')
  }, [user?.id])

  async function refreshCustomerAppointments(page = customerAppointmentPage) {
    if (!isCustomer) return

    setCustomerAppointmentsLoading(true)
    setCustomerAppointmentsError('')

    try {
      const response = await axios.get(`${API_URL}/appointments?page=${page}`)

      setCustomerAppointments(response.data.data ?? [])
      setCustomerAppointmentPagination(response.data)
    } catch (err) {
      setCustomerAppointmentsError(
        err.response?.data?.message ||
          'Unable to refresh your appointments. Please try again.'
      )
    } finally {
      setCustomerAppointmentsLoading(false)
    }
  }

  async function refreshCustomerNotifications(page = customerNotificationPage) {
    if (!isCustomer) return

    setCustomerNotificationsLoading(true)
    setCustomerNotificationsError('')

    try {
      const response = await axios.get(`${API_URL}/notifications?page=${page}`)
      setCustomerNotifications(response.data.data ?? [])
      setCustomerNotificationPagination(response.data)
    } catch (err) {
      setCustomerNotificationsError(
        err.response?.data?.message ||
          'Unable to refresh your notifications. Please try again.'
      )
    } finally {
      setCustomerNotificationsLoading(false)
    }
  }

  async function handleMarkNotificationAsRead(notification) {
    if (!isCustomer || notification.read_at) return

    setCustomerNotificationActionLoadingId(notification.id)
    setCustomerNotificationActionMessage('')
    setCustomerNotificationsError('')

    try {
      const response = await axios.patch(
        `${API_URL}/notifications/${notification.id}/read`
      )

      setCustomerNotifications((currentNotifications) =>
        currentNotifications.map((item) =>
          item.id === notification.id
            ? { ...item, ...(response.data.data ?? {}), read_at: response.data.data?.read_at ?? new Date().toISOString() }
            : item
        )
      )
      setCustomerNotificationActionMessage(
        response.data.message || 'Notification marked as read.'
      )
    } catch (err) {
      setCustomerNotificationsError(
        err.response?.data?.message ||
          'Unable to mark this notification as read. Please try again.'
      )
    } finally {
      setCustomerNotificationActionLoadingId(null)
    }
  }

  async function handleCustomerAppointmentCancel(appointment) {
    if (!isCustomer || appointment.status !== 'pending') {
      setCustomerAppointmentActionError(
        'Only your own pending appointments can be cancelled.'
      )
      return
    }

    const shouldContinue = window.confirm(
      `Are you sure you want to cancel your appointment with ${
        appointment.barber?.name || 'this barber'
      } on ${formatAppointmentDate(appointment.appointment_date)} at ${
        formatAppointmentTime(appointment.appointment_time)
      }?`
    )

    if (!shouldContinue) return

    setCustomerAppointmentActionLoadingId(appointment.id)
    setCustomerAppointmentActionError('')
    setCustomerAppointmentActionMessage('')

    try {
      const response = await axios.delete(
        `${API_URL}/appointments/${appointment.id}`
      )

      setCustomerAppointmentActionMessage(
        response.data.message || 'Your appointment was cancelled successfully.'
      )

      await refreshCustomerAppointments()
    } catch (err) {
      setCustomerAppointmentActionError(
        err.response?.data?.message ||
          'Unable to cancel this appointment. Please try again.'
      )
    } finally {
      setCustomerAppointmentActionLoadingId(null)
    }
  }

  // Allow customers to mark their own eligible confirmed appointment as done.
  async function handleCustomerAppointmentComplete(appointment) {
    if (!isCustomer || appointment.status !== 'confirmed') {
      setCustomerAppointmentActionError(
        'Only your own confirmed appointments can be marked as done.'
      )
      return
    }

    if (
      !hasAppointmentTimeArrived(
        appointment.appointment_date,
        appointment.appointment_time
      )
    ) {
      setCustomerAppointmentActionError(
        'You can mark this appointment as done only after its scheduled date and time.'
      )
      return
    }

    const shouldContinue = window.confirm(
      `Have you received your haircut for the appointment with ${
        appointment.barber?.name || 'this barber'
      }? Confirming will mark this appointment as completed.`
    )

    if (!shouldContinue) return

    setCustomerAppointmentActionLoadingId(appointment.id)
    setCustomerAppointmentActionError('')
    setCustomerAppointmentActionMessage('')

    try {
      const response = await axios.post(
        `${API_URL}/appointments/${appointment.id}/complete`
      )

      setCustomerAppointmentActionMessage(
        response.data.message || 'Appointment marked as done successfully.'
      )

      await refreshCustomerAppointments()
    } catch (err) {
      setCustomerAppointmentActionError(
        err.response?.data?.message ||
          'Unable to mark this appointment as done. Please try again.'
      )
    } finally {
      setCustomerAppointmentActionLoadingId(null)
    }
  }

  function openLogin(type) {
    setLoginType(type)
    setShowLogin(true)
    setLoginError('')
    setLoginMessage('')

    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }

  async function handleLogin(event) {
    event.preventDefault()
    setLoginError('')
    setLoginMessage('')

    const trimmedEmail = email.trim()

    if (!GMAIL_PATTERN.test(trimmedEmail)) {
      setLoginError(
        'Please enter a valid Gmail address ending in @gmail.com.'
      )
      return
    }

    if (!password) {
      setLoginError('Please enter your password.')
      return
    }

    setLoginLoading(true)

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email: trimmedEmail,
        password,
        login_type: loginType,
      })

      const token = response.data.token

      localStorage.setItem('barber_token', token)
      axios.defaults.headers.common.Authorization = `Bearer ${token}`

      setUser(response.data.user)
      setEmail('')
      setPassword('')
      setShowLogin(false)
      setLoginMessage('Login successful!')
      setCustomerAppointmentPage(1)
      setCustomerAppointmentActionError('')
      setCustomerAppointmentActionMessage('')
      setCustomerNotifications([])
      setCustomerNotificationPagination(null)
      setCustomerNotificationPage(1)
      setCustomerNotificationsError('')
      setCustomerNotificationActionMessage('')
      setAppointmentActionError('')
      setAppointmentActionMessage('')
      setBarberAvailabilityError('')
      setBarberAvailabilityMessage('')
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    } catch (err) {
      const validationErrors = err.response?.data?.errors
      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null

      setLoginError(
        firstValidationError ||
          err.response?.data?.message ||
          'Login failed. Check your email, password, and selected account type.'
      )
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await axios.post(`${API_URL}/logout`)
    } catch {
      // Clear the local session even if the server request fails.
    } finally {
      localStorage.removeItem('barber_token')
      delete axios.defaults.headers.common.Authorization

      setUser(null)
      setDashboardData(null)
      setDashboardError('')
      setCustomerAppointments([])
      setCustomerAppointmentPagination(null)
      setCustomerAppointmentPage(1)
      setCustomerAppointmentsError('')
      setCustomerAppointmentActionError('')
      setCustomerAppointmentActionMessage('')
      setCustomerNotifications([])
      setCustomerNotificationPagination(null)
      setCustomerNotificationPage(1)
      setCustomerNotificationsError('')
      setCustomerNotificationActionLoadingId(null)
      setCustomerNotificationActionMessage('')
      setAppointmentActionError('')
      setAppointmentActionMessage('')
      setBarberAvailabilityError('')
      setBarberAvailabilityMessage('')
      setLoginMessage('You have logged out.')
      setLoginError('')
      setShowLogin(false)
      setPassword('')
      setLoginType('customer')
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }
  }

  async function handleRefreshDashboard() {
    setDashboardLoading(true)
    setDashboardError('')

    try {
      const response = await axios.get(`${API_URL}/admin/dashboard`)
      setDashboardData(response.data)
    } catch (err) {
      setDashboardError(
        err.response?.data?.message ||
          'Unable to load administrator dashboard data.'
      )
    } finally {
      setDashboardLoading(false)
    }
  }

  // Change a barber's availability using the authenticated Laravel API.
  async function handleBarberAvailabilityChange(barber) {
    if (!isAdmin) {
      setBarberAvailabilityError(
        'Only an administrator can change barber availability.'
      )
      return
    }

    if (
      barberAvailabilityLoadingId !== null ||
      appointmentActionLoadingId !== null
    ) {
      return
    }

    const currentlyAvailable = Boolean(barber.is_available)
    const nextAvailability = !currentlyAvailable
    const nextLabel = nextAvailability ? 'Available' : 'Unavailable'

    const shouldContinue = window.confirm(
      `Are you sure you want to mark ${barber.name} as ${nextLabel}?`
    )

    if (!shouldContinue) return

    setBarberAvailabilityLoadingId(barber.id)
    setBarberAvailabilityError('')
    setBarberAvailabilityMessage('')
    setAppointmentActionError('')

    try {
      const updateResponse = await axios.patch(
        `${API_URL}/barbers/${barber.id}`,
        { is_available: nextAvailability }
      )

      const dashboardResponse = await axios.get(
        `${API_URL}/admin/dashboard`
      )
      setDashboardData(dashboardResponse.data)

      const barbersResponse = await axios.get(
        `${API_URL}/barbers?page=${barberPage}`
      )
      setBarbers(barbersResponse.data.data)
      setBarberPagination(barbersResponse.data)

      // Keep the booking dropdown's barber availability up to date.
      const allBookingBarbersResponse = await axios.get(
        `${API_URL}/barbers?page=1`
      )
      const allBookingBarbers = [
        ...(allBookingBarbersResponse.data.data ?? []),
      ]
      const lastPage = Number(
        allBookingBarbersResponse.data.last_page ?? 1
      )

      for (let page = 2; page <= lastPage; page += 1) {
        const response = await axios.get(`${API_URL}/barbers?page=${page}`)
        allBookingBarbers.push(...(response.data.data ?? []))
      }

      setBookingBarbers(allBookingBarbers)

      setBarberAvailabilityMessage(
        updateResponse.data.message ||
          `${barber.name} is now ${nextLabel.toLowerCase()}.`
      )
    } catch (err) {
      const validationErrors = err.response?.data?.errors
      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null

      setBarberAvailabilityError(
        firstValidationError ||
          err.response?.data?.message ||
          'Unable to update barber availability. Please try again.'
      )
    } finally {
      setBarberAvailabilityLoadingId(null)
    }
  }

  // Change an appointment status using the authenticated Laravel API.
  async function handleAppointmentStatusChange(appointment, nextStatus) {
    if (!isAdmin) {
      setAppointmentActionError(
        'Only an administrator can change appointment statuses.'
      )
      return
    }

    if (
      appointmentActionLoadingId !== null ||
      barberAvailabilityLoadingId !== null
    ) {
      return
    }

    const actionLabels = {
      confirmed: 'confirm',
      cancelled: 'cancel',
      completed: 'mark as completed',
      no_show: 'mark as no-show',
    }

    const actionLabel = actionLabels[nextStatus]

    if (!actionLabel) {
      setAppointmentActionError('The selected appointment action is invalid.')
      return
    }

    const customerName = appointment.customer?.name || 'this customer'

    const shouldContinue = window.confirm(
      `Are you sure you want to ${actionLabel} the appointment for ${customerName}?`
    )

    if (!shouldContinue) return

    setAppointmentActionLoadingId(appointment.id)
    setAppointmentActionError('')
    setAppointmentActionMessage('')

    try {
      const response = await axios.patch(
        `${API_URL}/appointments/${appointment.id}`,
        { status: nextStatus }
      )

      const dashboardResponse = await axios.get(`${API_URL}/admin/dashboard`)
      setDashboardData(dashboardResponse.data)

      setAppointmentActionMessage(
        response.data.message ||
          `Appointment #${appointment.id} was updated successfully.`
      )
    } catch (err) {
      const validationErrors = err.response?.data?.errors
      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null

      setAppointmentActionError(
        firstValidationError ||
          err.response?.data?.message ||
          'Unable to update the appointment. Please try again.'
      )
    } finally {
      setAppointmentActionLoadingId(null)
    }
  }

  async function handleBooking(event) {
    event.preventDefault()
    setBookingError('')
    setBookingMessage('')

    if (!user || user.role !== 'customer') {
      setBookingError('Please log in with a customer account to book.')
      return
    }

    if (
      !bookingBarberId ||
      !bookingServiceId ||
      !bookingDate ||
      !bookingTime
    ) {
      setBookingError('Please complete all required booking fields.')
      return
    }

    setBookingLoading(true)

    try {
      const response = await axios.post(`${API_URL}/appointments`, {
        barber_id: Number(bookingBarberId),
        service_id: Number(bookingServiceId),
        appointment_date: bookingDate,
        appointment_time: bookingTime,
        notes: bookingNotes.trim() || null,
      })

      setBookingMessage(
        response.data.message || 'Appointment created successfully.'
      )

      setBookingBarberId('')
      setBookingServiceId('')
      setBookingDate('')
      setBookingTime('')
      setBookingNotes('')

      // Refresh the signed-in customer's appointment history.
      setCustomerAppointmentPage(1)
      await refreshCustomerAppointments(1)
    } catch (err) {
      const validationErrors = err.response?.data?.errors
      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null

      setBookingError(
        firstValidationError ||
          err.response?.data?.message ||
          'Unable to create the appointment. Please check your connection and try again.'
      )
    } finally {
      setBookingLoading(false)
    }
  }

  const selectorButtonStyle = (type) => ({
    flex: 1,
    padding: '12px 10px',
    borderRadius: '8px',
    border:
      loginType === type ? '2px solid #276749' : '1px solid #d1d5db',
    backgroundColor: loginType === type ? '#276749' : '#ffffff',
    color: loginType === type ? '#ffffff' : '#222222',
    fontWeight: '700',
    cursor: 'pointer',
  })

  const today = (() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })()

  const summaryCards = [
    ['Total Bookings', dashboardData?.summary?.total_bookings],
    ['Pending', dashboardData?.summary?.pending_bookings],
    ['Confirmed', dashboardData?.summary?.confirmed_bookings],
    ['Completed', dashboardData?.summary?.completed_bookings],
    ['Cancelled', dashboardData?.summary?.cancelled_bookings],
    ['No-Shows', dashboardData?.summary?.no_show_bookings],
  ]

  function getAppointmentActions(appointment) {
    if (appointment.status === 'pending') {
      return [
        { label: 'Confirm', status: 'confirmed' },
        { label: 'Cancel', status: 'cancelled' },
      ]
    }

    if (appointment.status === 'confirmed') {
      return [
        { label: 'Complete', status: 'completed' },
        { label: 'Cancel', status: 'cancelled' },
        { label: 'Mark No-Show', status: 'no_show' },
      ]
    }

    return []
  }

  const actionButtonStyle = {
    padding: '7px 10px',
    margin: '2px 4px 4px 0',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#222222',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  }

  const availabilityButtonStyle = (available) => ({
    ...actionButtonStyle,
    backgroundColor: available ? '#fff7ed' : '#ecfdf5',
    borderColor: available ? '#fdba74' : '#86efac',
    color: available ? '#9a3412' : '#166534',
    cursor: 'pointer',
  })

  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand sidebar-brand"
          href={isAdmin ? '#admin-dashboard' : '#home'}
          onClick={(event) =>
            scrollToSection(isAdmin ? 'admin-dashboard' : 'home', event)
          }
        >
          BARBER<span>BOOK</span>
        </a>

        <p className="sidebar-label">NAVIGATION</p>
        {isAdmin ? (
          <nav className="sidebar-nav" aria-label="Admin navigation">
            <a href="#admin-dashboard" onClick={(event) => scrollToSection('admin-dashboard', event)}>
              <span className="sidebar-icon">▦</span> Dashboard
            </a>
            <a href="#barber-statistics" onClick={(event) => scrollToSection('barber-statistics', event)}>
              <span className="sidebar-icon">✂</span> Barber Statistics
            </a>
            <a href="#recent-appointments" onClick={(event) => scrollToSection('recent-appointments', event)}>
              <span className="sidebar-icon">▤</span> Recent Appointments
            </a>
          </nav>
        ) : (
          <nav className="sidebar-nav" aria-label="Main navigation">
            <a href="#home" onClick={(event) => scrollToSection('home', event)}>
              <span className="sidebar-icon">⌂</span> Home
            </a>
            <a href="#services" onClick={(event) => scrollToSection('services', event)}>
              <span className="sidebar-icon">✂</span> Services
            </a>
            <a href="#barbers" onClick={(event) => scrollToSection('barbers', event)}>
              <span className="sidebar-icon">♙</span> Our Barbers
            </a>
            {isCustomer && (
              <>
                <a href="#customer-notifications" onClick={(event) => scrollToSection('customer-notifications', event)}>
                  <span className="sidebar-icon">♧</span> Notifications
                  {customerNotifications.some((notification) => !notification.read_at) && (
                    <span className="sidebar-count">
                      {customerNotifications.filter((notification) => !notification.read_at).length}
                    </span>
                  )}
                </a>
                <a href="#my-appointments" onClick={(event) => scrollToSection('my-appointments', event)}>
                  <span className="sidebar-icon">▤</span> My Appointments
                </a>
              </>
            )}
            <a href="#booking" onClick={(event) => scrollToSection('booking', event)}>
              <span className="sidebar-icon">＋</span> Booking
            </a>
          </nav>
        )}

        <div className="sidebar-account">
          {user ? (
            <>
              <div className="sidebar-user-avatar" aria-hidden="true">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-details">
                <strong>{user.name}</strong>
                <span>{getRoleLabel(user.role)}</span>
              </div>
              <button className="sidebar-logout" type="button" onClick={handleLogout}>
                <span className="sidebar-icon">↪</span> Logout
              </button>
            </>
          ) : (
            <button className="nav-button sidebar-login" type="button" onClick={() => openLogin(loginType)}>
              {showLogin ? 'Login Open' : 'Login'}
            </button>
          )}
        </div>
      </aside>

      <main>
        {showLogin && !user && (
          <LoginPage
            loginType={loginType}
            setLoginType={(type) => {
              setLoginType(type)
              setLoginError('')
            }}
            selectorButtonStyle={selectorButtonStyle}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            handleLogin={handleLogin}
            loginError={loginError}
            loginLoading={loginLoading}
            loginButtonText={loginButtonText}
          />
        )}

        {loginMessage && (
          <p className="success-message" role="status">
            {loginMessage}
          </p>
        )}

        {/* ADMIN INTERFACE */}
        {isAdmin && (
          <AdminDashboard
            user={user}
            dashboardData={dashboardData}
            dashboardError={dashboardError}
            dashboardLoading={dashboardLoading}
            handleRefreshDashboard={handleRefreshDashboard}
            summaryCards={summaryCards}
            barberAvailabilityError={barberAvailabilityError}
            barberAvailabilityMessage={barberAvailabilityMessage}
            barberAvailabilityLoadingId={barberAvailabilityLoadingId}
            appointmentActionLoadingId={appointmentActionLoadingId}
            handleBarberAvailabilityChange={handleBarberAvailabilityChange}
            appointmentActionError={appointmentActionError}
            appointmentActionMessage={appointmentActionMessage}
            handleAppointmentStatusChange={handleAppointmentStatusChange}
            availabilityButtonStyle={availabilityButtonStyle}
            actionButtonStyle={actionButtonStyle}
            getRoleBadgeStyle={getRoleBadgeStyle}
          />
        )}

        {/* CUSTOMER/PUBLIC INTERFACE */}
        {!isAdmin && (
          <>
            <HomePage
              user={user}
              isCustomer={isCustomer}
              openLogin={openLogin}
              services={services}
              bookingServices={bookingServices}
              servicesLoading={servicesLoading}
              servicePagination={servicePagination}
              setServicePage={setServicePage}
              barbers={barbers}
              barbersLoading={barbersLoading}
              barberPagination={barberPagination}
              setBarberPage={setBarberPage}
              bookingBarbers={bookingBarbers}
              bookingBarberId={bookingBarberId}
              setBookingBarberId={setBookingBarberId}
              bookingServiceId={bookingServiceId}
              setBookingServiceId={setBookingServiceId}
              bookingDate={bookingDate}
              setBookingDate={setBookingDate}
              bookingTime={bookingTime}
              setBookingTime={setBookingTime}
              bookingNotes={bookingNotes}
              setBookingNotes={setBookingNotes}
              bookingError={bookingError}
              bookingMessage={bookingMessage}
              bookingLoading={bookingLoading}
              handleBooking={handleBooking}
              today={today}
              scrollToSection={scrollToSection}
            />
            <MyAppointments
              isCustomer={isCustomer}
              customerNotifications={customerNotifications}
              customerNotificationsLoading={customerNotificationsLoading}
              customerNotificationsError={customerNotificationsError}
              customerNotificationPagination={customerNotificationPagination}
              customerNotificationActionLoadingId={customerNotificationActionLoadingId}
              customerNotificationActionMessage={customerNotificationActionMessage}
              customerNotificationPage={customerNotificationPage}
              setCustomerNotificationPage={setCustomerNotificationPage}
              handleMarkNotificationAsRead={handleMarkNotificationAsRead}
              customerAppointments={customerAppointments}
              customerAppointmentsLoading={customerAppointmentsLoading}
              customerAppointmentsError={customerAppointmentsError}
              customerAppointmentPagination={customerAppointmentPagination}
              customerAppointmentPage={customerAppointmentPage}
              setCustomerAppointmentPage={setCustomerAppointmentPage}
              customerAppointmentActionLoadingId={customerAppointmentActionLoadingId}
              customerAppointmentActionError={customerAppointmentActionError}
              customerAppointmentActionMessage={customerAppointmentActionMessage}
              refreshCustomerAppointments={refreshCustomerAppointments}
              handleCustomerAppointmentCancel={handleCustomerAppointmentCancel}
              handleCustomerAppointmentComplete={handleCustomerAppointmentComplete}
              hasAppointmentTimeArrived={hasAppointmentTimeArrived}
            />
          </>
        )}
        {error && <p className="error-message">{error}</p>}
      </main>

      <footer className="content-footer">
        <p>Barber Shop Booking System · Student Project</p>
      </footer>
    </div>
  )
}

export default App
