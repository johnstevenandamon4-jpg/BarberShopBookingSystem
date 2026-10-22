import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { NOTIFICATIONS_CHANGED_EVENT } from '../services/api'
import { notificationApi } from '../services/notificationApi'
import LoadingState from './LoadingState'

const guestLinks = [
  { to: '/', label: 'Home', icon: '⌂', end: true },
  { to: '/services', label: 'Services', icon: '✂' },
  { to: '/barbers', label: 'Our Barbers', icon: '♙' },
]

const customerLinks = [
  ...guestLinks,
  { to: '/book', label: 'Book', icon: '＋' },
  { to: '/notifications', label: 'Notifications', icon: '♧', badge: true },
  { to: '/my-appointments', label: 'My Appointments', icon: '▤' },
]

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: '▦', end: true },
  { to: '/admin/appointments', label: 'Appointments', icon: '▤' },
  { to: '/admin/barbers', label: 'Barbers', icon: '♙' },
  { to: '/admin/services', label: 'Services', icon: '✂' },
]

/** App shell: sidebar navigation (per role) + the current page. */
function Layout() {
  const { user, initializing, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsVersion, setNotificationsVersion] = useState(0)

  const isAdmin = user?.role === 'admin'
  const isCustomer = user?.role === 'customer'
  const links = isAdmin ? adminLinks : isCustomer ? customerLinks : guestLinks

  // Unread badge: refreshed on every page change and when a notification is read.
  useEffect(() => {
    const refresh = () => setNotificationsVersion((value) => value + 1)
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh)
  }, [])

  useEffect(() => {
    if (!isCustomer) {
      setUnreadCount(0)
      return undefined
    }

    let cancelled = false
    notificationApi
      .list({ page: 1 })
      .then((response) => {
        if (!cancelled) setUnreadCount((response.data ?? []).filter((item) => !item.read_at).length)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [isCustomer, location.pathname, notificationsVersion])

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  if (initializing) {
    return (
      <div className="app app-splash">
        <LoadingState label="Restoring your session..." />
      </div>
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <Link className="brand sidebar-brand" to={isAdmin ? '/admin' : '/'}>
          BARBER<span>BOOK</span>
        </Link>

        <nav className="sidebar-nav" aria-label={isAdmin ? 'Admin navigation' : 'Main navigation'}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              <span className="sidebar-icon" aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
              {link.badge && unreadCount > 0 && (
                <span className="sidebar-count" aria-label={`${unreadCount} unread`}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-account">
          {user ? (
            <>
              <div className="sidebar-user-avatar" aria-hidden="true">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-details">
                <strong>{user.name}</strong>
                <span>{isAdmin ? 'Administrator' : 'Customer'}</span>
              </div>
              <button className="sidebar-logout" type="button" onClick={handleLogout}>
                <span className="sidebar-icon" aria-hidden="true">
                  ↪
                </span>{' '}
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className="sidebar-login" to="/login">
                Log in
              </Link>
              <Link className="sidebar-register" to="/register">
                Create account
              </Link>
            </>
          )}
        </div>
      </aside>

      <main id="main-content">
        <Outlet />
      </main>

      <footer className="content-footer">
        <p>BarberBook · Barber shop booking system</p>
      </footer>
    </div>
  )
}

export default Layout
