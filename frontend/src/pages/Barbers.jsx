import { Link } from 'react-router-dom'
import Alert from '../components/Alert'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import Pagination from '../components/Pagination'
import SearchToolbar from '../components/SearchToolbar'
import useListControls from '../hooks/useListControls'
import usePagedData from '../hooks/usePagedData'
import { barberApi } from '../services/barberApi'
import { matchesSearch } from '../utils/filters'

const availabilityOptions = [
  { value: '', label: 'All barbers' },
  { value: '1', label: 'Available' },
  { value: '0', label: 'Unavailable' },
]

function clientFilter(rows, params) {
  return rows.filter(
    (barber) =>
      matchesSearch([barber.name, barber.description], params.search) &&
      (params.available === undefined || Boolean(barber.is_available) === (params.available === '1'))
  )
}

function Barbers() {
  const list = useListControls({ available: '' })
  const { items, meta, loading, error } = usePagedData(barberApi.list, list.params, {
    clientFilter,
    onEmptyPage: () => list.setPage(list.page - 1),
  })

  return (
    <section className="section" id="barbers">
      <div className="section-heading">
        <div>
          <h2 className="section-title">Our barbers</h2>
          <p className="section-description">Meet the team and book the barber you like.</p>
        </div>
        {meta && <span className="section-count">{meta.total} total</span>}
      </div>

      <SearchToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        placeholder="Search barbers..."
        filters={[{ name: 'available', label: 'Availability', value: list.filters.available, options: availabilityOptions }]}
        onFilterChange={list.setFilter}
        onReset={list.reset}
        hasActiveFilters={list.hasActiveFilters}
      />

      <Alert type="error">{error}</Alert>

      {loading && items.length === 0 ? (
        <LoadingState label="Loading barbers..." />
      ) : items.length === 0 && !error ? (
        <EmptyState title="No barbers found" message="Try a different search or clear the filters." />
      ) : (
        <div className={`barber-grid${loading ? ' is-refreshing' : ''}`}>
          {items.map((barber) => (
            <article className="barber-card" key={barber.id}>
              <div className="barber-card-header">
                <span className="barber-avatar" aria-hidden="true">
                  {barber.name.charAt(0).toUpperCase()}
                </span>
                <span className={`barber-status ${barber.is_available ? 'barber-available' : 'barber-unavailable'}`}>
                  <span className="status-dot" aria-hidden="true" />
                  {barber.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <h3 className="barber-name">{barber.name}</h3>
              <p className="barber-description">{barber.description || 'No description provided.'}</p>
              {barber.phone && <p className="barber-contact">{barber.phone}</p>}
              {barber.is_available ? (
                <Link className="barber-book-button" to={`/book?barber=${barber.id}`}>
                  Choose this barber
                </Link>
              ) : (
                <button className="barber-book-button" type="button" disabled>
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

export default Barbers
