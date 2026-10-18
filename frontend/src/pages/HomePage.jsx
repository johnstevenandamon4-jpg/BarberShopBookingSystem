import React from 'react'

function HomePage({
  user,
  isCustomer,
  openLogin,
  services,
  servicesLoading,
  servicePagination,
  setServicePage,
  barbers,
  barbersLoading,
  barberPagination,
  setBarberPage,
  bookingBarbers,
  bookingBarberId,
  setBookingBarberId,
  bookingServiceId,
  setBookingServiceId,
  bookingDate,
  setBookingDate,
  bookingTime,
  setBookingTime,
  bookingNotes,
  setBookingNotes,
  bookingError,
  bookingMessage,
  bookingLoading,
  handleBooking,
  today,
  scrollToSection,
}) {
  return (
    <>
      {user && (
        <section className="account-panel">
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h2>Welcome, {user.name}!</h2>
          <p>Email: {user.email}</p>
          <p>
            Account type:{' '}
            <span
              style={{
                display: 'inline-block',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                color: user.role === 'admin' ? '#ffffff' : '#222222',
                backgroundColor:
                  user.role === 'admin' ? '#276749' : '#e5e7eb',
              }}
            >
              {user.role === 'admin'
                ? 'ADMIN'
                : user.role === 'customer'
                  ? 'CUSTOMER'
                  : 'ROLE NOT SET'}
            </span>
          </p>
          <p>You are successfully logged in.</p>
        </section>
      )}

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="eyebrow">YOUR STYLE, OUR CRAFT</p>
          <h1>
            A Fresh Cut.
            <br />
            <span>A Better You.</span>
          </h1>
          <p className="hero-description">
            Find your barber, choose your service, and book your next visit
            with ease.
          </p>
          <a
            className="primary-button"
            href="#booking"
            onClick={(event) => scrollToSection('booking', event)}
          >
            Book an Appointment →
          </a>
        </div>

        <div className="hero-art" aria-label="Barber shop illustration">
          <div className="pole">
            <span />
            <span />
            <span />
          </div>
          <div className="art-circle">
            <div className="scissors">✂</div>
            <div className="comb">▤</div>
            <p>
              CLASSIC CUTS
              <br />
              MODERN STYLE
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WHAT WE OFFER</p>
            <h2>Our Services</h2>
          </div>
          <p>Quality grooming for every style.</p>
        </div>

        {servicesLoading && services.length === 0 ? (
          <p>Loading services...</p>
        ) : (
          <>
            <div className="service-grid">
              {services.map((service) => (
                <article className="service-card" key={service.id}>
                  <div className="service-icon">✂</div>
                  <h3>{service.name}</h3>
                  <p>
                    {service.description ||
                      'Professional barber service.'}
                  </p>
                  <div className="service-bottom">
                    <strong>₱{Number(service.price).toFixed(2)}</strong>
                    <span>{service.duration_minutes} min</span>
                  </div>
                </article>
              ))}
            </div>

            {servicePagination && (
              <div className="pagination-controls">
                <button
                  type="button"
                  onClick={() =>
                    setServicePage((page) => Math.max(1, page - 1))
                  }
                  disabled={servicePagination.current_page <= 1}
                >
                  Previous
                </button>
                <span>
                  Page {servicePagination.current_page} of{' '}
                  {servicePagination.last_page}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setServicePage((page) =>
                      Math.min(servicePagination.last_page, page + 1)
                    )
                  }
                  disabled={
                    servicePagination.current_page >=
                    servicePagination.last_page
                  }
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="section barbers-section" id="barbers">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MEET THE TEAM</p>
            <h2>Our Barbers</h2>
          </div>
          <p>Experienced hands. Sharp results.</p>
        </div>

        {barbersLoading && barbers.length === 0 ? (
          <p>Loading barbers...</p>
        ) : (
          <>
            <div className="barber-grid">
              {barbers.map((barber) => (
                <article className="barber-card" key={barber.id}>
                  <div className="barber-avatar">
                    {barber.name.charAt(0)}
                  </div>
                  <h3>{barber.name}</h3>
                  <p>{barber.description || 'Professional barber'}</p>
                  <span
                    className={
                      barber.is_available
                        ? 'status available'
                        : 'status unavailable'
                    }
                  >
                    {barber.is_available
                      ? 'Available'
                      : 'Currently unavailable'}
                  </span>
                </article>
              ))}
            </div>

            {barberPagination && (
              <div className="pagination-controls">
                <button
                  type="button"
                  onClick={() =>
                    setBarberPage((page) => Math.max(1, page - 1))
                  }
                  disabled={barberPagination.current_page <= 1}
                >
                  Previous
                </button>
                <span>
                  Page {barberPagination.current_page} of{' '}
                  {barberPagination.last_page}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setBarberPage((page) =>
                      Math.min(barberPagination.last_page, page + 1)
                    )
                  }
                  disabled={
                    barberPagination.current_page >=
                    barberPagination.last_page
                  }
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="booking-banner" id="booking">
        <p className="eyebrow">READY FOR A FRESH LOOK?</p>
        <h2>Your Next Great Haircut Starts Here.</h2>
        <p>Choose from our services and meet our barbers.</p>

        {!user && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <button
              className="primary-button"
              type="button"
              onClick={() => openLogin('customer')}
            >
              Customer Login →
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={() => openLogin('admin')}
            >
              Admin Login →
            </button>
          </div>
        )}

        {isCustomer && (
          <div
            className="login-card"
            style={{
              maxWidth: '560px',
              width: '100%',
              margin: '24px auto 0',
              textAlign: 'left',
            }}
          >
            <h3>Book an Appointment</h3>
            <p>Choose a barber, service, date, and time.</p>

            <form onSubmit={handleBooking} noValidate>
              <label htmlFor="booking-barber">Choose a Barber</label>
              <select
                id="booking-barber"
                value={bookingBarberId}
                onChange={(event) => setBookingBarberId(event.target.value)}
                required
              >
                <option value="">Select a barber</option>
                {bookingBarbers
                  .filter((barber) => barber.is_available)
                  .map((barber) => (
                    <option key={barber.id} value={barber.id}>
                      {barber.name}
                    </option>
                  ))}
              </select>

              <label htmlFor="booking-service">Choose a Service</label>
              <select
                id="booking-service"
                value={bookingServiceId}
                onChange={(event) => setBookingServiceId(event.target.value)}
                required
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} — ₱{Number(service.price).toFixed(2)}
                  </option>
                ))}
              </select>

              <label htmlFor="booking-date">Appointment Date</label>
              <input
                id="booking-date"
                type="date"
                min={today}
                value={bookingDate}
                onChange={(event) => setBookingDate(event.target.value)}
                required
              />

              <label htmlFor="booking-time">Appointment Time</label>
              <input
                id="booking-time"
                type="time"
                value={bookingTime}
                onChange={(event) => setBookingTime(event.target.value)}
                required
              />

              <label htmlFor="booking-notes">Notes (Optional)</label>
              <textarea
                id="booking-notes"
                value={bookingNotes}
                onChange={(event) => setBookingNotes(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Any special requests?"
              />

              {bookingError && (
                <p className="error-message" role="alert">
                  {bookingError}
                </p>
              )}

              {bookingMessage && (
                <output
                  className="success-message"
                  style={{ display: 'block' }}
                >
                  {bookingMessage}
                </output>
              )}

              <button
                className="primary-button login-submit"
                type="submit"
                disabled={bookingLoading}
              >
                {bookingLoading
                  ? 'Submitting...'
                  : 'Confirm Appointment'}
              </button>
            </form>
          </div>
        )}
      </section>
    </>
  )
}

export default HomePage
