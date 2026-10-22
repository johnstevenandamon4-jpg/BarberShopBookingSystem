export function formatDate(value) {
  if (!value) return '—'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value)

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatTime(value) {
  if (!value) return '—'
  const match = /^(\d{1,2}):(\d{2})/.exec(value)
  if (!match) return String(value)

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return String(value)

  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}

export function formatPrice(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return '—'
  return number.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
}

export function formatStatus(status) {
  if (!status) return '—'
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** "09:30:00" → "09:30" (what <input type="time"> and the API expect). */
export function toTimeInput(value) {
  return value ? String(value).slice(0, 5) : ''
}

/** "2026-10-23T00:00:00.000000Z" → "2026-10-23" (for <input type="date">). */
export function toDateInput(value) {
  return value ? String(value).slice(0, 10) : ''
}

/** Today as YYYY-MM-DD in the visitor's own time zone. */
export function todayISO() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** Has the appointment's scheduled date + time already passed? */
export function hasAppointmentTimeArrived(appointment) {
  const date = toDateInput(appointment.appointment_date)
  const time = String(appointment.appointment_time ?? '').slice(0, 8) || '00:00:00'
  const scheduled = new Date(`${date}T${time}`)
  return !Number.isNaN(scheduled.getTime()) && scheduled <= new Date()
}

/** Admin status workflow. Mirrors the transitions enforced by the API. */
export function getAdminActions(appointment) {
  if (appointment.status === 'pending') {
    return [
      { label: 'Confirm', status: 'confirmed', variant: 'primary' },
      { label: 'Cancel', status: 'cancelled', variant: 'danger' },
    ]
  }
  if (appointment.status === 'confirmed') {
    return [
      { label: 'Complete', status: 'completed', variant: 'primary' },
      { label: 'No-show', status: 'no_show', variant: 'secondary' },
      { label: 'Cancel', status: 'cancelled', variant: 'danger' },
    ]
  }
  return []
}
