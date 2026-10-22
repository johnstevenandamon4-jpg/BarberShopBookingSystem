import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Alert from '../components/Alert'
import AppointmentDetails from '../components/AppointmentDetails'
import AppointmentForm from '../components/AppointmentForm'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchToolbar from '../components/SearchToolbar'
import StatusBadge from '../components/StatusBadge'
import useCatalog from '../hooks/useCatalog'
import useFlash from '../hooks/useFlash'
import useListControls from '../hooks/useListControls'
import usePagedData from '../hooks/usePagedData'
import { getErrorMessage } from '../services/api'
import { appointmentApi } from '../services/appointmentApi'
import { matchesSearch } from '../utils/filters'
import { formatDate, formatPrice, formatTime, hasAppointmentTimeArrived, toDateInput, toTimeInput } from '../utils/format'

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
      matchesSearch([appointment.barber?.name, appointment.service?.name, appointment.notes], params.search) &&
      (!params.status || appointment.status === params.status) &&
      (!params.date || toDateInput(appointment.appointment_date) === params.date)
  )
}

/** Keep the booking's current barber/service selectable even if now unavailable. */
function withCurrent(options, current) {
  if (!current || options.some((option) => option.id === current.id)) return options
  return [...options, { ...current, is_available: false, is_active: false }]
}

function MyAppointments() {
  const location = useLocation()
  const catalog = useCatalog()
  const list = useListControls({ status: '', date: '' })
  const { items, meta, loading, error, reload } = usePagedData(appointmentApi.list, list.params, {
    clientFilter,
    onEmptyPage: () => list.setPage(list.page - 1),
  })

  const [message, flash] = useFlash()
  const [actionError, setActionError] = useState('')
  const [details, setDetails] = useState(null)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null) // { type: 'cancel' | 'complete', appointment }
  const [working, setWorking] = useState(false)

  // Message handed over by the booking page after a successful request.
  useEffect(() => {
    if (location.state?.message) flash(location.state.message)
  }, [location.state, flash])

  async function runConfirmed() {
    setWorking(true)
    setActionError('')
    try {
      const { type, appointment } = confirm
      const response = type === 'cancel' ? await appointmentApi.cancel(appointment.id) : await appointmentApi.complete(appointment.id)
      flash(response.message)
      setConfirm(null)
      reload()
    } catch (err) {
      setConfirm(null)
      setActionError(getErrorMessage(err))
    } finally {
      setWorking(false)
    }
  }

  async function handleEdit(values) {
    const response = await appointmentApi.update(editing.id, {
      service_id: Number(values.service_id),
      barber_id: Number(values.barber_id),
      appointment_date: values.appointment_date,
      appointment_time: values.appointment_time,
      notes: values.notes.trim() || null,
    })
    setEditing(null)
    flash(response.message)
    reload()
  }

  const columns = [
    {
      key: 'barber',
      header: 'Barber',
      render: (row) => (
        <>
          {row.barber?.name ?? '—'}
          {row.barber && !row.barber.is_available && ['pending', 'confirmed'].includes(row.status) && (
            <small className="cell-warning">Barber currently unavailable</small>
          )}
        </>
      ),
    },
    { key: 'service', header: 'Service', render: (row) => row.service?.name ?? '—' },
    { key: 'price', header: 'Price', render: (row) => (row.service?.price != null ? formatPrice(row.service.price) : '—') },
    { key: 'date', header: 'Date', className: 'cell-nowrap', render: (row) => formatDate(row.appointment_date) },
    { key: 'time', header: 'Time', className: 'cell-nowrap', render: (row) => formatTime(row.appointment_time) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <Button variant="secondary" size="sm" onClick={() => setDetails(row)}>
            Details
          </Button>
          {row.status === 'pending' && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditing(row)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirm({ type: 'cancel', appointment: row })}>
                Cancel
              </Button>
            </>
          )}
          {row.status === 'confirmed' && hasAppointmentTimeArrived(row) && (
            <Button size="sm" onClick={() => setConfirm({ type: 'complete', appointment: row })}>
              Mark as done
            </Button>
          )}
        </div>
      ),
    },
  ]

  const isCancel = confirm?.type === 'cancel'

  return (
    <section className="section" id="my-appointments">
      <div className="section-heading">
        <div>
          <h2>My appointments</h2>
          <p className="section-description">Review your bookings, edit pending ones, and check their status.</p>
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
        placeholder="Search by barber or service..."
        filters={[{ name: 'status', label: 'Status', value: list.filters.status, options: statusOptions }]}
        dates={[{ name: 'date', label: 'Appointment date', value: list.filters.date }]}
        onFilterChange={list.setFilter}
        onReset={list.reset}
        hasActiveFilters={list.hasActiveFilters}
      />

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        emptyTitle="No appointments found"
        emptyMessage={list.hasActiveFilters ? 'Try changing your search or filters.' : 'Book your first appointment from the Book page.'}
        caption="Your appointments"
      />
      <Pagination meta={meta} onPageChange={list.setPage} disabled={loading} />

      <Modal open={Boolean(details)} title="Appointment details" onClose={() => setDetails(null)} footer={<Button variant="secondary" onClick={() => setDetails(null)}>Close</Button>}>
        {details && <AppointmentDetails appointment={details} />}
      </Modal>

      <Modal open={Boolean(editing)} title="Edit appointment" onClose={() => setEditing(null)} dismissible>
        {editing && (
          <AppointmentForm
            initialValues={{
              service_id: String(editing.service_id ?? editing.service?.id ?? ''),
              barber_id: String(editing.barber_id ?? editing.barber?.id ?? ''),
              appointment_date: toDateInput(editing.appointment_date),
              appointment_time: toTimeInput(editing.appointment_time),
              notes: editing.notes ?? '',
            }}
            services={withCurrent(catalog.services.filter((service) => service.is_active), editing.service)}
            barbers={withCurrent(catalog.barbers.filter((barber) => barber.is_available), editing.barber)}
            submitLabel="Save changes"
            onSubmit={handleEdit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={isCancel ? 'Cancel this appointment?' : 'Mark as done?'}
        message={
          isCancel
            ? 'This will cancel your pending appointment. You can book a new one at any time.'
            : 'Confirm that this appointment has taken place.'
        }
        confirmLabel={isCancel ? 'Yes, cancel it' : 'Yes, mark as done'}
        danger={isCancel}
        loading={working}
        onConfirm={runConfirmed}
        onCancel={() => setConfirm(null)}
      />
    </section>
  )
}

export default MyAppointments
