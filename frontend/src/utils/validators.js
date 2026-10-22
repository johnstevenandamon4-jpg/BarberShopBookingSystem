import { todayISO } from './format'

export const hasErrors = (errors) => Object.keys(errors).length > 0
export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export function validateLogin({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Please enter your email address.'
  else if (!isEmail(email.trim())) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Please enter your password.'
  return errors
}

export function validateRegister({ name, email, password, password_confirmation }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Please enter your full name.'
  else if (name.trim().length > 255) errors.name = 'Name must be 255 characters or fewer.'
  if (!email.trim()) errors.email = 'Please enter your email address.'
  else if (!isEmail(email.trim())) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Please choose a password.'
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.'
  if (password_confirmation !== password) errors.password_confirmation = 'Passwords do not match.'
  return errors
}

export function validateAppointment(values) {
  const errors = {}
  if (!values.service_id) errors.service_id = 'Please choose a service.'
  if (!values.barber_id) errors.barber_id = 'Please choose a barber.'
  if (!values.appointment_date) errors.appointment_date = 'Please pick a date.'
  else if (values.appointment_date < todayISO()) errors.appointment_date = 'The date cannot be in the past.'
  if (!values.appointment_time) errors.appointment_time = 'Please pick a time.'
  if ((values.notes ?? '').length > 1000) errors.notes = 'Notes must be 1000 characters or fewer.'
  return errors
}

export function validateBarber(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please enter the barber’s name.'
  else if (values.name.length > 255) errors.name = 'Name must be 255 characters or fewer.'
  if (values.email.trim() && !isEmail(values.email.trim())) errors.email = 'Enter a valid email address.'
  if (values.phone.length > 255) errors.phone = 'Phone must be 255 characters or fewer.'
  return errors
}

export function validateService(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please enter the service name.'
  else if (values.name.length > 255) errors.name = 'Name must be 255 characters or fewer.'
  if (values.price === '' || Number.isNaN(Number(values.price))) errors.price = 'Enter a price.'
  else if (Number(values.price) < 0) errors.price = 'Price cannot be negative.'
  if (values.duration_minutes === '' || Number.isNaN(Number(values.duration_minutes))) {
    errors.duration_minutes = 'Enter the duration in minutes.'
  } else if (!Number.isInteger(Number(values.duration_minutes)) || Number(values.duration_minutes) < 1) {
    errors.duration_minutes = 'Duration must be a whole number of at least 1 minute.'
  }
  return errors
}
