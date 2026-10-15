
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
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
    return
  }

  const section = document.getElementById(sectionId)

  if (section) {
    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }
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

function App() {
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])

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

  // Appointment booking state.
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

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [])

  // Load barbers.
  useEffect(() => {
    const controller = new AbortController()

    async function loadBarbers() {
      setBarbersLoading(true)
      setError('')

      try {
        const response = await axios.get(
          `${API_URL}/barbers?page=${barberPage}`,
          { signal: controller.signal }
        )

        setBarbers(response.data.data)
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

  // Load services.
  useEffect(() => {
    const controller = new AbortController()

    async function loadServices() {
      setServicesLoading(true)
      setError('')

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

  // Restore the login session.
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

  // Reset stale booking messages when the account changes.
  useEffect(() => {
    setBookingError('')
    setBookingMessage('')
  }, [user?.id])

  function openLogin(type) {
    setLoginType(type)
    setShowLogin(true)
    setLoginError('')
    setLoginMessage('')

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
  }

  async function handleLogin(event) {
    event.preventDefault()
    setLoginError('')
    setLoginMessage('')

    const trimmedEmail = email.trim()

    if (!GMAIL_PATTERN.test(trimmedEmail)) {
      setLoginError('Please enter a valid Gmail address ending in @gmail.com.')
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
      setLoginMessage('You have logged out.')
      setLoginError('')
      setShowLogin(false)
      setPassword('')
    }
  }

  // Submit a new appointment to Laravel.
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

  // Local date for the minimum date input.
  const today = (() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })()

  return (
    <div className="app">
      <header className="navbar">
        <a
          className="brand"
          href="#home"
          onClick={(event) => scrollToSection('home', event)}
        >
          BARBER<span>BOOK</span>
        </a>

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
          <a
            href="#booking"
            onClick={(event) => scrollToSection('booking', event)}
          >
            Booking
          </a>
        </nav>

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

            {user.role === 'admin' && (
              <p>You are logged in with an administrator account.</p>
            )}
            {user.role === 'customer' && (
              <p>You are logged in with a customer account.</p>
            )}
            {!user.role && (
              <p>
                Your account role was not returned by the server. Please check
                the Laravel user record.
              </p>
            )}

            <p>You are successfully logged in.</p>
          </section>
        )}

        {loginMessage && (
          <p className="success-message">{loginMessage}</p>
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
              Find your barber, choose your service, and book your next visit
              with ease.
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
                      {service.description || 'Professional barber service.'}
                    </p>
                    <div className="service-bottom">
                      <strong>₱{Number(service.price).toFixed(2)}</strong>
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
                    <p>{barber.description || 'Professional barber'}</p>

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

          {user?.role === 'admin' && (
            <p>Administrator accounts cannot create customer bookings here.</p>
          )}

          {user?.role === 'customer' && (
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
              <p>Choose a barber, service, date, and available time.</p>

              <form onSubmit={handleBooking} noValidate>
                <label htmlFor="booking-barber">Choose a Barber</label>
                <select
                  id="booking-barber"
                  value={bookingBarberId}
                  onChange={(event) => setBookingBarberId(event.target.value)}
                  required
                >
                  <option value="">Select a barber</option>
                  {barbers
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
                  onChange={(event) => setBookingServiceId(event.target.value)}
                  required
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} — ₱{Number(service.price).toFixed(2)}
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
                  {bookingLoading ? 'Submitting...' : 'Confirm Appointment'}
                </button>
              </form>
            </div>
          )}
        </section>

        {error && <p className="error-message">{error}</p>}
      </main>

      <footer>
        <a
          className="brand"
          href="#home"
          onClick={(event) => scrollToSection('home', event)}
        >
          BARBER<span>BOOK</span>
        </a>
        <p>Barber Shop Booking System · Student Project</p>
      </footer>
    </div>
  )
}

export default App
