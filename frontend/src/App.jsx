import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

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

async function fetchAllBookingBarbers(signal) {
  const firstResponse = await axios.get(`${API_URL}/barbers?page=1`, {
    ...(signal ? { signal } : {}),
  })
  const allBarbers = [...(firstResponse.data.data ?? [])]
  const lastPage = Number(firstResponse.data.last_page ?? 1)
  const pageNumbers = Array.from(
    { length: Math.max(0, lastPage - 1) },
    (_, index) => index + 2
  )
  const responses = await Promise.all(
    pageNumbers.map((page) =>
      axios.get(`${API_URL}/barbers?page=${page}`, {
        ...(signal ? { signal } : {}),
      })
    )
  )

  responses.forEach((response) => {
    allBarbers.push(...(response.data.data ?? []))
  })

  return allBarbers
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [barbers, setBarbers] = useState([])

  // All barber pages for the booking dropdown.
  const [bookingBarbers, setBookingBarbers] = useState([])

  const [services, setServices] = useState([])
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
        const allBarbers = await fetchAllBookingBarbers(controller.signal)

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
            ? { ...item, ...response.data.data, read_at: response.data.data?.read_at ?? new Date().toISOString() }
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
      const allBookingBarbers = await fetchAllBookingBarbers()
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

    if (user?.role !== 'customer') {
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

  let notificationListMode = 'empty'
  if (customerNotificationsLoading && customerNotifications.length === 0) {
    notificationListMode = 'loading'
  } else if (customerNotifications.length > 0) {
    notificationListMode = 'items'
  }

  let appointmentListMode = 'empty'
  if (customerAppointmentsLoading && customerAppointments.length === 0) {
    appointmentListMode = 'loading'
  } else if (customerAppointments.length > 0) {
    appointmentListMode = 'items'
  }

  const summaryCards = [
    ['Total Bookings', dashboardData?.summary?.total_bookings],
    ['Pending', dashboardData?.summary?.pending_bookings],
    ['Confirmed', dashboardData?.summary?.confirmed_bookings],
    ['Completed', dashboardData?.summary?.completed_bookings],
    ['Cancelled', dashboardData?.summary?.cancelled_bookings],
    ['No-Shows', dashboardData?.summary?.no_show_bookings],
  ]

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
      <style>{`
        .app main section[id] { scroll-margin-top: 100px; }
        .app .navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 14px clamp(18px, 4vw, 56px);
          background: rgba(23, 23, 23, 0.97);
          color: #f8f5f0;
          border-bottom: 1px solid rgba(214, 165, 108, 0.28);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
          backdrop-filter: blur(12px);
        }
        .app .navbar .brand {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
          gap: 0;
          color: #fff;
          text-decoration: none;
          font-size: 1.3rem;
          font-weight: 900;
          letter-spacing: 1.5px;
          white-space: nowrap;
        }
        .app .navbar .brand::before {
          content: '✂';
          display: inline-grid;
          place-items: center;
          width: 38px;
          height: 38px;
          margin-right: 10px;
          border-radius: 10px;
          background: #d6a56c;
          color: #171717;
          font-size: 21px;
          letter-spacing: 0;
        }
        .app .navbar .brand span { color: #d6a56c; }
        .app .navbar .navbar-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin: 0 auto;
        }
        .app .navbar .navbar-links a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 10px 11px;
          border-radius: 8px;
          color: #e7e2dc;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          white-space: nowrap;
          transition: color 160ms ease, background 160ms ease;
        }
        .app .navbar .navbar-links a:hover,
        .app .navbar .navbar-links a:focus-visible {
          color: #f2c58e;
          background: rgba(214, 165, 108, 0.12);
          outline: none;
        }
        .app .navbar .notification-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 19px;
          height: 19px;
          padding: 0 5px;
          border-radius: 999px;
          background: #c43d35;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
        }
        .app .navbar .navbar-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 9px;
          flex-shrink: 0;
        }
        .app .navbar .navbar-greeting {
          color: #f0e8df;
          font-size: 0.88rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .app .navbar .nav-button {
          border: 1px solid #d6a56c;
          border-radius: 9px;
          padding: 10px 16px;
          background: #d6a56c;
          color: #171717;
          font-size: 0.88rem;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 160ms ease, background 160ms ease;
        }
        .app .navbar .nav-button:hover {
          background: #e6b982;
          transform: translateY(-1px);
        }
        .app .navbar .nav-button:focus-visible,
        .app .navbar .menu-toggle:focus-visible {
          outline: 2px solid #f2c58e;
          outline-offset: 3px;
        }
        .app .navbar .menu-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border: 1px solid rgba(214, 165, 108, 0.55);
          border-radius: 9px;
          background: transparent;
          color: #f8f5f0;
          font-size: 23px;
          cursor: pointer;
        }
        @media (max-width: 1080px) {
          .app .navbar { gap: 14px; }
          .app .navbar .navbar-links { gap: 0; }
          .app .navbar .navbar-links a { padding: 9px 8px; font-size: 0.84rem; }
          .app .navbar .navbar-greeting { display: none; }
        }
        @media (max-width: 820px) {
          .app .navbar { flex-wrap: wrap; gap: 12px; padding: 12px 18px; }
          .app .navbar .brand { font-size: 1.12rem; }
          .app .navbar .brand::before { width: 34px; height: 34px; margin-right: 8px; }
          .app .navbar .menu-toggle { display: inline-flex; margin-left: auto; }
          .app .navbar .navbar-links {
            display: none;
            order: 3;
            flex: 0 0 100%;
            flex-direction: column;
            align-items: stretch;
            gap: 4px;
            width: 100%;
            margin: 0;
            padding: 8px 0 2px;
            border-top: 1px solid rgba(214, 165, 108, 0.2);
          }
          .app .navbar .navbar-links.is-open { display: flex; }
          .app .navbar .navbar-links a {
            justify-content: flex-start;
            width: 100%;
            padding: 12px 13px;
            font-size: 0.95rem;
          }
          .app .navbar .navbar-actions {
            display: none;
            order: 4;
            flex: 0 0 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
            padding: 10px 0 3px;
            border-top: 1px solid rgba(214, 165, 108, 0.2);
          }
          .app .navbar .navbar-actions.is-open { display: flex; }
          .app .navbar .navbar-greeting { display: inline; }
        }
        @media (prefers-reduced-motion: reduce) {
          .app .navbar * { transition: none !important; }
        }
      `}</style>
      <header className="navbar">
        <a
          className="brand"
          href={isAdmin ? '#admin-dashboard' : '#home'}
          onClick={(event) => {
            scrollToSection(isAdmin ? 'admin-dashboard' : 'home', event)
            setMobileMenuOpen(false)
          }}
          aria-label="BarberBook home"
        >
          BARBER<span>BOOK</span>
        </a>

        {isAdmin ? (
          <nav className={`navbar-links ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Administrator navigation">
            <a href="#admin-dashboard" onClick={(event) => { scrollToSection('admin-dashboard', event); setMobileMenuOpen(false) }}>Dashboard</a>
            <a href="#barber-statistics" onClick={(event) => { scrollToSection('barber-statistics', event); setMobileMenuOpen(false) }}>Barber Statistics</a>
            <a href="#recent-appointments" onClick={(event) => { scrollToSection('recent-appointments', event); setMobileMenuOpen(false) }}>Recent Appointments</a>
          </nav>
        ) : (
          <nav className={`navbar-links ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            {!isCustomer && <a href="#home" onClick={(event) => { scrollToSection('home', event); setMobileMenuOpen(false) }}>Home</a>}
            <a href="#services" onClick={(event) => { scrollToSection('services', event); setMobileMenuOpen(false) }}>Services</a>
            <a href="#barbers" onClick={(event) => { scrollToSection('barbers', event); setMobileMenuOpen(false) }}>Our Barbers</a>
            {isCustomer && (
              <>
                <a href="#customer-notifications" onClick={(event) => { scrollToSection('customer-notifications', event); setMobileMenuOpen(false) }}>
                  Notifications
                  {customerNotifications.some((notification) => !notification.read_at) && (
                    <span className="notification-count" aria-label={`${customerNotifications.filter((notification) => !notification.read_at).length} unread notifications`}>
                      {customerNotifications.filter((notification) => !notification.read_at).length}
                    </span>
                  )}
                </a>
                <a href="#my-appointments" onClick={(event) => { scrollToSection('my-appointments', event); setMobileMenuOpen(false) }}>My Appointments</a>
              </>
            )}
            <a className="book-nav-link" href="#booking" onClick={(event) => { scrollToSection('booking', event); setMobileMenuOpen(false) }}>Booking</a>
          </nav>
        )}

        <button
          type="button"
          className="menu-toggle"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? '×' : '☰'}
        </button>

        {user ? (
          <div className={`navbar-actions account-actions ${mobileMenuOpen ? 'is-open' : ''}`}>
            <span className="navbar-greeting">Hi, {user.name}</span>
            <span style={getRoleBadgeStyle(user.role)}>{getRoleLabel(user.role)}</span>
            <button className="nav-button" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div className={`navbar-actions ${mobileMenuOpen ? 'is-open' : ''}`}>
            <button className="nav-button" onClick={() => { openLogin(loginType); setMobileMenuOpen(false) }}>
              {showLogin ? 'Login Open' : 'Login'}
            </button>
          </div>
        )}
      </header>

      <main>
        {showLogin && !user && (
          <section className="login-section" id="login">
            <div className="login-card">
              <p className="eyebrow">WELCOME BACK</p>
              <h2>Login to BarberBook</h2>
              <p>Choose your account type to continue.</p>

              <fieldset
                aria-label="Choose login type"
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '20px',
                  marginBottom: '24px',
                  padding: 0,
                  border: 'none',
                  minWidth: 0,
                }}
              >
                <button
                  type="button"
                  style={selectorButtonStyle('admin')}
                  aria-pressed={loginType === 'admin'}
                  onClick={() => {
                    setLoginType('admin')
                    setLoginError('')
                  }}
                >
                  Admin Login
                </button>

                <button
                  type="button"
                  style={selectorButtonStyle('customer')}
                  aria-pressed={loginType === 'customer'}
                  onClick={() => {
                    setLoginType('customer')
                    setLoginError('')
                  }}
                >
                  Customer Login
                </button>
              </fieldset>

              <p style={{ marginBottom: '16px' }}>
                Selected:{' '}
                <strong>
                  {loginType === 'admin' ? 'Administrator' : 'Customer'}
                </strong>
              </p>

              <form onSubmit={handleLogin} noValidate>
                <label htmlFor="login-email">Gmail Address</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your Gmail address"
                  autoComplete="username"
                  required
                />

                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                {loginError && (
                  <p className="error-message" role="alert">
                    {loginError}
                  </p>
                )}

                <button
                  className="primary-button login-submit"
                  type="submit"
                  disabled={loginLoading}
                >
                  {loginLoading ? 'Signing in...' : loginButtonText}
                </button>
              </form>
            </div>
          </section>
        )}

        {loginMessage && (
          <output className="success-message" style={{ display: 'block' }}>
            {loginMessage}
          </output>
        )}

        {/* ADMIN INTERFACE */}
        {isAdmin && (
          <>
            <section className="admin-welcome">
              <p className="eyebrow">ADMINISTRATION</p>
              <h1>Administrator Dashboard</h1>
              <p>
                Welcome, {user.name}. Review booking statistics and recent
                appointments from this page.
              </p>
              <span style={getRoleBadgeStyle(user.role)}>ADMINISTRATOR</span>
            </section>

            <section className="section admin-dashboard" id="admin-dashboard">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">OVERVIEW</p>
                  <h2>Booking Summary</h2>
                </div>

                <button
                  className="nav-button"
                  type="button"
                  onClick={handleRefreshDashboard}
                  disabled={dashboardLoading}
                >
                  {dashboardLoading ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>

              {dashboardError && (
                <p className="error-message" role="alert">
                  {dashboardError}
                </p>
              )}

              {dashboardLoading && !dashboardData && (
                <p>Loading dashboard data...</p>
              )}

              {!dashboardLoading && !dashboardData && !dashboardError && (
                <p>Dashboard data is not available yet.</p>
              )}

              {dashboardData && (
                <div className="dashboard-summary-grid">
                  {summaryCards.map(([label, value]) => (
                    <article className="dashboard-stat-card" key={label}>
                      <p>{label}</p>
                      <h3>{value ?? 0}</h3>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {dashboardData && (
              <>
                <section
                  className="section admin-table-section"
                  id="barber-statistics"
                >
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">TEAM PERFORMANCE</p>
                      <h2>Bookings by Barber</h2>
                    </div>
                  </div>

                  {barberAvailabilityError && (
                    <p className="error-message" role="alert">
                      {barberAvailabilityError}
                    </p>
                  )}

                  {barberAvailabilityMessage && (
                    <output className="success-message" style={{ display: 'block' }}>
                      {barberAvailabilityMessage}
                    </output>
                  )}

                  {dashboardData.bookings_by_barber?.length ? (
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Barber</th>
                            <th>Total Bookings</th>
                            <th>Availability</th>
                            <th>Manage Availability</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.bookings_by_barber.map((barber) => {
                            const isAvailable = Boolean(barber.is_available)
                            const isUpdating =
                              barberAvailabilityLoadingId === barber.id
                            let availabilityActionLabel = isAvailable
                              ? 'Mark Unavailable'
                              : 'Mark Available'
                            if (isUpdating) {
                              availabilityActionLabel = 'Updating...'
                            }

                            return (
                              <tr key={barber.id}>
                                <td>{barber.name}</td>
                                <td>{barber.appointments_count ?? 0}</td>
                                <td>
                                  <span
                                    className={
                                      isAvailable
                                        ? 'status available'
                                        : 'status unavailable'
                                    }
                                  >
                                    {isAvailable
                                      ? 'Available'
                                      : 'Unavailable'}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    style={availabilityButtonStyle(isAvailable)}
                                    disabled={
                                      barberAvailabilityLoadingId !== null ||
                                      appointmentActionLoadingId !== null ||
                                      dashboardLoading
                                    }
                                    onClick={() =>
                                      handleBarberAvailabilityChange(barber)
                                    }
                                  >
                                    {availabilityActionLabel}
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p>No barber booking data available.</p>
                  )}
                </section>

                <section
                  className="section admin-table-section"
                  id="recent-appointments"
                >
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">LATEST ACTIVITY</p>
                      <h2>Recent Appointments</h2>
                    </div>
                  </div>

                  {appointmentActionError && (
                    <p className="error-message" role="alert">
                      {appointmentActionError}
                    </p>
                  )}

                  {appointmentActionMessage && (
                    <output className="success-message" style={{ display: 'block' }}>
                      {appointmentActionMessage}
                    </output>
                  )}

                  {dashboardData.recent_appointments?.length ? (
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>Barber</th>
                            <th>Service</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Admin Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.recent_appointments.map(
                            (appointment) => {
                              const actions =
                                getAppointmentActions(appointment)
                              const isUpdating =
                                appointmentActionLoadingId === appointment.id

                              return (
                                <tr key={appointment.id}>
                                  <td>
                                    {appointment.customer?.name || 'Unknown'}
                                  </td>
                                  <td>
                                    {appointment.customer?.email || '—'}
                                  </td>
                                  <td>
                                    {appointment.barber?.name || '—'}
                                  </td>
                                  <td>
                                    {appointment.service?.name || '—'}
                                  </td>
                                  <td>
                                    {formatAppointmentDate(
                                      appointment.appointment_date
                                    )}
                                  </td>
                                  <td>
                                    {formatAppointmentTime(
                                      appointment.appointment_time
                                    )}
                                  </td>
                                  <td>
                                    <span className="appointment-status">
                                      {formatStatus(appointment.status)}
                                    </span>
                                  </td>
                                  <td>
                                    {actions.length > 0 ? (
                                      <div style={{ minWidth: '180px' }}>
                                        {actions.map((action) => (
                                          <button
                                            key={action.status}
                                            type="button"
                                            style={actionButtonStyle}
                                            disabled={
                                              appointmentActionLoadingId !==
                                                null ||
                                              barberAvailabilityLoadingId !==
                                                null ||
                                              dashboardLoading
                                            }
                                            onClick={() =>
                                              handleAppointmentStatusChange(
                                                appointment,
                                                action.status
                                              )
                                            }
                                          >
                                            {isUpdating
                                              ? 'Updating...'
                                              : action.label}
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <span
                                        style={{
                                          color: '#6b7280',
                                          fontSize: '12px',
                                                                                  }}
                                      >
                                        No actions available
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p>No appointments have been recorded yet.</p>
                  )}
                </section>
              </>
            )}
          </>
        )}

        {/* CUSTOMER/PUBLIC INTERFACE */}
        {!isAdmin && (
          <>
            {user && (
              <section className="account-panel">
                <p className="eyebrow">YOUR ACCOUNT</p>
                <h2>Welcome, {user.name}!</h2>
                <p>Email: {user.email}</p>
                <p>
                  Account type:{' '}
                  <span style={getRoleBadgeStyle(user.role)}>
                    {getRoleLabel(user.role)}
                  </span>
                </p>
                <p>You are successfully logged in.</p>
              </section>
            )}

            <section className="hero" id="home">
              <div className="hero-content">
                <p className="eyebrow">YOUR STYLE, OUR CRAFT</p>
                <h1>
                  A Fresh Cut.
                  <br />
                  <span>A Better You.</span>
                </h1>
                <p className="hero-description">
                  Find your barber, choose your service, and book your next
                  visit with ease.
                </p>
                <a
                  className="primary-button"
                  href="#booking"
                  onClick={(event) => scrollToSection('booking', event)}
                >
                  Book an Appointment →
                </a>
              </div>

              <div className="hero-art" aria-label="Barber shop illustration">
                <div className="pole">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="art-circle">
                  <div className="scissors">✂</div>
                  <div className="comb">▤</div>
                  <p>
                    CLASSIC CUTS
                    <br />
                    MODERN STYLE
                  </p>
                </div>
              </div>
            </section>

            <section className="section" id="services">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">WHAT WE OFFER</p>
                  <h2>Our Services</h2>
                </div>
                <p>Quality grooming for every style.</p>
              </div>

              {servicesLoading && services.length === 0 ? (
                <p>Loading services...</p>
              ) : (
                <>
                  <div className="service-grid">
                    {services.map((service) => (
                      <article className="service-card" key={service.id}>
                        <div className="service-icon">✂</div>
                        <h3>{service.name}</h3>
                        <p>
                          {service.description ||
                            'Professional barber service.'}
                        </p>
                        <div className="service-bottom">
                          <strong>
                            ₱{Number(service.price).toFixed(2)}
                          </strong>
                          <span>{service.duration_minutes} min</span>
                        </div>
                      </article>
                    ))}
                  </div>

                  {servicePagination && (
                    <div className="pagination-controls">
                      <button
                        onClick={() =>
                          setServicePage((page) => Math.max(1, page - 1))
                        }
                        disabled={servicePagination.current_page <= 1}
                      >
                        Previous
                      </button>
                      <span>
                        Page {servicePagination.current_page} of{' '}
                        {servicePagination.last_page}
                      </span>
                      <button
                        onClick={() =>
                          setServicePage((page) =>
                            Math.min(servicePagination.last_page, page + 1)
                          )
                        }
                        disabled={
                          servicePagination.current_page >=
                          servicePagination.last_page
                        }
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="section barbers-section" id="barbers">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">MEET THE TEAM</p>
                  <h2>Our Barbers</h2>
                </div>
                <p>Experienced hands. Sharp results.</p>
              </div>

              {barbersLoading && barbers.length === 0 ? (
                <p>Loading barbers...</p>
              ) : (
                <>
                  <div className="barber-grid">
                    {barbers.map((barber) => (
                      <article className="barber-card" key={barber.id}>
                        <div className="barber-avatar">
                          {barber.name.charAt(0)}
                        </div>
                        <h3>{barber.name}</h3>
                        <p>
                          {barber.description || 'Professional barber'}
                        </p>
                        <span
                          className={
                            barber.is_available
                              ? 'status available'
                              : 'status unavailable'
                          }
                        >
                          {barber.is_available
                            ? 'Available'
                            : 'Currently unavailable'}
                        </span>
                      </article>
                    ))}
                  </div>

                  {barberPagination && (
                    <div className="pagination-controls">
                      <button
                        onClick={() =>
                          setBarberPage((page) => Math.max(1, page - 1))
                        }
                        disabled={barberPagination.current_page <= 1}
                      >
                        Previous
                      </button>
                      <span>
                        Page {barberPagination.current_page} of{' '}
                        {barberPagination.last_page}
                      </span>
                      <button
                        onClick={() =>
                          setBarberPage((page) =>
                            Math.min(barberPagination.last_page, page + 1)
                          )
                        }
                        disabled={
                          barberPagination.current_page >=
                          barberPagination.last_page
                        }
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Customer-only persistent notifications. */}
            {isCustomer && (
              <section
                className="section admin-table-section"
                id="customer-notifications"
              >
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">ACCOUNT UPDATES</p>
                    <h2>Notifications</h2>
                    <p>
                      Important updates about your appointments appear here and remain available after you log out.
                    </p>
                  </div>
                  <button
                    className="nav-button"
                    type="button"
                    onClick={() => refreshCustomerNotifications()}
                    disabled={customerNotificationsLoading}
                  >
                    {customerNotificationsLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {customerNotificationsError && (
                  <p className="error-message" role="alert">
                    {customerNotificationsError}
                  </p>
                )}

                {customerNotificationActionMessage && (
                  <output className="success-message" style={{ display: 'block' }}>
                    {customerNotificationActionMessage}
                  </output>
                )}

                {notificationListMode === 'loading' && (
                  <p>Loading your notifications...</p>
                )}
                {notificationListMode === 'items' && (
                  <>
                    <div style={{ display: 'grid', gap: '14px' }}>
                      {customerNotifications.map((notification) => {
                        const appointment = notification.appointment
                        const isMarkingRead = customerNotificationActionLoadingId === notification.id

                        return (
                          <article
                            key={notification.id}
                            style={{
                              padding: '18px',
                              border: notification.read_at ? '1px solid #e5e7eb' : '1px solid #f59e0b',
                              borderLeft: notification.read_at ? '4px solid #9ca3af' : '4px solid #d97706',
                              borderRadius: '8px',
                              backgroundColor: notification.read_at ? '#ffffff' : '#fffbeb',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                              <div>
                                <h3 style={{ margin: '0 0 8px' }}>{notification.title}</h3>
                                <p style={{ margin: '0 0 10px', lineHeight: 1.6 }}>{notification.message}</p>
                                {appointment && (
                                  <p style={{ margin: '0', color: '#4b5563', fontSize: '13px' }}>
                                    Appointment: {appointment.service?.name || 'Service'} with {appointment.barber?.name || 'barber'} on {formatAppointmentDate(appointment.appointment_date)} at {formatAppointmentTime(appointment.appointment_time)}. Current status: {formatStatus(appointment.status)}.
                                  </p>
                                )}
                              </div>
                              <span
                                style={{
                                  flexShrink: 0,
                                  padding: '4px 8px',
                                  borderRadius: '999px',
                                  backgroundColor: notification.read_at ? '#e5e7eb' : '#fef3c7',
                                  color: notification.read_at ? '#374151' : '#92400e',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                }}
                              >
                                {notification.read_at ? 'Read' : 'Unread'}
                              </span>
                            </div>
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                              <span style={{ color: '#6b7280', fontSize: '12px' }}>
                                {notification.created_at ? new Date(notification.created_at).toLocaleString('en-PH') : ''}
                              </span>
                              {!notification.read_at && (
                                <button
                                  type="button"
                                  style={{
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    backgroundColor: '#ffffff',
                                    color: '#1f2937',
                                    cursor: 'pointer',
                                  }}
                                  disabled={customerNotificationActionLoadingId !== null}
                                  onClick={() => handleMarkNotificationAsRead(notification)}
                                >
                                  {isMarkingRead ? 'Marking...' : 'Mark as Read'}
                                </button>
                              )}
                            </div>
                          </article>
                        )
                      })}
                    </div>

                    {customerNotificationPagination && (
                      <div className="pagination-controls">
                        <button
                          type="button"
                          onClick={() => setCustomerNotificationPage((page) => Math.max(1, page - 1))}
                          disabled={customerNotificationPagination.current_page <= 1 || customerNotificationsLoading}
                        >
                          Previous
                        </button>
                        <span>
                          Page {customerNotificationPagination.current_page} of {customerNotificationPagination.last_page}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCustomerNotificationPage((page) => Math.min(customerNotificationPagination.last_page, page + 1))}
                          disabled={customerNotificationPagination.current_page >= customerNotificationPagination.last_page || customerNotificationsLoading}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
                {notificationListMode === 'empty' && (
                  <p>You have no notifications right now. If an administrator marks one of your confirmed appointments as No Show, the notice will appear here.</p>
                )}
              </section>
            )}

            {/* Customer-only appointment history. */}
            {isCustomer && (
              <section
                className="section admin-table-section"
                id="my-appointments"
              >
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">YOUR BOOKINGS</p>
                    <h2>My Appointments</h2>
                    <p>
                      Review your bookings and check their current status.
                    </p>
                  </div>

                  <button
                    className="nav-button"
                    type="button"
                    onClick={() => refreshCustomerAppointments()}
                    disabled={customerAppointmentsLoading}
                  >
                    {customerAppointmentsLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {customerAppointmentsError && (
                  <p className="error-message" role="alert">
                    {customerAppointmentsError}
                  </p>
                )}

                {customerAppointmentActionError && (
                  <p className="error-message" role="alert">
                    {customerAppointmentActionError}
                  </p>
                )}

                {customerAppointmentActionMessage && (
                  <output className="success-message" style={{ display: 'block' }}>
                    {customerAppointmentActionMessage}
                  </output>
                )}

                {appointmentListMode === 'loading' && (
                  <p>Loading your appointments...</p>
                )}
                {appointmentListMode === 'items' && (
                  <>
                                      <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Barber</th>
                            <th>Service</th>
                            <th>Price</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerAppointments.map((appointment) => {
                            const canCancel = appointment.status === 'pending'

                            const isAppointmentActionLoading =
                              customerAppointmentActionLoadingId ===
                              appointment.id

                            const barberUnavailable =
                              appointment.barber?.is_available === false

                            return (
                              <tr key={appointment.id}>
                                <td>
                                  <div>{appointment.barber?.name || '—'}</div>

                                  {barberUnavailable && (
                                    <div
                                      role="status"
                                      style={{
                                        marginTop: '8px',
                                        padding: '10px',
                                        border: '1px solid #f59e0b',
                                        borderRadius: '6px',
                                        backgroundColor: '#fffbeb',
                                        color: '#92400e',
                                        fontSize: '12px',
                                        lineHeight: 1.5,
                                        minWidth: '220px',
                                        whiteSpace: 'normal',
                                      }}
                                    >
                                      <strong>
                                        Barber Availability Notice
                                      </strong>
                                      <p style={{ margin: '5px 0 0' }}>
                                        {appointment.barber?.name ||
                                          'Your barber'}{' '}
                                        is currently unavailable. Your
                                        appointment remains recorded as{' '}
                                        {formatStatus(appointment.status)}.
                                        Please contact the shop to confirm
                                        whether your appointment will proceed
                                        or needs to be rescheduled.
                                      </p>
                                    </div>
                                  )}
                                </td>
                                <td>{appointment.service?.name || '—'}</td>
                                <td>
                                  {appointment.service?.price != null
                                    ? `₱${Number(
                                        appointment.service.price
                                      ).toFixed(2)}`
                                    : '—'}
                                </td>
                                <td>
                                  {formatAppointmentDate(
                                    appointment.appointment_date
                                  )}
                                </td>
                                <td>
                                  {formatAppointmentTime(
                                    appointment.appointment_time
                                  )}
                                </td>
                                <td>
                                  <span className="appointment-status">
                                    {formatStatus(appointment.status)}
                                  </span>
                                </td>
                                <td>
                                  {canCancel && (
                                    <button
                                      type="button"
                                      style={actionButtonStyle}
                                      disabled={
                                        customerAppointmentActionLoadingId !==
                                        null
                                      }
                                      onClick={() =>
                                        handleCustomerAppointmentCancel(
                                          appointment
                                        )
                                      }
                                    >
                                      {isAppointmentActionLoading
                                        ? 'Cancelling...'
                                        : 'Cancel Appointment'}
                                    </button>
                                  )}


                                  {!canCancel && (
                                    <span
                                      style={{
                                        color: '#6b7280',
                                        fontSize: '12px',
                                      }}
                                    >
                                      No actions available
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {customerAppointmentPagination && (
                      <div className="pagination-controls">
                        <button
                          type="button"
                          onClick={() =>
                            setCustomerAppointmentPage((page) =>
                              Math.max(1, page - 1)
                            )
                          }
                          disabled={
                            customerAppointmentPagination.current_page <= 1 ||
                            customerAppointmentsLoading
                          }
                        >
                          Previous
                        </button>
                        <span>
                          Page {customerAppointmentPagination.current_page} of{' '}
                          {customerAppointmentPagination.last_page}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCustomerAppointmentPage((page) =>
                              Math.min(
                                customerAppointmentPagination.last_page,
                                page + 1
                              )
                            )
                          }
                          disabled={
                            customerAppointmentPagination.current_page >=
                              customerAppointmentPagination.last_page ||
                            customerAppointmentsLoading
                          }
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
                {appointmentListMode === 'empty' && (
                  <p>
                    You have no appointments yet. Book an appointment above
                    and it will appear here.
                  </p>
                )}
              </section>
            )}

            <section className="booking-banner" id="booking">
              <p className="eyebrow">READY FOR A FRESH LOOK?</p>
              <h2>Your Next Great Haircut Starts Here.</h2>
              <p>Choose from our services and meet our barbers.</p>

              {!user && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '12px',
                  }}
                >
                  <button
                    className="primary-button"
                    onClick={() => openLogin('customer')}
                  >
                    Customer Login →
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => openLogin('admin')}
                  >
                    Admin Login →
                  </button>
                </div>
              )}

              {isCustomer && (
                <div
                  className="login-card"
                  style={{
                    maxWidth: '560px',
                    width: '100%',
                    margin: '24px auto 0',
                    textAlign: 'left',
                  }}
                >
                  <h3>Book an Appointment</h3>
                  <p>Choose a barber, service, date, and time.</p>

                  <form onSubmit={handleBooking} noValidate>
                    <label htmlFor="booking-barber">Choose a Barber</label>
                    <select
                      id="booking-barber"
                      value={bookingBarberId}
                      onChange={(event) =>
                        setBookingBarberId(event.target.value)
                      }
                      required
                    >
                      <option value="">Select a barber</option>
                      {bookingBarbers
                        .filter((barber) => barber.is_available)
                        .map((barber) => (
                          <option key={barber.id} value={barber.id}>
                            {barber.name}
                          </option>
                        ))}
                    </select>

                    <label htmlFor="booking-service">Choose a Service</label>
                    <select
                      id="booking-service"
                      value={bookingServiceId}
                      onChange={(event) =>
                        setBookingServiceId(event.target.value)
                      }
                      required
                    >
                      <option value="">Select a service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} — ₱
                          {Number(service.price).toFixed(2)}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="booking-date">Appointment Date</label>
                    <input
                      id="booking-date"
                      type="date"
                      min={today}
                      value={bookingDate}
                      onChange={(event) => setBookingDate(event.target.value)}
                      required
                    />

                    <label htmlFor="booking-time">Appointment Time</label>
                    <input
                      id="booking-time"
                      type="time"
                      value={bookingTime}
                      onChange={(event) => setBookingTime(event.target.value)}
                      required
                    />

                    <label htmlFor="booking-notes">Notes (Optional)</label>
                    <textarea
                      id="booking-notes"
                      value={bookingNotes}
                      onChange={(event) => setBookingNotes(event.target.value)}
                      maxLength={1000}
                      rows={3}
                      placeholder="Any special requests?"
                    />

                    {bookingError && (
                      <p className="error-message" role="alert">
                        {bookingError}
                      </p>
                    )}
                    {bookingMessage && (
                      <output className="success-message" style={{ display: 'block' }}>
                        {bookingMessage}
                      </output>
                    )}

                    <button
                      className="primary-button login-submit"
                      type="submit"
                      disabled={bookingLoading}
                    >
                      {bookingLoading
                        ? 'Submitting...'
                        : 'Confirm Appointment'}
                    </button>
                  </form>
                </div>
              )}
            </section>
          </>
        )}

        {error && <p className="error-message">{error}</p>}
      </main>

      <footer>
        <a
          className="brand"
          href={isAdmin ? '#admin-dashboard' : '#home'}
          onClick={(event) =>
            scrollToSection(isAdmin ? 'admin-dashboard' : 'home', event)
          }
        >
          BARBER<span>BOOK</span>
        </a>
        <p>Barber Shop Booking System · Student Project</p>
      </footer>
    </div>
  )
}

export default App