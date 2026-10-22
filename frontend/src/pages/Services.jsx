import { Link } from 'react-router-dom'
import Alert from '../components/Alert'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import Pagination from '../components/Pagination'
import SearchToolbar from '../components/SearchToolbar'
import useListControls from '../hooks/useListControls'
import usePagedData from '../hooks/usePagedData'
import { serviceApi } from '../services/serviceApi'
import { matchesSearch } from '../utils/filters'
import { formatPrice } from '../utils/format'

const availabilityOptions = [
  { value: '', label: 'All services' },
  { value: '1', label: 'Available' },
  { value: '0', label: 'Unavailable' },
]

function clientFilter(rows, params) {
  return rows.filter(
    (service) =>
      matchesSearch([service.name, service.description], params.search) &&
      (params.active === undefined || Boolean(service.is_active) === (params.active === '1'))
  )
}

function Services() {
  const list = useListControls({ active: '' })
  const { items, meta, loading, error } = usePagedData(serviceApi.list, list.params, {
    clientFilter,
    onEmptyPage: () => list.setPage(list.page - 1),
  })

  return (
    <section className="section" id="services">
      <div className="section-heading">
        <div>
          <h2 className="section-title">Services</h2>
          <p className="section-description">Pick what you need, then book it with your preferred barber.</p>
        </div>
        {meta && <span className="section-count">{meta.total} total</span>}
      </div>

      <SearchToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        placeholder="Search services..."
        filters={[{ name: 'active', label: 'Availability', value: list.filters.active, options: availabilityOptions }]}
        onFilterChange={list.setFilter}
        onReset={list.reset}
        hasActiveFilters={list.hasActiveFilters}
      />

      <Alert type="error">{error}</Alert>

      {loading && items.length === 0 ? (
        <LoadingState label="Loading services..." />
      ) : items.length === 0 && !error ? (
        <EmptyState title="No services found" message="Try a different search or clear the filters." />
      ) : (
        <div className={`service-grid${loading ? ' is-refreshing' : ''}`}>
          {items.map((service) => (
            <article className="service-card" key={service.id}>
              <div className="service-card-top">
                <span className="service-icon" aria-hidden="true">
                  ✂
                </span>
                <span className={`barber-status ${service.is_active ? 'barber-available' : 'barber-unavailable'}`}>
                  <span className="status-dot" aria-hidden="true" />
                  {service.is_active ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <h3 className="service-name">{service.name}</h3>
              <p className="service-description">{service.description || 'No description provided.'}</p>
              <div className="service-card-footer">
                <div>
                  <span className="service-price-label">Price</span>
                  <span className="service-price">{formatPrice(service.price)}</span>
                </div>
                <span className="service-duration">{service.duration_minutes} min</span>
              </div>
              {service.is_active ? (
                <Link className="service-book-link" to={`/book?service=${service.id}`}>
                  Book this service
                </Link>
              ) : (
                <button className="service-book-link" type="button" disabled>
                  Currently unavailable
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      <Pagination meta={meta} onPageChange={list.setPage} disabled={loading} />
    </section>
  )
}

export default Services
