import Button from './Button'

/**
 * Search box + dropdown filters for a list.
 *   filters: [{ name, label, value, options: [{ value, label }] }]
 */
function SearchToolbar({ search, onSearchChange, placeholder = 'Search...', filters = [], dates = [], onFilterChange, onReset, hasActiveFilters }) {
  return (
    <div className="toolbar" role="search">
      <div className="toolbar-search">
        <label htmlFor="list-search" className="sr-only">
          Search
        </label>
        <input
          id="list-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>

      {filters.map((filter) => (
        <div className="toolbar-filter" key={filter.name}>
          <label htmlFor={`filter-${filter.name}`} className="sr-only">
            {filter.label}
          </label>
          <select id={`filter-${filter.name}`} value={filter.value} onChange={(event) => onFilterChange(filter.name, event.target.value)}>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {dates.map((filter) => (
        <div className="toolbar-date" key={filter.name}>
          <label htmlFor={`filter-${filter.name}`} className="sr-only">
            {filter.label}
          </label>
          <input
            id={`filter-${filter.name}`}
            type="date"
            value={filter.value}
            onChange={(event) => onFilterChange(filter.name, event.target.value)}
            title={filter.label}
          />
        </div>
      ))}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Clear
        </Button>
      )}
    </div>
  )
}

export default SearchToolbar
