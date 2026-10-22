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
import { serviceApi } from '../../services/serviceApi'
import { matchesSearch } from '../../utils/filters'
import { formatPrice } from '../../utils/format'
import { validateService } from '../../utils/validators'

const availabilityOptions = [
  { value: '', label: 'All services' },
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
]

function clientFilter(rows, params) {
  return rows.filter(
    (service) =>
      matchesSearch([service.name, service.description], params.search) &&
      (params.active === undefined || Boolean(service.is_active) === (params.active === '1'))
  )
}

function ServiceForm({ service, onSubmit, onCancel }) {
  const { values, errors, formError, submitting, handleChange, handleSubmit } = useForm(
    {
      name: service?.name ?? '',
      description: service?.description ?? '',
      price: service ? String(service.price) : '',
      duration_minutes: service ? String(service.duration_minutes) : '',
      is_active: service ? Boolean(service.is_active) : true,
    },
    validateService
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Alert type="error">{formError}</Alert>
      <div className="booking-form-grid">
        <FormInput label="Name" name="name" className="form-group-full" value={values.name} onChange={handleChange} error={errors.name} required />
        <FormInput label="Price (PHP)" name="price" type="number" min="0" step="0.01" value={values.price} onChange={handleChange} error={errors.price} required />
        <FormInput
          label="Duration (minutes)"
          name="duration_minutes"
          type="number"
          min="1"
          step="1"
          value={values.duration_minutes}
          onChange={handleChange}
          error={errors.duration_minutes}
          required
        />
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
        <FormCheckbox label="Active (customers can book it)" name="is_active" checked={values.is_active} onChange={handleChange} />
      </div>
      <div className="modal-actions">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {service ? 'Save changes' : 'Add service'}
        </Button>
      </div>
    </form>
  )
}

function AdminServices() {
  const list = useListControls({ active: '' })
  const { items, meta, loading, error, reload } = usePagedData(serviceApi.list, list.params, {
    clientFilter,
    onEmptyPage: () => list.setPage(list.page - 1),
  })

  const [message, flash] = useFlash()
  const [actionError, setActionError] = useState('')
  const [formTarget, setFormTarget] = useState(null) // null | 'new' | service
  const [toDelete, setToDelete] = useState(null)
  const [working, setWorking] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  async function handleSave(values) {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      price: Number(values.price),
      duration_minutes: Number(values.duration_minutes),
      is_active: values.is_active,
    }
    const response = formTarget === 'new' ? await serviceApi.create(payload) : await serviceApi.update(formTarget.id, payload)
    setFormTarget(null)
    flash(response.message)
    reload()
  }

  async function toggleActive(service) {
    setTogglingId(service.id)
    setActionError('')
    try {
      const response = await serviceApi.update(service.id, { is_active: !service.is_active })
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
      await serviceApi.remove(toDelete.id)
      flash(`${toDelete.name} was deleted.`)
      setToDelete(null)
      reload()
    } catch (err) {
      const blocked = err.response?.status >= 500 || err.response?.status === 409
      setToDelete(null)
      setActionError(
        blocked
          ? `${toDelete.name} has appointment history and cannot be deleted. Mark the service as inactive instead.`
          : getErrorMessage(err)
      )
    } finally {
      setWorking(false)
    }
  }

  const columns = [
    { key: 'name', header: 'Service', render: (row) => <strong>{row.name}</strong> },
    { key: 'description', header: 'Description', render: (row) => row.description || '—', className: 'cell-wrap' },
    { key: 'price', header: 'Price', render: (row) => formatPrice(row.price) },
    { key: 'duration', header: 'Duration', render: (row) => `${row.duration_minutes} min` },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <span className={`status ${row.is_active ? 'available' : 'unavailable'}`}>{row.is_active ? 'Active' : 'Inactive'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <Button variant="secondary" size="sm" onClick={() => setFormTarget(row)}>
            Edit
          </Button>
          <Button variant="secondary" size="sm" loading={togglingId === row.id} onClick={() => toggleActive(row)}>
            {row.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="danger" size="sm" onClick={() => setToDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <section className="section" id="admin-services">
      <div className="section-heading">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="section-description">Manage prices, durations, and what customers can book.</p>
        </div>
        <Button onClick={() => setFormTarget('new')}>Add service</Button>
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
        placeholder="Search services..."
        filters={[{ name: 'active', label: 'Status', value: list.filters.active, options: availabilityOptions }]}
        onFilterChange={list.setFilter}
        onReset={list.reset}
        hasActiveFilters={list.hasActiveFilters}
      />

      <DataTable columns={columns} rows={items} loading={loading} emptyTitle="No services found" caption="Services" />
      <Pagination meta={meta} onPageChange={list.setPage} disabled={loading} />

      <Modal open={Boolean(formTarget)} title={formTarget === 'new' ? 'Add service' : 'Edit service'} onClose={() => setFormTarget(null)}>
        {formTarget && <ServiceForm service={formTarget === 'new' ? null : formTarget} onSubmit={handleSave} onCancel={() => setFormTarget(null)} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this service?"
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

export default AdminServices
