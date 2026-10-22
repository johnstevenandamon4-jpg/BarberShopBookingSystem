import { useState } from 'react'
import Alert from '../../components/Alert'
import AppointmentDetails from '../../components/AppointmentDetails'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import SearchToolbar from '../../components/SearchToolbar'
import StatusBadge from '../../components/StatusBadge'
import useFlash from '../../hooks/useFlash'
import useListControls from '../../hooks/useListControls'
import usePagedData from '../../hooks/usePagedData'
import { getErrorMessage } from '../../services/api'
import { appointmentApi } from '../../services/appointmentApi'
import { matchesSearch } from '../../utils/filters'
import { formatDate, formatStatus, formatTime, getAdminActions } from '../../utils/format'

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No show' },
]

function clientFilter(rows, params) {
  return rows.filter(
    (appointment) =>
      matchesSearch(
        [appointment.customer?.name, appointment.customer?.email, appointment.barber?.name, appointment.service?.name],
        params.search
      ) && (!params.status || appointment.status === params.status)
  )
}

function AdminAppointments() {
  const list = useListControls({ status: '' })
  const { items, meta, loading, error, reload } = usePagedData(appointmentApi.list, list.params, {
    clientFilter,
    onEmptyPage: () => list.setPage(list.page - 1),
  })

  const [message, flash] = useFlash()
  const [actionError, setActionError] = useState('')
  const [details, setDetails] = useState(null)
  const [pendingChange, setPendingChange] = useState(null) // { appointment, action }
  const [working, setWorking] = useState(false)

  async function applyStatusChange() {
    setWorking(true)
    setActionError('')
    try {
      const { appointment, action } = pendingChange
      const response = await appointmentApi.update(appointment.id, { status: action.status })
      flash(response.message || 'Appointment updated.')
      setPendingChange(null)
      reload()
    } catch (err) {
      setPendingChange(null)
      setActionError(getErrorMessage(err))
    } finally {
      setWorking(false)
    }
  }

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <>
          {row.customer?.name ?? 'Unknown'}
          <small className="cell-sub">{row.customer?.email ?? ''}</small>
        </>
      ),
    },
    { key: 'barber', header: 'Barber', render: (row) => row.barber?.name ?? '—' },
    { key: 'service', header: 'Service', render: (row) => row.service?.name ?? '—' },
    { key: 'date', header: 'Date', className: 'cell-nowrap', render: (row) => formatDate(row.appointment_date) },
    { key: 'time', header: 'Time', className: 'cell-nowrap', render: (row) => formatTime(row.appointment_time) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="row-actions">
          {getAdminActions(row).map((action) => (
            <Button key={action.status} variant={action.variant} size="sm" onClick={() => setPendingChange({ appointment: row, action })}>
              {action.label}
            </Button>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setDetails(row)}>
            Details
          </Button>
        </div>
      ),
    },
  ]

  const target = pendingChange?.action.status
  const destructive = target === 'cancelled' || target === 'no_show'

  return (
    <section className="section" id="admin-appointments">
      <div className="section-heading">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="section-description">Move bookings through pending → confirmed → completed.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={reload} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <Alert type="success" onDismiss={() => flash('')}>
        {message}
      </Alert>
      <Alert type="error" onDismiss={() => setActionError('')}>
        {actionError || error}
      </Alert>

      <SearchToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        placeholder="Search customer, barber or service..."
        filters={[{ name: 'status', label: 'Status', value: list.filters.status, options: statusOptions }]}
        onFilterChange={list.setFilter}
        onReset={list.reset}
        hasActiveFilters={list.hasActiveFilters}
      />

      <DataTable columns={columns} rows={items} loading={loading} emptyTitle="No appointments found" caption="All appointments" />
      <Pagination meta={meta} onPageChange={list.setPage} disabled={loading} />

      <Modal open={Boolean(details)} title="Appointment details" onClose={() => setDetails(null)} footer={<Button variant="secondary" onClick={() => setDetails(null)}>Close</Button>}>
        {details && <AppointmentDetails appointment={details} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingChange)}
        title={`${pendingChange?.action.label ?? ''} this appointment?`}
        message={
          pendingChange
            ? `${pendingChange.appointment.customer?.name ?? 'The customer'}'s appointment will change from ${formatStatus(pendingChange.appointment.status)} to ${formatStatus(target)}.${destructive ? ' This cannot be undone.' : ''}`
            : ''
        }
        confirmLabel={`Yes, ${pendingChange?.action.label.toLowerCase() ?? 'continue'}`}
        danger={destructive}
        loading={working}
        onConfirm={applyStatusChange}
        onCancel={() => setPendingChange(null)}
      />
    </section>
  )
}

export default AdminAppointments
