/**
 * Labelled form control with an inline error message.
 *   as: 'input' (default) | 'select' | 'textarea'
 * Pass `error` to show a validation message directly under the field.
 */
function FormInput({
  label,
  name,
  as = 'input',
  type = 'text',
  value,
  onChange,
  error,
  hint,
  required = false,
  className = '',
  children,
  ...rest
}) {
  const id = `field-${name}`
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const Control = as

  return (
    <div className={`form-group ${className}`.trim()}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>

      <Control
        id={id}
        name={name}
        type={as === 'input' ? type : undefined}
        value={value}
        onChange={onChange}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {children}
      </Control>

      {hint && !error && (
        <small id={`${id}-hint`} className="form-help">
          {hint}
        </small>
      )}
      {error && (
        <small id={`${id}-error`} className="field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  )
}

export default FormInput
