import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { homePathFor, useAuth } from '../context/AuthContext'
import LoadingState from './LoadingState'

/** Signed-in users only. Pass `role` to also require that role. */
export function ProtectedRoute({ role }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <LoadingState label="Checking your session..." />

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  // Wrong role (e.g. a customer typing /admin): send them to their own home.
  if (role && user.role !== role) return <Navigate to={homePathFor(user)} replace />

  return <Outlet />
}

/** Login / register: only for visitors who are NOT signed in. */
export function GuestRoute() {
  const { user, initializing } = useAuth()

  if (initializing) return <LoadingState label="Checking your session..." />
  if (user) return <Navigate to={homePathFor(user)} replace />

  return <Outlet />
}

/** Public pages are for guests and customers; admins use /admin instead. */
export function PublicArea() {
  const { user } = useAuth()

  if (user?.role === 'admin') return <Navigate to="/admin" replace />

  return <Outlet />
}
