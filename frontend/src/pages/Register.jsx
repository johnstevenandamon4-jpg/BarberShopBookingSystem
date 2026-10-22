import { Link, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/Button'
import FormInput from '../components/FormInput'
import { useAuth } from '../context/AuthContext'
import useForm from '../hooks/useForm'
import { validateRegister } from '../utils/validators'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const { values, errors, formError, submitting, handleChange, handleSubmit } = useForm(
    { name: '', email: '', password: '', password_confirmation: '' },
    validateRegister
  )

  async function onValid(form) {
    await register({ ...form, name: form.name.trim(), email: form.email.trim() })
    navigate('/', { replace: true })
  }

  return (
    <AuthLayout>
      <h1>Create your account</h1>
      <p className="login-lead">Customer accounts can book barbers and track their appointments.</p>

      <Alert type="error">{formError}</Alert>

      <form onSubmit={handleSubmit(onValid)} noValidate>
        <FormInput label="Full name" name="name" autoComplete="name" value={values.name} onChange={handleChange} error={errors.name} required />
        <FormInput
          label="Email address"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        <FormInput
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          required
        />
        <FormInput
          label="Confirm password"
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          value={values.password_confirmation}
          onChange={handleChange}
          error={errors.password_confirmation}
          required
        />

        <Button type="submit" className="login-submit" loading={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="auth-switch">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  )
}

export default Register
