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
      <header className="navbar">
        <a
          className="brand"
          href={isAdmin ? '#admin-dashboard' : '#home'}
          onClick={(event) =>
            scrollToSection(isAdmin ? 'admin-dashboard' : 'home', event)
          }
        >
          BARBER<span>BOOK</span>
        </a>

        {isAdmin ? (
          <nav>
            <a
              href="#admin-dashboard"
              onClick={(event) => scrollToSection('admin-dashboard', event)}
            >
              Dashboard
            </a>
            <a
              href="#barber-statistics"
              onClick={(event) => scrollToSection('barber-statistics', event)}
            >
              Barber Statistics
            </a>
            <a
              href="#recent-appointments"
              onClick={(event) =>
                scrollToSection('recent-appointments', event)
              }
            >
              Recent Appointments
            </a>
          </nav>
        ) : (
          <nav>
            <a
              href="#services"
              onClick={(event) => scrollToSection('services', event)}
            >
              Services
            </a>
            <a
              href="#barbers"
              onClick={(event) => scrollToSection('barbers', event)}
            >
              Our Barbers
            </a>
            {isCustomer && (
              <a
                href="#my-appointments"
                onClick={(event) =>
                  scrollToSection('my-appointments', event)
                }
              >
                My Appointments
              </a>
            )}
            <a
              href="#booking"
              onClick={(event) => scrollToSection('booking', event)}
            >
              Booking
            </a>
          </nav>
        )}

        {user ? (
          <div className="account-actions">
            <span>Hi, {user.name}</span>
            <span style={getRoleBadgeStyle(user.role)}>
              {getRoleLabel(user.role)}
            </span>
            <button className="nav-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <button
            className="nav-button"
            onClick={() => openLogin(loginType)}
          >
            {showLogin ? 'Login Open' : 'Login'}
          </button>
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
          <p className="success-message" role="status">
            {loginMessage}
          </p>
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
                    <p className="success-message" role="status">
                      {barberAvailabilityMessage}
                    </p>
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
                                    {isUpdating
                                      ? 'Updating...'
                                      : isAvailable
                                        ? 'Mark Unavailable'
                                        : 'Mark Available'}
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
                    <p className="success-message" role="status">
                      {appointmentActionMessage}
                    </p>
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
                  <p className="success-message" role="status">
                    {customerAppointmentActionMessage}
                  </p>
                )}

                {customerAppointmentsLoading &&
                customerAppointments.length === 0 ? (
                  <p>Loading your appointments...</p>
                ) : customerAppointments.length > 0 ? (
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

                            const canMarkDone =
                              appointment.status === 'confirmed' &&
                              hasAppointmentTimeArrived(
                                appointment.appointment_date,
                                appointment.appointment_time
                              )

                            const isCancelling =
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
                                      {isCancelling
                                        ? 'Cancelling...'
                                        : 'Cancel Appointment'}
                                    </button>
                                  )}

                                  {canMarkDone && (
                                    <button
                                      type="button"
                                      style={{
                                        ...actionButtonStyle,
                                        backgroundColor: '#ecfdf5',
                                        borderColor: '#86efac',
                                        color: '#166534',
                                      }}
                                      disabled={
                                        customerAppointmentActionLoadingId !==
                                        null
                                      }
                                      onClick={() =>
                                        handleCustomerAppointmentComplete(
                                          appointment
                                        )
                                      }
                                    >
                                      {isCancelling
                                        ? 'Completing...'
                                        : 'Mark as Done'}
                                    </button>
                                  )}

                                  {!canCancel && !canMarkDone && (
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
                ) : (
                  !customerAppointmentsLoading && (
                    <p>
                      You have no appointments yet. Book an appointment above
                      and it will appear here.
                    </p>
                  )
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
                      <p className="success-message" role="status">
                        {bookingMessage}
                      </p>
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
