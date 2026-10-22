import { Link } from 'react-router-dom'
import BarberPole from './BarberPole'

/** Split-screen frame shared by the Login and Register pages. */
function AuthLayout({ children }) {
  return (
    <div className="app login-app">
      <section className="login-layout">
        <aside className="login-aside">
          <Link to="/" className="login-back">
            <span aria-hidden="true">←</span> Back to BarberBook
          </Link>

          <div className="login-aside-body">
            <BarberPole className="login-pole" />
            <div>
              <p className="login-brand">
                BARBER<span>BOOK</span>
              </p>
              <p className="login-aside-copy">
                Pick a barber, pick a service, pick a time. BarberBook keeps every booking and update in one place.
              </p>
            </div>
          </div>
        </aside>

        <div className="login-panel">
          <div className="login-card">{children}</div>
        </div>
      </section>
    </div>
  )
}

export default AuthLayout
