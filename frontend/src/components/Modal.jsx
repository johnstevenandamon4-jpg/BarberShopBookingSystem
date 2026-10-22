import { useEffect, useId, useRef } from 'react'

/**
 * Accessible dialog: closes on Esc or backdrop click, locks page scroll,
 * moves focus into the dialog and restores it on close.
 */
function Modal({ open, title, onClose, children, footer, size = 'md', dismissible = true }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return undefined

    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    function handleKey(event) {
      if (event.key === 'Escape' && dismissible) closeRef.current?.()
    }
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, dismissible])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          {dismissible && (
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
              ×
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
