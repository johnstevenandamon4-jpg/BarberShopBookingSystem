import { useCallback, useMemo, useState } from 'react'
import useDebouncedValue from './useDebouncedValue'

/**
 * State for a searchable / filterable / paginated list.
 * Changing the search text or any filter automatically returns to page 1.
 *
 *   const list = useListControls({ status: '' })
 *   list.params  → { page: 1, search: 'fade', status: 'pending' }
 */
export default function useListControls(initialFilters = {}) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(initialFilters)
  const debouncedSearch = useDebouncedValue(search, 350)

  // The page is stored together with the search/filter it belongs to. When
  // the search or a filter changes the stored page is ignored (→ page 1)
  // without needing an extra effect or a second request.
  const signature = JSON.stringify([debouncedSearch, filters])
  const [pageState, setPageState] = useState({ signature, page: 1 })
  const page = pageState.signature === signature ? pageState.page : 1

  const setPage = useCallback((next) => setPageState({ signature, page: next }), [signature])
  const setFilter = useCallback((name, value) => setFilters((current) => ({ ...current, [name]: value })), [])
  const reset = useCallback(() => {
    setSearch('')
    setFilters(initialFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const params = useMemo(() => {
    const result = { page }
    if (debouncedSearch.trim()) result.search = debouncedSearch.trim()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '') result[key] = value
    })
    return result
  }, [page, debouncedSearch, filters])

  const hasActiveFilters = Boolean(search) || Object.values(filters).some((value) => value !== '')

  return { search, setSearch, filters, setFilter, page, setPage, params, reset, hasActiveFilters }
}
