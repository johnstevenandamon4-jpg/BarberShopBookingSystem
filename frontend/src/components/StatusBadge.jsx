import { formatStatus } from '../utils/format'

/** Coloured pill for an appointment status (pending, confirmed, ...). */
function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{formatStatus(status)}</span>
}

export default StatusBadge
