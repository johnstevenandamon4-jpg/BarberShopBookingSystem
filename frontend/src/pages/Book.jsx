import { useNavigate, useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import AppointmentForm from '../components/AppointmentForm'
import LoadingState from '../components/LoadingState'
import useCatalog from '../hooks/useCatalog'
import { appointmentApi } from '../services/appointmentApi'

function Book() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const catalog = useCatalog()

  const services = catalog.services.filter((service) => service.is_active)
  const barbers = catalog.barbers.filter((barber) => barber.is_available)

  // Pre-select from ?service= / ?barber= (links from the Services / Barbers pages).
  const preService = searchParams.get('service') ?? ''
  const preBarber = searchParams.get('barber') ?? ''
  const initialValues = {
    service_id: services.some((service) => String(service.id) === preService) ? preService : '',
    barber_id: barbers.some((barber) => String(barber.id) === preBarber) ? preBarber : '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
  }

  async function handleCreate(values) {
    await appointmentApi.create({
      service_id: Number(values.service_id),
      barber_id: Number(values.barber_id),
      appointment_date: values.appointment_date,
      appointment_time: values.appointment_time,
      notes: values.notes.trim() || null,
    })
    navigate('/my-appointments', { state: { message: 'Appointment requested. The shop will confirm it soon.' } })
  }

  return (
    <section className="section" id="booking">
      <div className="section-heading">
        <div>
          <h2 className="section-title">Book an appointment</h2>
          <p className="section-description">Choose a service, a barber, and a time that suits you.</p>
        </div>
      </div>

      <Alert type="error">{catalog.error}</Alert>

      {catalog.loading ? (
        <LoadingState label="Loading services and barbers..." />
      ) : (
        !catalog.error && (
          <div className="booking-form-card">
            {(services.length === 0 || barbers.length === 0) && (
              <Alert type="info">
                {services.length === 0 ? 'No services are available right now. ' : ''}
                {barbers.length === 0 ? 'No barbers are available right now. ' : ''}
                Please check back later.
              </Alert>
            )}
            <AppointmentForm initialValues={initialValues} services={services} barbers={barbers} onSubmit={handleCreate} />
          </div>
        )
      )}
    </section>
  )
}

export default Book
