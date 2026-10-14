
import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = 'http://127.0.0.1:8000/api'

function App() {
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])

  const [barberPage, setBarberPage] = useState(1)
  const [servicePage, setServicePage] = useState(1)

  const [barberPagination, setBarberPagination] = useState(null)
  const [servicePagination, setServicePagination] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [loginMessage, setLoginMessage] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Load paginated services and barbers.
  useEffect(() => {
    async function loadData() {
      // Show loading messages only during the initial data load.
      const isInitialLoad =
        barberPagination === null && servicePagination === null

      if (isInitialLoad) {
        setLoading(true)
      }

      setError('')

      try {
        const [barberResponse, serviceResponse] = await Promise.all([
          axios.get(`${API_URL}/barbers?page=${barberPage}`),
          axios.get(`${API_URL}/services?page=${servicePage}`),
        ])

        setBarbers(barberResponse.data.data)
        setServices(serviceResponse.data.data)

        setBarberPagination(barberResponse.data)
        setServicePagination(serviceResponse.data)
      } catch {
        setError(
          'Unable to load data. Please check that the Laravel server is running.'
        )
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [barberPage, servicePage, barberPagination, servicePagination])

  // Restore the login session when the page opens.
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

  // Log in.
  async function handleLogin(event) {
    event.preventDefault()
    setLoginError('')
    setLoginMessage('')
    setLoginLoading(true)

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      })

      const token = response.data.token

      localStorage.setItem('barber_token', token)
      axios.defaults.headers.common.Authorization = `Bearer ${token}`

      setUser(response.data.user)
      setPassword('')
      setEmail('')
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
          'Login failed. Please check your email and password.'
      )
    } finally {
      setLoginLoading(false)
    }
  }

  // Log out.
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
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#home">
          BARBER<span>BOOK</span>
        </a>

        <nav>
          <a href="#services">Services</a>
          <a href="#barbers">Our Barbers</a>
          <a href="#booking">Booking</a>
        </nav>

        {user ? (
          <div className="account-actions">
            <span>Hi, {user.name}</span>
            <button className="nav-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <button
            className="nav-button"
            onClick={() => {
              setShowLogin(!showLogin)
              setLoginError('')
              setLoginMessage('')
            }}
          >
            {showLogin ? 'Close Login' : 'Login'}
          </button>
        )}
      </header>

      <main>
        {showLogin && !user && (
          <section className="login-section" id="login">
            <div className="login-card">
              <p className="eyebrow">WELCOME BACK</p>
              <h2>Login to Your Account</h2>
              <p>Sign in to continue to BarberBook.</p>

              <form onSubmit={handleLogin}>
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
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
                  <p className="error-message">{loginError}</p>
                )}

                <button
                  className="primary-button login-submit"
                  type="submit"
                  disabled={loginLoading}
                >
                  {loginLoading ? 'Signing in...' : 'Login'}
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
              Role:{' '}
              {user.role
                ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                : 'Customer'}
            </p>
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
            <a className="primary-button" href="#booking">
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

        {/* Services section */}
        <section className="section" id="services">
          <div className="section-heading">
            <div>
              <p className="eyebrow">WHAT WE OFFER</p>
              <h2>Our Services</h2>
            </div>
            <p>Quality grooming for every style.</p>
          </div>

          {loading ? (
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

        {/* Barbers section */}
        <section className="section barbers-section" id="barbers">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MEET THE TEAM</p>
              <h2>Our Barbers</h2>
            </div>
            <p>Experienced hands. Sharp results.</p>
          </div>

          {loading ? (
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

        {/* Booking section */}
        <section className="booking-banner" id="booking">
          <p className="eyebrow">READY FOR A FRESH LOOK?</p>
          <h2>Your Next Great Haircut Starts Here.</h2>
          <p>Choose from our services and meet our barbers.</p>

          {user ? (
            <p>You are logged in. Appointment booking is our next step.</p>
          ) : (
            <button
              className="primary-button"
              onClick={() => {
                setShowLogin(true)
                setLoginError('')
                setLoginMessage('')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              Login to Continue →
            </button>
          )}
        </section>

        {error && <p className="error-message">{error}</p>}
      </main>

      <footer>
        <a className="brand" href="#home">
          BARBER<span>BOOK</span>
        </a>
        <p>Barber Shop Booking System · Student Project</p>
      </footer>
    </div>
  )
}

export default App
