import { useState } from 'react'

function formatAppointmentDate(dateValue) {
  if (!dateValue) return '—'

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateValue)

  if (match) {
    const [, year, month, day] = match
    return new Date(Number(year), Number(month) - 1, Number(day))
      .toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
  }

  const date = new Date(dateValue)
  return Number.isNaN(date.getTime())
    ? dateValue
    : date.toLocaleDateString('en-PH', {
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

function AdminDashboard({
  user,
  dashboardData,
  dashboardError,
  dashboardLoading,
  handleRefreshDashboard,
  summaryCards,
  barberAvailabilityError,
  barberAvailabilityMessage,
  barberAvailabilityLoadingId,
  appointmentActionLoadingId,
  dashboardLoading: isLoading,
  handleBarberAvailabilityChange,
  appointmentActionError,
  appointmentActionMessage,
  handleAppointmentStatusChange,
  availabilityButtonStyle,
  actionButtonStyle,
  getRoleBadgeStyle,
}) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null)

  return (
    <>
      <section className="admin-welcome">
        <p className="eyebrow">ADMINISTRATION</p>
        <h1>Administrator Dashboard</h1>
        <p>
          Welcome, {user?.name}. Review booking statistics and recent
          appointments from this page.
        </p>
        <span style={getRoleBadgeStyle(user?.role)}>
          ADMINISTRATOR
        </span>
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
              <output
                className="success-message"
                style={{ display: 'block' }}
              >
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
                      const available = Boolean(barber.is_available)
                      const updating =
                        barberAvailabilityLoadingId === barber.id

                      return (
                        <tr key={barber.id}>
                          <td>{barber.name}</td>
                          <td>{barber.appointments_count ?? 0}</td>
                          <td>
                            <span
                              className={
                                available
                                  ? 'status available'
                                  : 'status unavailable'
                              }
                            >
                              {available ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              style={availabilityButtonStyle(available)}
                              disabled={
                                barberAvailabilityLoadingId !== null ||
                                appointmentActionLoadingId !== null ||
                                isLoading
                              }
                              onClick={() =>
                                handleBarberAvailabilityChange(barber)
                              }
                            >
                              {updating
                                ? 'Updating...'
                                : available
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
              <output
                className="success-message"
                style={{ display: 'block' }}
              >
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
                    {dashboardData.recent_appointments.map((appointment) => {
                      const actions = getAppointmentActions(appointment)
                      const updating =
                        appointmentActionLoadingId === appointment.id

                      return (
                        <tr key={appointment.id}>
                          <td>{appointment.customer?.name || 'Unknown'}</td>
                          <td>{appointment.customer?.email || '—'}</td>
                          <td>{appointment.barber?.name || '—'}</td>
                          <td>{appointment.service?.name || '—'}</td>
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
                            {actions.length ? (
                              <div style={{ minWidth: '180px' }}>
                                {actions.map((action) => (
                                  <button
                                    key={action.status}
                                    type="button"
                                    style={actionButtonStyle}
                                    disabled={
                                      appointmentActionLoadingId !== null ||
                                      barberAvailabilityLoadingId !== null ||
                                      isLoading
                                    }
                                    onClick={() =>
                                      handleAppointmentStatusChange(
                                        appointment,
                                        action.status
                                      )
                                    }
                                  >
                                    {updating ? 'Updating...' : action.label}
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

                            <button type="button" style={actionButtonStyle}
                              aria-expanded={selectedAppointmentId === appointment.id}
                              onClick={() => setSelectedAppointmentId((current) => current === appointment.id ? null : appointment.id)}>
                              {selectedAppointmentId === appointment.id ? 'Hide Details' : 'View Details'}
                            </button>
                            {selectedAppointmentId === appointment.id && (
                              <div style={{ marginTop: '8px', padding: '10px', minWidth: '180px', maxWidth: '300px', whiteSpace: 'normal', overflowWrap: 'anywhere', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#f9fafb', lineHeight: 1.5 }}>
                                <strong>Additional Notes</strong>
                                <p style={{ margin: '5px 0 0' }}>{typeof appointment.notes === 'string' && appointment.notes.trim() ? appointment.notes : 'No additional notes.'}</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
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
  )
}

export default AdminDashboard
