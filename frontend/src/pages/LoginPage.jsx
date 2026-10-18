function LoginPage({
  loginType,
  setLoginType,
  selectorButtonStyle,
  email,
  setEmail,
  password,
  setPassword,
  handleLogin,
  loginError,
  loginLoading,
  loginButtonText,
}) {
  return (
    <section className="login-section" id="login">
      <div className="login-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h2>Login to BarberBook</h2>
        <p>Choose your account type to continue.</p>

        <fieldset
          aria-label="Choose login type"
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '20px',
            marginBottom: '24px',
            padding: 0,
            border: 'none',
            minWidth: 0,
          }}
        >
          <button
            type="button"
            style={selectorButtonStyle('admin')}
            aria-pressed={loginType === 'admin'}
            onClick={() => setLoginType('admin')}
          >
            Admin Login
          </button>

          <button
            type="button"
            style={selectorButtonStyle('customer')}
            aria-pressed={loginType === 'customer'}
            onClick={() => setLoginType('customer')}
          >
            Customer Login
          </button>
        </fieldset>

        <p style={{ marginBottom: '16px' }}>
          Selected:{' '}
          <strong>
            {loginType === 'admin' ? 'Administrator' : 'Customer'}
          </strong>
        </p>

        <form onSubmit={handleLogin} noValidate>
          <label htmlFor="login-email">Gmail Address</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your Gmail address"
            autoComplete="username"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          {loginError && (
            <p className="error-message" role="alert">
              {loginError}
            </p>
          )}

          <button
            className="primary-button login-submit"
            type="submit"
            disabled={loginLoading}
          >
            {loginLoading ? 'Signing in...' : loginButtonText}
          </button>
        </form>
      </div>
    </section>
  )
}

export default LoginPage
