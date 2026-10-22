import { useState } from 'react'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import DataTable from '../../components/DataTable'
import FormCheckbox from '../../components/FormCheckbox'
import FormInput from '../../components/FormInput'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import SearchToolbar from '../../components/SearchToolbar'
import useFlash from '../../hooks/useFlash'
import useForm from '../../hooks/useForm'
import useListControls from '../../hooks/useListControls'
import usePagedData from '../../hooks/usePagedData'
import { getErrorMessage } from '../../services/api'
import { barberApi } from '../../services/barberApi'
import { matchesSearch } from '../../utils/filters'
import { validateBarber } from '../../utils/validators'

const availabilityOptions = [
  { value: '', label: 'All barbers' },
  { value: '1', label: 'Available' },
  { value: '0', label: 'Unavailable' },
]

function clientFilter(rows, params) {
  return rows.filter(
    (barber) =>
      matchesSearch([barber.name, barber.email, barber.phone, barber.description], params.search) &&
      (params.available === undefined || Boolean(barber.is_available) === (params.available === '1'))
  )
}

function BarberForm({ barber, onSubmit, onCancel }) {
  const { values, errors, formError, submitting, handleChange, handleSubmit } = useForm(
    {
      name: barber?.name ?? '',
      phone: barber?.phone ?? '',
      email: barber?.email ?? '',
      description: barber?.description ?? '',
      is_available: barber ? Boolean(barber.is_available) : true,
    },
    validateBarber
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Alert type="error">{formError}</Alert>
      <div className="booking-form-grid">
        <FormInput label="Name" name="name" value={values.name} onChange={handleChange} error={errors.name} required />
        <FormInput label="Phone" name="phone" value={values.phone} onChange={handleChange} error={errors.phone} />
        <FormInput label="Email" name="email" type="email" value={values.email} onChange={handleChange} error={errors.email} />
        <FormCheckbox label="Available for bookings" name="is_available" checked={values.is_available} onChange={handleChange} />
        <FormInput
          as="textarea"
          label="Description"
          name="description"
          rows={3}
          className="form-group-full"
          value={values.description}
          onChange={handleChange}
          error={errors.description}
        />
      </div>
      <div className="modal-actions">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {barber ? 'Save changes' : 'Add barber'}
        </Button>
      </div>
    </form>
  )
}

function AdminBarbers() {
  const list = useListControls({ available: '' })
  const { items, meta, loading, error, reload } = usePagedData(barberApi.list, list.params, {
    clientFilter,
    onEmptyPage: () => list.setPage(list.page - 1),
  })

  const [message, flash] = useFlash()
  const [actionError, setActionError] = useState('')
  const [formTarget, setFormTarget] = useState(null) // null | 'new' | barber
  const [toDelete, setToDelete] = useState(null)
  const [working, setWorking] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  async function handleSave(values) {
    const payload = {
      name: values.name.trim(),
      phone: values.phone.trim() || null,
      email: values.email.trim() || null,
      description: values.description.trim() || null,
      is_available: values.is_available,
    }
    const response = formTarget === 'new' ? await barberApi.create(payload) : await barberApi.update(formTarget.id, payload)
    setFormTarget(null)
    flash(response.message)
    reload()
  }

  async function toggleAvailability(barber) {
    setTogglingId(barber.id)
    setActionError('')
    try {
      const response = await barberApi.update(barber.id, { is_available: !barber.is_available })
      flash(response.message)
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete() {
    setWorking(true)
    setActionError('')
    try {
      await barberApi.remove(toDelete.id)
      flash(`${toDelete.name} was deleted.`)
      setToDelete(null)
      reload()
    } catch (err) {
      const blocked = err.response?.status >= 500 || err.response?.status === 409
      setToDelete(null)
      setActionError(
        blocked
          ? `${toDelete.name} has appointment history and cannot be deleted. Mark the barber as unavailable instead.`
          : getErrorMessage(err)
      )
    } finally {
      setWorking(false)
    }
  }

  const columns = [
    { key: 'name', header: 'Barber', render: (row) => <strong>{row.name}</strong> },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <>
          {row.phone || '—'}
          {row.email && <small className="cell-sub">{row.email}</small>}
        </>
      ),
    },
    { key: 'description', header: 'Description', render: (row) => row.description || '—', className: 'cell-wrap' },
    {
      key: 'status',
      header: 'Availability',
      render: (row) => <span className={`status ${row.is_available ? 'available' : 'unavailable'}`}>{row.is_available ? 'Available' : 'Unavailable'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <Button variant="secondary" size="sm" onClick={() => setFormTarget(row)}>
            Edit
          </Button>
          <Button variant="secondary" size="sm" loading={togglingId === row.id} onClick={() => toggleAvailability(row)}>
            {row.is_available ? 'Mark unavailable' : 'Mark available'}
          </Button>
          <Button variant="danger" size="sm" onClick={() => setToDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <section className="section" id="admin-barbers">
      <div className="section-heading">
        <div>
          <h1 className="page-title">Barbers</h1>
          <p className="section-description">Add, edit, and set availability for your team.</p>
        </div>
        <Button onClick={() => setFormTarget('new')}>Add barber</Button>
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
        placeholder="Search barbers..."
        filters={[{ name: 'available', label: 'Availability', value: list.filters.available, options: availabilityOptions }]}
        onFilterChange={list.setFilter}
        onReset={list.reset}
        hasActiveFilters={list.hasActiveFilters}
      />

      <DataTable columns={columns} rows={items} loading={loading} emptyTitle="No barbers found" caption="Barbers" />
      <Pagination meta={meta} onPageChange={list.setPage} disabled={loading} />

      <Modal open={Boolean(formTarget)} title={formTarget === 'new' ? 'Add barber' : 'Edit barber'} onClose={() => setFormTarget(null)}>
        {formTarget && <BarberForm barber={formTarget === 'new' ? null : formTarget} onSubmit={handleSave} onCancel={() => setFormTarget(null)} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this barber?"
        message={toDelete ? `${toDelete.name} will be permanently removed. This cannot be undone.` : ''}
        confirmLabel="Yes, delete"
        danger
        loading={working}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  )
}

export default AdminBarbers
