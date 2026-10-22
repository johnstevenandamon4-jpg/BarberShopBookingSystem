import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import DataTable from '../../components/DataTable'
import LoadingState from '../../components/LoadingState'
import StatusBadge from '../../components/StatusBadge'
import { getErrorMessage } from '../../services/api'
import { dashboardApi } from '../../services/dashboardApi'
import { formatDate, formatTime } from '../../utils/format'

const summaryCards = [
  ['Total bookings', 'total_bookings'],
  ['Pending', 'pending_bookings'],
  ['Confirmed', 'confirmed_bookings'],
  ['Completed', 'completed_bookings'],
  ['Cancelled', 'cancelled_bookings'],
  ['No-shows', 'no_show_bookings'],
]

/** Simple horizontal bar chart (no chart library needed). */
function BarList({ title, items }) {
  const max = Math.max(1, ...items.map((item) => item.value))

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <ul className="bar-list">
        {items.map((item) => (
          <li key={item.label}>
            <span className="bar-label">{item.label}</span>
            <span className="bar-track" aria-hidden="true">
              <span className="bar-fill" style={{ width: `${(item.value / max) * 100}%` }} />
            </span>
            <span className="bar-value">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await dashboardApi.get())
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load the dashboard.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const summary = data?.summary ?? {}
  const recent = (data?.recent_appointments ?? []).slice(0, 5)

  const recentColumns = [
    { key: 'customer', header: 'Customer', render: (row) => row.customer?.name ?? 'Unknown' },
    { key: 'barber', header: 'Barber', render: (row) => row.barber?.name ?? '—' },
    { key: 'service', header: 'Service', render: (row) => row.service?.name ?? '—' },
    { key: 'date', header: 'Date', render: (row) => `${formatDate(row.appointment_date)} · ${formatTime(row.appointment_time)}` },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <>
      <section className="admin-welcome">
        <h1>Administrator dashboard</h1>
        <p>Booking figures and the latest activity at a glance.</p>
      </section>

      <section className="section" id="admin-dashboard">
        <div className="section-heading">
          <h2>Booking summary</h2>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh data'}
          </Button>
        </div>

        <Alert type="error">{error}</Alert>

        {loading && !data ? (
          <LoadingState label="Loading dashboard..." />
        ) : (
          data && (
            <>
              <div className="dashboard-summary-grid">
                {summaryCards.map(([label, key]) => (
                  <article className="dashboard-stat-card" key={key}>
                    <p>{label}</p>
                    <h3>{summary[key] ?? 0}</h3>
                  </article>
                ))}
              </div>

              <div className="chart-grid">
                <BarList
                  title="Bookings by status"
                  items={summaryCards.slice(1).map(([label, key]) => ({ label, value: summary[key] ?? 0 }))}
                />
                <BarList
                  title="Bookings by barber"
                  items={(data.bookings_by_barber ?? []).map((barber) => ({ label: barber.name, value: barber.appointments_count ?? 0 }))}
                />
              </div>
            </>
          )
        )}
      </section>

      {data && (
        <section className="section">
          <div className="section-heading">
            <h2>Latest appointments</h2>
            <Link className="btn btn-secondary btn-sm" to="/admin/appointments">
              View all
            </Link>
          </div>
          <DataTable columns={recentColumns} rows={recent} emptyTitle="No appointments yet" emptyMessage="New bookings will appear here." caption="Latest appointments" />
        </section>
      )}
    </>
  )
}

export default AdminDashboard
