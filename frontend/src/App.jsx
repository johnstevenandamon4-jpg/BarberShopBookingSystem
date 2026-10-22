import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { GuestRoute, ProtectedRoute, PublicArea } from './components/RouteGuards'

import Barbers from './pages/Barbers'
import Book from './pages/Book'
import Home from './pages/Home'
import Login from './pages/Login'
import MyAppointments from './pages/MyAppointments'
import NotFound from './pages/NotFound'
import Notifications from './pages/Notifications'
import Register from './pages/Register'
import Services from './pages/Services'

import AdminAppointments from './pages/admin/AdminAppointments'
import AdminBarbers from './pages/admin/AdminBarbers'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminServices from './pages/admin/AdminServices'

/**
 * Route map
 *   Public (guests + customers):  /  /services  /barbers
 *   Guest only:                   /login  /register
 *   Customer only:                /book  /my-appointments  /notifications
 *   Admin only:                   /admin  /admin/appointments  /admin/barbers  /admin/services
 * The API enforces the same rules; these guards only hide pages in the UI.
 */
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route element={<PublicArea />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="barbers" element={<Barbers />} />

          <Route element={<ProtectedRoute role="customer" />}>
            <Route path="book" element={<Book />} />
            <Route path="my-appointments" element={<MyAppointments />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Route>

        <Route path="admin" element={<ProtectedRoute role="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="barbers" element={<AdminBarbers />} />
          <Route path="services" element={<AdminServices />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
    </Routes>
  )
}

export default App
