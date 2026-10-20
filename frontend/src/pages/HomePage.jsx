function HomePage({
  user,
  isCustomer,
  openLogin,
  services,
  bookingServices,
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
  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === "admin";

  const serviceList = Array.isArray(services) ? services : [];
  const bookingServiceList = Array.isArray(bookingServices)
    ? bookingServices
    : serviceList;
  const barberList = Array.isArray(barbers) ? barbers : [];
  const availableBookingBarbers = Array.isArray(bookingBarbers)
    ? bookingBarbers
    : [];

  const formatPrice = (price) => {
    const amount = Number(price);

    if (!Number.isFinite(amount)) {
      return "Price unavailable";
    }

    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDuration = (minutes) => {
    const duration = Number(minutes);

    if (!Number.isFinite(duration) || duration <= 0) {
      return null;
    }

    const hours = Math.floor(duration / 60);
    const remainingMinutes = duration % 60;

    if (hours && remainingMinutes) {
      return `${hours} hr ${remainingMinutes} min`;
    }

    if (hours) {
      return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
    }

    return `${remainingMinutes} min`;
  };

  const formatDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const getPaginationValue = (pagination, key, fallback = 1) => {
    const value = Number(pagination?.[key]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };

  const renderPagination = (
    pagination,
    setPage,
    itemName,
  ) => {
    if (!pagination || typeof setPage !== "function") {
      return null;
    }

    const currentPage = getPaginationValue(
      pagination,
      "current_page",
    );

    const lastPage = getPaginationValue(
      pagination,
      "last_page",
    );

    if (lastPage <= 1) {
      return null;
    }

    return (
      <div className="pagination" aria-label={`${itemName} pagination`}>
        <button
          type="button"
          className="secondary-button pagination-button"
          disabled={currentPage <= 1}
          onClick={() => setPage((page) => Math.max(1, page - 1))}
        >
          ← Previous
        </button>

        <span className="pagination-info">
          Page {currentPage} of {lastPage}
        </span>

        <button
          type="button"
          className="secondary-button pagination-button"
          disabled={currentPage >= lastPage}
          onClick={() =>
            setPage((page) => Math.min(lastPage, page + 1))
          }
        >
          Next →
        </button>
      </div>
    );
  };

  const handleExploreServices = (event) => {
    if (typeof scrollToSection === "function") {
      scrollToSection("services", event);
      return;
    }

    document.getElementById("services")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleBookAppointment = (event) => {
    if (typeof scrollToSection === "function") {
      scrollToSection("booking", event);
      return;
    }

    document.getElementById("booking")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="home-page">
      {/* ACCOUNT STATUS */}
      {isLoggedIn && (
        <section className="account-panel">
          <div className="account-panel-info">
            <div className="account-avatar" aria-hidden="true">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="account-eyebrow">YOUR ACCOUNT</p>
              <h2 className="account-name">
                Welcome back, {user?.name || "User"}!
              </h2>
              <p className="account-email">
                {user?.email || ""}
              </p>
            </div>
          </div>

          <span
            className={`role-badge ${
              isAdmin ? "role-admin" : "role-customer"
            }`}
          >
            {isAdmin ? "Administrator" : "Customer"}
          </span>
        </section>
      )}

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-content">
          <p className="hero-eyebrow">
            <span className="hero-eyebrow-line" />
            YOUR STYLE. YOUR TIME.
          </p>

          <h1 className="hero-title">
            A Fresh Cut.
            <br />
            <span>Every Time.</span>
          </h1>

          <p className="hero-description">
            Great hair starts with the right barber. Discover our
            services, meet our barbers, and book your next appointment
            with ease.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="primary-button"
              onClick={handleBookAppointment}
            >
              Book an Appointment
              <span aria-hidden="true"> →</span>
            </button>

            <button
              type="button"
              className="secondary-button hero-secondary-button"
              onClick={handleExploreServices}
            >
              Explore Services
            </button>

            {!isLoggedIn && typeof openLogin === "function" && (
              <button
                type="button"
                className="hero-login-button"
                onClick={() => openLogin("customer")}
              >
                Customer Login
              </button>
            )}
          </div>

          <div className="hero-trust">
            <span className="hero-trust-icon" aria-hidden="true">
              ✓
            </span>
            <span>Professional barbers</span>

            <span className="hero-trust-divider" />

            <span className="hero-trust-icon" aria-hidden="true">
              ✓
            </span>
            <span>Easy online booking</span>
          </div>
        </div>

        <div className="hero-art" aria-label="BarberBook grooming illustration">
          <div className="hero-art-glow" />

          <div className="hero-art-card">
            <div className="hero-art-top">
              <span className="hero-art-dot" />
              <span className="hero-art-dot" />
              <span className="hero-art-dot" />
              <span className="hero-art-label">BARBERBOOK</span>
            </div>

            <div className="hero-art-illustration">
              <svg
                viewBox="0 0 360 320"
                role="img"
                aria-label="Illustration of barber tools"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="barberCape"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#303833" />
                    <stop offset="100%" stopColor="#171c19" />
                  </linearGradient>

                  <linearGradient
                    id="barberMetal"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#e7e9e4" />
                    <stop offset="100%" stopColor="#929a91" />
                  </linearGradient>
                </defs>

                <circle
                  cx="180"
                  cy="150"
                  r="120"
                  fill="#c5f36a"
                  opacity="0.09"
                />

                <circle
                  cx="180"
                  cy="150"
                  r="96"
                  fill="none"
                  stroke="#c5f36a"
                  strokeWidth="1"
                  strokeDasharray="4 8"
                  opacity="0.45"
                />

                <path
                  d="M105 285 L125 155 Q135 128 155 128 L205 128 Q225 128 235 155 L255 285 Z"
                  fill="url(#barberCape)"
                  stroke="#697269"
                  strokeWidth="2"
                />

                <path
                  d="M150 128 Q180 145 210 128 L200 159 Q180 172 160 159 Z"
                  fill="#c5f36a"
                />

                <path
                  d="M145 84 Q142 43 180 39 Q218 43 215 84 L207 120 Q200 140 180 140 Q160 140 153 120 Z"
                  fill="#c58c65"
                />

                <path
                  d="M144 82 Q132 39 173 28 Q213 25 221 63 L215 88 L205 71 L190 63 L167 72 L153 92 Z"
                  fill="#252b26"
                />

                <path
                  d="M154 91 Q164 82 173 91"
                  fill="none"
                  stroke="#252b26"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                <path
                  d="M187 91 Q196 82 205 91"
                  fill="none"
                  stroke="#252b26"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                <path
                  d="M169 111 Q180 119 191 111"
                  fill="none"
                  stroke="#714632"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                <path
                  d="M153 116 Q180 133 207 116"
                  fill="none"
                  stroke="#714632"
                  strokeWidth="2"
                  opacity="0.5"
                />

                <g transform="translate(34 104) rotate(-24)">
                  <rect
                    x="0"
                    y="0"
                    width="26"
                    height="110"
                    rx="9"
                    fill="url(#barberMetal)"
                  />
                  <rect
                    x="4"
                    y="8"
                    width="18"
                    height="40"
                    rx="5"
                    fill="#252b26"
                  />
                  <rect
                    x="6"
                    y="57"
                    width="14"
                    height="44"
                    rx="4"
                    fill="#b6c0b3"
                  />
                  <path
                    d="M5 14 L21 14 M5 21 L21 21 M5 28 L21 28 M5 35 L21 35"
                    stroke="#c5f36a"
                    strokeWidth="2"
                  />
                </g>

                <g transform="translate(275 99) rotate(22)">
                  <rect
                    x="0"
                    y="0"
                    width="12"
                    height="125"
                    rx="6"
                    fill="#c5f36a"
                  />
                  <rect
                    x="-3"
                    y="86"
                    width="18"
                    height="52"
                    rx="9"
                    fill="url(#barberMetal)"
                  />
                  <circle
                    cx="6"
                    cy="105"
                    r="3"
                    fill="#303833"
                  />
                  <path
                    d="M6 0 L6 80"
                    stroke="#71825b"
                    strokeWidth="2"
                  />
                </g>

                <circle
                  cx="84"
                  cy="229"
                  r="17"
                  fill="#c5f36a"
                  opacity="0.15"
                />
                <path
                  d="M76 229 L82 235 L93 222"
                  fill="none"
                  stroke="#c5f36a"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <circle
                  cx="274"
                  cy="65"
                  r="12"
                  fill="#c5f36a"
                  opacity="0.16"
                />
                <path
                  d="M274 58 V72 M267 65 H281"
                  stroke="#c5f36a"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="hero-art-caption">
              <div>
                <strong>Look sharp.</strong>
                <span>Feel confident.</span>
              </div>
              <span className="hero-art-check" aria-hidden="true">
                ✓
              </span>
            </div>
          </div>

          <div className="hero-floating-card">
            <span className="hero-floating-icon" aria-hidden="true">
              ✦
            </span>
            <div>
              <strong>YOUR NEXT LOOK</strong>
              <span>Starts right here</span>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section services-section" id="services">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">WHAT WE OFFER</p>
            <h2 className="section-title">
              Services That Keep You <span>Sharp.</span>
            </h2>
            <p className="section-description">
              Find the right service for your style and budget.
            </p>
          </div>

          <span className="section-count">
            {serviceList.length}{" "}
            {serviceList.length === 1 ? "service" : "services"}
          </span>
        </div>

        {servicesLoading ? (
          <div className="loading-state" role="status">
            <span className="loading-spinner" />
            <p>Loading our services...</p>
          </div>
        ) : serviceList.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">
              ✂
            </span>
            <h3>No services available yet</h3>
            <p>Please check back later for our available services.</p>
          </div>
        ) : (
          <div className="service-grid">
            {serviceList.map((service) => (
              <article
                className="service-card"
                key={service.id}
              >
                <div className="service-card-top">
                  <span className="service-icon" aria-hidden="true">
                    ✂
                  </span>

                  <span className="service-card-number">
                    #{String(service.id).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="service-name">
                  {service.name || "Untitled Service"}
                </h3>

                <p className="service-description">
                  {service.description ||
                    "Professional grooming tailored to your style."}
                </p>

                <div className="service-card-footer">
                  <div>
                    <span className="service-price-label">PRICE</span>
                    <strong className="service-price">
                      {formatPrice(service.price)}
                    </strong>
                  </div>

                  <div className="service-duration">
                    <span aria-hidden="true">◷</span>
                    {formatDuration(service.duration_minutes) ||
                      "Duration varies"}
                  </div>
                </div>

                <button
                  type="button"
                  className="service-book-link"
                  onClick={() => {
                    if (service.id != null) {
                      setBookingServiceId(String(service.id));
                    }
                    handleBookAppointment();
                  }}
                >
                  Book this service <span aria-hidden="true">→</span>
                </button>
              </article>
            ))}
          </div>
        )}

        {renderPagination(
          servicePagination,
          setServicePage,
          "Services",
        )}
      </section>

      {/* BARBERS */}
      <section className="section barbers-section" id="barbers">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">MEET THE TEAM</p>
            <h2 className="section-title">
              Skilled Hands. <span>Fresh Styles.</span>
            </h2>
            <p className="section-description">
              Meet our barbers and choose the professional you want
              for your next appointment.
            </p>
          </div>

          <span className="section-count">
            {barberList.length}{" "}
            {barberList.length === 1 ? "barber" : "barbers"}
          </span>
        </div>

        {barbersLoading ? (
          <div className="loading-state" role="status">
            <span className="loading-spinner" />
            <p>Meeting our barbers...</p>
          </div>
        ) : barberList.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">
              ✦
            </span>
            <h3>No barbers available yet</h3>
            <p>Please check back later for our barber listings.</p>
          </div>
        ) : (
          <div className="barber-grid">
            {barberList.map((barber) => (
              <article
                className="barber-card"
                key={barber.id}
              >
                <div className="barber-card-header">
                  <div className="barber-avatar" aria-hidden="true">
                    {(barber.name || "B")
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <span
                    className={`barber-status ${
                      barber.is_available
                        ? "barber-available"
                        : "barber-unavailable"
                    }`}
                  >
                    <span className="status-dot" />
                    {barber.is_available
                      ? "Available"
                      : "Unavailable"}
                  </span>
                </div>

                <h3 className="barber-name">
                  {barber.name || "Barber"}
                </h3>

                <p className="barber-description">
                  {barber.description ||
                    "A dedicated professional ready to help you look your best."}
                </p>

                {barber.email && (
                  <p className="barber-contact">
                    <span aria-hidden="true">✉</span>
                    {barber.email}
                  </p>
                )}

                {barber.phone && (
                  <p className="barber-contact">
                    <span aria-hidden="true">☎</span>
                    {barber.phone}
                  </p>
                )}

                <button
                  type="button"
                  className="barber-book-button"
                  disabled={!barber.is_available}
                  onClick={() => {
                    if (barber.id != null) {
                      setBookingBarberId(String(barber.id));
                    }
                    handleBookAppointment();
                  }}
                >
                  {barber.is_available
                    ? "Choose this barber →"
                    : "Currently unavailable"}
                </button>
              </article>
            ))}
          </div>
        )}

        {renderPagination(
          barberPagination,
          setBarberPage,
          "Barbers",
        )}
      </section>

      {/* BOOKING INTRODUCTION */}
      <section className="booking-banner" id="booking">
        <div className="booking-banner-content">
          <p className="section-eyebrow">YOUR NEXT APPOINTMENT</p>
          <h2>
            Ready for a <span>Fresh Look?</span>
          </h2>
          <p>
            Choose your preferred barber, select a service, and
            request your appointment online.
          </p>
        </div>

        {!isLoggedIn && (
          <div className="booking-login-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => openLogin("customer")}
            >
              Customer Login
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => openLogin("admin")}
            >
              Admin Login
            </button>
          </div>
        )}

        {isAdmin && (
          <p className="booking-admin-notice">
            You are signed in as an administrator. Manage appointments
            from your admin dashboard.
          </p>
        )}

        {isCustomer && (
          <p className="booking-customer-notice">
            You are signed in. Complete the form below to request
            your appointment.
          </p>
        )}
      </section>

      {/* CUSTOMER BOOKING FORM */}
      {isCustomer && (
        <section className="section booking-form-section">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">BOOK ONLINE</p>
              <h2 className="section-title">
                Make Your <span>Appointment.</span>
              </h2>
              <p className="section-description">
                Select your service, preferred barber, date, and time.
              </p>
            </div>
          </div>

          <form
            className="booking-form-card"
            onSubmit={handleBooking}
          >
            {bookingError && (
              <div
                className="error-message"
                role="alert"
              >
                <span aria-hidden="true">!</span>
                {bookingError}
              </div>
            )}

            {bookingMessage && (
              <div
                className="success-message"
                role="status"
              >
                <span aria-hidden="true">✓</span>
                {bookingMessage}
              </div>
            )}

            <div className="booking-form-heading">
              <span className="booking-form-icon" aria-hidden="true">
                ✂
              </span>
              <div>
                <h3>Appointment Details</h3>
                <p>Fields marked with * are required.</p>
              </div>
            </div>

            <div className="booking-form-grid">
              <div className="form-group">
                <label htmlFor="booking-service">
                  Select a Service <span>*</span>
                </label>

                <select
                  id="booking-service"
                  name="service_id"
                  value={bookingServiceId ?? ""}
                  onChange={(event) =>
                    setBookingServiceId(event.target.value)
                  }
                  required
                >
                  <option value="">Choose a service</option>

                  {bookingServiceList.map((service) => (
                    <option
                      key={service.id}
                      value={service.id}
                    >
                      {service.name} — {formatPrice(service.price)}
                    </option>
                  ))}
                </select>

                {bookingServiceList.length === 0 && !servicesLoading && (
                  <small className="form-help">
                    No services are currently available.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="booking-barber">
                  Select a Barber <span>*</span>
                </label>

                <select
                  id="booking-barber"
                  name="barber_id"
                  value={bookingBarberId ?? ""}
                  onChange={(event) =>
                    setBookingBarberId(event.target.value)
                  }
                  required
                >
                  <option value="">Choose a barber</option>

                  {availableBookingBarbers.map((barber) => (
                    <option
                      key={barber.id}
                      value={barber.id}
                      disabled={barber.is_available === false}
                    >
                      {barber.name}
                      {barber.is_available === false
                        ? " (Unavailable)"
                        : ""}
                    </option>
                  ))}
                </select>

                {availableBookingBarbers.length === 0 && (
                  <small className="form-help">
                    No barbers are currently available for selection.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="booking-date">
                  Appointment Date <span>*</span>
                </label>

                <input
                  id="booking-date"
                  type="date"
                  name="appointment_date"
                  value={bookingDate ?? ""}
                  min={today || undefined}
                  onChange={(event) =>
                    setBookingDate(event.target.value)
                  }
                  required
                />

                {bookingDate && today && bookingDate < today && (
                  <small className="form-help form-help-error">
                    Please choose today or a future date.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="booking-time">
                  Appointment Time <span>*</span>
                </label>

                <input
                  id="booking-time"
                  type="time"
                  name="appointment_time"
                  value={bookingTime ?? ""}
                  onChange={(event) =>
                    setBookingTime(event.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="booking-notes">
                  Additional Notes <span className="optional-label">(Optional)</span>
                </label>

                <textarea
                  id="booking-notes"
                  name="notes"
                  value={bookingNotes ?? ""}
                  onChange={(event) =>
                    setBookingNotes(event.target.value)
                  }
                  placeholder="Any preferred style or instructions for your barber?"
                  rows={4}
                  maxLength={1000}
                />

                <small className="form-help">
                  {(bookingNotes || "").length}/1000 characters
                </small>
              </div>
            </div>

            <div className="booking-form-footer">
              <p className="booking-form-disclaimer">
                Your appointment request will be subject to availability
                and confirmation.
              </p>

              <button
                type="submit"
                className="primary-button booking-submit-button"
                disabled={
                  bookingLoading ||
                  !bookingServiceId ||
                  !bookingBarberId ||
                  !bookingDate ||
                  !bookingTime ||
                  Boolean(today && bookingDate < today)
                }
              >
                {bookingLoading ? (
                  <>
                    <span className="button-spinner" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Request Appointment
                    <span aria-hidden="true"> →</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="home-footer-brand">
          <span className="footer-brand-mark" aria-hidden="true">
            B
          </span>
          <div>
            <strong>BARBERBOOK</strong>
            <span>Your style, your time.</span>
          </div>
        </div>

        <p>
          © {new Date().getFullYear()} BarberBook. All rights reserved.
        </p>

        <button
          type="button"
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          ↑ Back to Top
        </button>
      </footer>
    </main>
  );
}

export default HomePage;
