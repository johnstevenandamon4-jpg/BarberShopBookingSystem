import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import Pagination from '../components/Pagination'
import useFlash from '../hooks/useFlash'
import usePagedData from '../hooks/usePagedData'
import { NOTIFICATIONS_CHANGED_EVENT, getErrorMessage } from '../services/api'
import { notificationApi } from '../services/notificationApi'
import { formatDate } from '../utils/format'

function Notifications() {
  const [page, setPage] = useState(1)
  const params = useMemo(() => ({ page }), [page])
  const { items, meta, loading, error, reload } = usePagedData(notificationApi.list, params, {
    onEmptyPage: () => setPage((current) => Math.max(1, current - 1)),
  })
  const [message, flash] = useFlash()
  const [actionError, setActionError] = useState('')
  const [workingId, setWorkingId] = useState(null)

  async function markAsRead(notification) {
    setWorkingId(notification.id)
    setActionError('')
    try {
      const response = await notificationApi.markAsRead(notification.id)
      flash(response.message)
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT)) // refresh sidebar badge
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <section className="section" id="notifications">
      <div className="section-heading">
        <div>
          <h2>Notifications</h2>
          <p className="section-description">Updates about your appointments appear here.</p>
        </div>
      </div>

      <Alert type="success">{message}</Alert>
      <Alert type="error">{actionError || error}</Alert>

      {loading && items.length === 0 ? (
        <LoadingState label="Loading notifications..." />
      ) : items.length === 0 && !error ? (
        <EmptyState title="No notifications" message="You're all caught up. Updates about your bookings will show up here.">
          <Link className="btn btn-secondary btn-md" to="/my-appointments">
            View my appointments
          </Link>
        </EmptyState>
      ) : (
        <ul className={`notice-list${loading ? ' is-refreshing' : ''}`}>
          {items.map((notification) => (
            <li key={notification.id} className={`notice${notification.read_at ? '' : ' notice-unread'}`}>
              <div className="notice-body">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <small>
                  {formatDate(notification.created_at)}
                  {notification.appointment?.barber?.name && ` · ${notification.appointment.barber.name}`}
                  {notification.appointment?.service?.name && ` · ${notification.appointment.service.name}`}
                </small>
              </div>
              {notification.read_at ? (
                <span className="notice-read">Read</span>
              ) : (
                <Button variant="secondary" size="sm" loading={workingId === notification.id} onClick={() => markAsRead(notification)}>
                  Mark as read
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Pagination meta={meta} onPageChange={setPage} disabled={loading} />
    </section>
  )
}

export default Notifications
