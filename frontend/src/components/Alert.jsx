/** type: error | success | info. Errors are announced immediately by screen readers. */
function Alert({ type = 'error', children, onDismiss }) {
  if (!children) return null

  const role = type === 'error' ? 'alert' : 'status'
  const className = type === 'error' ? 'error-message' : type === 'success' ? 'success-message' : 'info-message'

  return (
    <div className={`${className} alert-row`} role={role}>
      <span>{children}</span>
      {onDismiss && (
        <button type="button" className="alert-close" onClick={onDismiss} aria-label="Dismiss message">
          ×
        </button>
      )}
    </div>
  )
}

export default Alert
