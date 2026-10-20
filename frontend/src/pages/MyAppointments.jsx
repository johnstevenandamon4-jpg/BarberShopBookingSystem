import { useState } from 'react'

function MyAppointments({
  isCustomer,
  customerNotifications,
  customerNotificationsLoading,
  customerNotificationsError,
  customerNotificationPagination,
  customerNotificationActionLoadingId,
  customerNotificationActionMessage,
  customerNotificationPage,
  setCustomerNotificationPage,
  handleMarkNotificationAsRead,
  customerAppointments,
  customerAppointmentsLoading,
  customerAppointmentsError,
  customerAppointmentPagination,
  customerAppointmentPage,
  setCustomerAppointmentPage,
  customerAppointmentActionLoadingId,
  customerAppointmentActionError,
  customerAppointmentActionMessage,
  refreshCustomerAppointments,
  handleCustomerAppointmentCancel,
  handleCustomerAppointmentComplete,
  hasAppointmentTimeArrived,
}) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null)

  if (!isCustomer) return null

  function formatDate(value) {
    if (!value) return '—'

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)

    if (match) {
      const [, year, month, day] = match
      return new Date(Number(year), Number(month) - 1, Number(day))
        .toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
  }

  function formatTime(value) {
    if (!value) return '—'

    const match = /^(\d{1,2}):(\d{2})/.exec(value)
    if (!match) return value

    const hours = Number(match[1])
    const minutes = Number(match[2])

    if (hours > 23 || minutes > 59) return value

    const date = new Date()
    date.setHours(hours, minutes, 0, 0)

    return date.toLocaleTimeString('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function formatStatus(value) {
    if (!value) return '—'

    return value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
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

  return (
    <>
      <section
        className="section admin-table-section"
        id="customer-notifications"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">UPDATES</p>
            <h2>Your Notifications</h2>
            <p>Stay informed about changes to your appointments.</p>
          </div>
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

        {customerNotificationsLoading &&
          customerNotifications.length === 0 && (
            <p>Loading your notifications...</p>
          )}

        {!customerNotificationsLoading &&
          customerNotifications.length === 0 && (
            <p>
              You have no notifications right now. If an administrator sends
              you a notice, it will appear here.
            </p>
          )}

        {customerNotifications.length > 0 && (
          <>
            <div style={{ display: 'grid', gap: '14px' }}>
              {customerNotifications.map((notification) => {
                const unread = !notification.read_at
                const updating =
                  customerNotificationActionLoadingId === notification.id

                return (
                  <article
                    key={notification.id}
                    style={{
                      padding: '18px',
                      border: unread
                        ? '1px solid #f59e0b'
                        : '1px solid #e5e7eb',
                      borderLeft: unread
                        ? '4px solid #d97706'
                        : '4px solid #9ca3af',
                      borderRadius: '8px',
                      backgroundColor: unread ? '#fffbeb' : '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <strong>
                        {notification.title || 'Appointment Notification'}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {unread ? 'Unread' : 'Read'}
                      </span>
                    </div>

                    <p style={{ marginTop: '10px' }}>
                      {notification.message ||
                        notification.data?.message ||
                        'There is an update to your appointment.'}
                    </p>

                    {notification.appointment && (
                      <p style={{ fontSize: '13px', color: '#4b5563' }}>
                        Appointment with{' '}
                        {notification.appointment.barber?.name || 'your barber'}
                      </p>
                    )}

                    {unread && (
                      <button
                        type="button"
                        style={actionButtonStyle}
                        disabled={
                          customerNotificationActionLoadingId !== null
                        }
                        onClick={() =>
                          handleMarkNotificationAsRead(notification)
                        }
                      >
                        {updating ? 'Marking...' : 'Mark as Read'}
                      </button>
                    )}
                  </article>
                )
              })}
            </div>

            {customerNotificationPagination && (
              <div className="pagination-controls">
                <button
                  type="button"
                  onClick={() =>
                    setCustomerNotificationPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                  disabled={
                    customerNotificationPagination.current_page <= 1 ||
                    customerNotificationsLoading
                  }
                >
                  Previous
                </button>

                <span>
                  Page {customerNotificationPagination.current_page} of{' '}
                  {customerNotificationPagination.last_page}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCustomerNotificationPage((page) =>
                      Math.min(
                        customerNotificationPagination.last_page,
                        page + 1
                      )
                    )
                  }
                  disabled={
                    customerNotificationPagination.current_page >=
                      customerNotificationPagination.last_page ||
                    customerNotificationsLoading
                  }
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section
        className="section admin-table-section"
        id="my-appointments"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR BOOKINGS</p>
            <h2>My Appointments</h2>
            <p>Review your bookings and check their current status.</p>
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

        {customerAppointmentsLoading &&
          customerAppointments.length === 0 && (
            <p>Loading your appointments...</p>
          )}

        {customerAppointments.length > 0 && (
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

                    const updating =
                      customerAppointmentActionLoadingId === appointment.id

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
                              <strong>Barber Availability Notice</strong>
                              <p style={{ margin: '5px 0 0' }}>
                                {appointment.barber?.name || 'Your barber'} is
                                currently unavailable. Your appointment remains
                                recorded as {formatStatus(appointment.status)}.
                                Please contact the shop to confirm whether it
                                will proceed or needs to be rescheduled.
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
                        <td>{formatDate(appointment.appointment_date)}</td>
                        <td>{formatTime(appointment.appointment_time)}</td>
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
                                customerAppointmentActionLoadingId !== null
                              }
                              onClick={() =>
                                handleCustomerAppointmentCancel(appointment)
                              }
                            >
                              {updating ? 'Cancelling...' : 'Cancel Appointment'}
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
                                customerAppointmentActionLoadingId !== null
                              }
                              onClick={() =>
                                handleCustomerAppointmentComplete(appointment)
                              }
                            >
                              {updating ? 'Completing...' : 'Mark as Done'}
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

        {!customerAppointmentsLoading &&
          customerAppointments.length === 0 && (
            <p>
              You have no appointments yet. Book an appointment and it will
              appear here.
            </p>
          )}
      </section>
    </>
  )
}

export default MyAppointments
