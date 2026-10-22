import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllPages, getErrorMessage } from '../services/api'
import { formatDate, formatTime, todayISO, toDateInput } from '../utils/format'
import Alert from './Alert'
import DataTable from './DataTable'
import StatusBadge from './StatusBadge'

/**
 * Customer dashboard (proposal §5.2): upcoming / pending / completed counts
 * and the next appointments. A customer only ever receives their own records.
 */
function CustomerSummary() {
  const [state, setState] = useState({ items: [], loading: true, error: '' })

  useEffect(() => {
    let cancelled = false

    fetchAllPages('/appointments')
      .then((items) => {
        if (!cancelled) setState({ items, loading: false, error: '' })
      })
      .catch((error) => {
        if (!cancelled) setState({ items: [], loading: false, error: getErrorMessage(error, 'Could not load your appointments.') })
      })

    return () => {
      cancelled = true
    }
  }, [])

  const { items, loading, error } = state
  const today = todayISO()
  const sortKey = (appointment) => `${toDateInput(appointment.appointment_date)} ${String(appointment.appointment_time ?? '')}`

  const upcoming = items
    .filter((appointment) => ['pending', 'confirmed'].includes(appointment.status) && toDateInput(appointment.appointment_date) >= today)
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))

  const cards = [
    ['Upcoming', upcoming.length],
    ['Pending', items.filter((appointment) => appointment.status === 'pending').length],
    ['Completed', items.filter((appointment) => appointment.status === 'completed').length],
  ]

  const columns = [
    { key: 'date', header: 'Date', className: 'cell-nowrap', render: (row) => formatDate(row.appointment_date) },
    { key: 'time', header: 'Time', className: 'cell-nowrap', render: (row) => formatTime(row.appointment_time) },
    { key: 'barber', header: 'Barber', render: (row) => row.barber?.name ?? '—' },
    { key: 'service', header: 'Service', render: (row) => row.service?.name ?? '—' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'action',
      header: 'Action',
      render: () => (
        <Link className="btn btn-secondary btn-sm" to="/my-appointments">
          View
        </Link>
      ),
    },
  ]

  return (
    <section className="section customer-summary" aria-labelledby="customer-summary-title">
      <div className="section-heading">
        <h2 id="customer-summary-title">My dashboard</h2>
        <Link className="btn btn-primary btn-sm" to="/book">
          + Book an appointment
        </Link>
      </div>

      <Alert type="error">{error}</Alert>

      <div className="dashboard-summary-grid">
        {cards.map(([label, value]) => (
          <article className="dashboard-stat-card" key={label}>
            <p>{label}</p>
            <h3>{loading ? '…' : value}</h3>
          </article>
        ))}
      </div>

      <h3 className="subsection-title">Upcoming appointments</h3>
      <DataTable
        columns={columns}
        rows={upcoming.slice(0, 5)}
        loading={loading}
        emptyTitle="No upcoming appointments"
        emptyMessage="Book an appointment and it will appear here."
        caption="Upcoming appointments"
      />
    </section>
  )
}

export default CustomerSummary
