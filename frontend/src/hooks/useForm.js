import { useCallback, useState } from 'react'
import { getErrorMessage, getFieldErrors } from '../services/api'
import { hasErrors } from '../utils/validators'

/**
 * Controlled-form helper:
 *   • values / handleChange for controlled inputs
 *   • client-side validation before anything is sent
 *   • Laravel 422 errors mapped onto the matching field
 *   • submitting + formError state for buttons and banners
 */
export default function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const clearError = useCallback((name) => {
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }, [])

  const handleChange = useCallback(
    (event) => {
      const { name, type, checked, value } = event.target
      setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
      clearError(name)
    },
    [clearError]
  )

  const setValue = useCallback(
    (name, value) => {
      setValues((current) => ({ ...current, [name]: value }))
      clearError(name)
    },
    [clearError]
  )

  const handleSubmit = (onValid) => async (event) => {
    event?.preventDefault()
    setFormError('')

    const clientErrors = validate ? validate(values) : {}
    if (hasErrors(clientErrors)) {
      setErrors(clientErrors)
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      await onValid(values)
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      if (hasErrors(fieldErrors)) {
        setErrors(fieldErrors) // shown under the matching inputs
      } else {
        setFormError(getErrorMessage(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return { values, errors, formError, submitting, handleChange, setValue, handleSubmit }
}
