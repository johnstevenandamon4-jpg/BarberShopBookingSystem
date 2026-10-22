/**
 * Reusable button.
 *   variant: primary | secondary | danger | ghost
 *   size:    md | sm
 *   loading: shows a spinner and disables the button
 */
function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="button-spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}

export default Button
