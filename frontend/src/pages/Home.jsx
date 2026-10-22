import { Link } from 'react-router-dom'
import BarberPole from '../components/BarberPole'
import { useAuth } from '../context/AuthContext'

const steps = [
  { title: 'Choose a service', text: 'Browse haircuts, fades and grooming with clear prices and durations.' },
  { title: 'Pick your barber', text: 'See who is available and book the barber you trust.' },
  { title: 'Track the request', text: 'The shop confirms your slot and you see every update in your account.' },
]

function Home() {
  const { user } = useAuth()
  const isCustomer = user?.role === 'customer'

  return (
    <div className="home-page">
      {isCustomer && (
        <section className="account-panel" aria-label="Your account">
          <div className="account-panel-info">
            <div className="account-avatar" aria-hidden="true">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="account-name">Welcome back, {user.name}!</h2>
              <p className="account-email">{user.email}</p>
            </div>
          </div>
          <span className="role-badge role-customer">Customer</span>
        </section>
      )}

      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">A fresh cut, on your schedule.</h1>
          <p className="hero-description">
            Choose a service, pick a barber you trust, and request a time that suits you. No calls, no waiting in line.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-md" to="/book">
              Book an appointment
            </Link>
            <Link className="btn btn-secondary btn-md" to="/services">
              See services
            </Link>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <BarberPole />
        </div>
      </section>

      <section className="section how-it-works" aria-labelledby="how-title">
        <div className="section-heading">
          <h2 id="how-title">How it works</h2>
        </div>
        <ol className="steps">
          {steps.map((step) => (
            <li key={step.title} className="step-card">
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="home-footer">
        <div className="home-footer-brand">
          <span className="footer-brand-mark" aria-hidden="true">
            B
          </span>
          <div>
            <strong>BARBERBOOK</strong>
            <span>Your style, your time.</span>
          </div>
        </div>
        <p>© {new Date().getFullYear()} BarberBook. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Home
