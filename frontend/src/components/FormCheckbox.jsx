function FormCheckbox({ label, name, checked, onChange, hint }) {
  const id = `field-${name}`

  return (
    <div className="form-group form-check">
      <label htmlFor={id}>
        <input id={id} name={name} type="checkbox" checked={checked} onChange={onChange} />
        <span>{label}</span>
      </label>
      {hint && <small className="form-help">{hint}</small>}
    </div>
  )
}

export default FormCheckbox
