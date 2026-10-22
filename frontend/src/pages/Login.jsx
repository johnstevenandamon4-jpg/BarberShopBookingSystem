import { Link, useLocation, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/Button'
import FormInput from '../components/FormInput'
import { homePathFor, useAuth } from '../context/AuthContext'
import useForm from '../hooks/useForm'
import { validateLogin } from '../utils/validators'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { values, errors, formError, submitting, handleChange, setValue, handleSubmit } = useForm(
    { email: '', password: '' },
    validateLogin
  )

  const notice = location.state?.message

  async function onValid(credentials) {
    const user = await login({ email: credentials.email.trim(), password: credentials.password })
    // Go back to the page the visitor wanted, if it is allowed for their role.
    const wanted = location.state?.from
    const allowed = user.role === 'admin' ? wanted?.startsWith('/admin') : wanted && !wanted.startsWith('/admin')
    navigate(allowed ? wanted : homePathFor(user), { replace: true })
  }

  return (
    <AuthLayout>
      <h1>Welcome back</h1>
      <p className="login-lead">Sign in to book a barber, follow your appointments, or manage the shop.</p>

      <Alert type="info">{notice}</Alert>
      <Alert type="error">{formError}</Alert>

      <form onSubmit={handleSubmit(onValid)} noValidate>
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
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          required
        />

        <Button type="submit" className="login-submit" loading={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="auth-switch">
        New here? <Link to="/register">Create an account</Link>
      </p>

      <div className="demo-box">
        <p>Demo accounts (for the presentation)</p>
        <div className="button-row">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setValue('email', 'admin@barbershop.test')
              setValue('password', 'Admin12345!')
            }}
          >
            Fill admin
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setValue('email', 'customer1@barbershop.test')
              setValue('password', 'Customer123!')
            }}
          >
            Fill customer
          </Button>
        </div>
      </div>
    </AuthLayout>
  )
}

export default Login
