import { formatDate, formatPrice, formatTime } from '../utils/format'
import StatusBadge from './StatusBadge'

/** Read-only summary of one appointment (used inside a Modal). */
function AppointmentDetails({ appointment }) {
  const rows = [
    ['Customer', appointment.customer?.name],
    ['Email', appointment.customer?.email],
    ['Barber', appointment.barber?.name],
    ['Service', appointment.service?.name],
    ['Price', appointment.service?.price != null ? formatPrice(appointment.service.price) : null],
    ['Date', formatDate(appointment.appointment_date)],
    ['Time', formatTime(appointment.appointment_time)],
  ].filter(([, value]) => value)

  return (
    <dl className="details-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
      <div>
        <dt>Status</dt>
        <dd>
          <StatusBadge status={appointment.status} />
        </dd>
      </div>
      <div>
        <dt>Notes</dt>
        <dd className="details-notes">
          {typeof appointment.notes === 'string' && appointment.notes.trim() ? appointment.notes : 'No additional notes.'}
        </dd>
      </div>
    </dl>
  )
}

export default AppointmentDetails
