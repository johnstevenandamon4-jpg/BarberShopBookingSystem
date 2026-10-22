import useForm from '../hooks/useForm'
import { formatPrice, todayISO } from '../utils/format'
import { validateAppointment } from '../utils/validators'
import Alert from './Alert'
import Button from './Button'
import FormInput from './FormInput'

/**
 * Create / edit form for an appointment.
 * Used by the Book page and by the "Edit" dialog in My Appointments.
 */
function AppointmentForm({ initialValues, services, barbers, submitLabel = 'Request appointment', onSubmit, onCancel }) {
  const { values, errors, formError, submitting, handleChange, handleSubmit } = useForm(initialValues, validateAppointment)

  const selectedService = services.find((service) => String(service.id) === String(values.service_id))

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Alert type="error">{formError}</Alert>

      <div className="booking-form-grid">
        <FormInput
          as="select"
          label="Service"
          name="service_id"
          value={values.service_id}
          onChange={handleChange}
          error={errors.service_id}
          hint={selectedService ? `${selectedService.duration_minutes} min · ${formatPrice(selectedService.price)}` : undefined}
          required
        >
          <option value="">Choose a service</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
              {service.is_active ? '' : ' (unavailable)'}
            </option>
          ))}
        </FormInput>

        <FormInput as="select" label="Barber" name="barber_id" value={values.barber_id} onChange={handleChange} error={errors.barber_id} required>
          <option value="">Choose a barber</option>
          {barbers.map((barber) => (
            <option key={barber.id} value={barber.id}>
              {barber.name}
              {barber.is_available ? '' : ' (unavailable)'}
            </option>
          ))}
        </FormInput>

        <FormInput
          label="Date"
          name="appointment_date"
          type="date"
          min={todayISO()}
          value={values.appointment_date}
          onChange={handleChange}
          error={errors.appointment_date}
          required
        />

        <FormInput label="Time" name="appointment_time" type="time" value={values.appointment_time} onChange={handleChange} error={errors.appointment_time} required />

        <FormInput
          as="textarea"
          label="Notes (optional)"
          name="notes"
          rows={3}
          maxLength={1000}
          className="form-group-full"
          value={values.notes}
          onChange={handleChange}
          error={errors.notes}
          hint={`${values.notes.length}/1000 characters`}
          placeholder="Any preferred style or instructions for your barber?"
        />
      </div>

      <div className="booking-form-footer">
        <p className="booking-form-disclaimer">Requests are confirmed by the shop, subject to availability.</p>
        <div className="button-row">
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={submitting}>
            {submitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default AppointmentForm
