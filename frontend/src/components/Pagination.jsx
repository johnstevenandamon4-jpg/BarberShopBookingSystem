import Button from './Button'

/** Previous / Next controls for a Laravel paginator (current_page, last_page, total). */
function Pagination({ meta, onPageChange, disabled = false }) {
  if (!meta || !meta.total) return null

  const { current_page: current, last_page: last, total } = meta

  return (
    <nav className="pagination-controls" aria-label="Pagination">
      {last > 1 && (
        <Button variant="secondary" size="sm" disabled={disabled || current <= 1} onClick={() => onPageChange(current - 1)}>
          Previous
        </Button>
      )}
      <span aria-live="polite">
        Page {current} of {last} · {total} {total === 1 ? 'record' : 'records'}
      </span>
      {last > 1 && (
        <Button variant="secondary" size="sm" disabled={disabled || current >= last} onClick={() => onPageChange(current + 1)}>
          Next
        </Button>
      )}
    </nav>
  )
}

export default Pagination
