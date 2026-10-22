import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '../services/api'

/**
 * Fetches one page of a Laravel-paginated endpoint with loading + error state.
 *
 *   const { items, meta, loading, error, reload } = usePagedData(barberApi.list, list.params)
 *
 * `fetcher` must be a stable function (e.g. barberApi.list).
 * `options.clientFilter(items, params)` re-applies the filter to the rows.
 * `options.onEmptyPage()` runs when a later page has no rows left
 *  (e.g. after deleting the last row of the last page).
 */
export default function usePagedData(fetcher, params, options = {}) {
  const [state, setState] = useState({ items: [], meta: null, loading: true, error: '' })
  const [version, setVersion] = useState(0)
  const optionsRef = useRef(options)
  optionsRef.current = options
  const key = JSON.stringify(params)

  useEffect(() => {
    let cancelled = false
    const currentParams = JSON.parse(key)
    setState((previous) => ({ ...previous, loading: true, error: '' }))

    fetcher(currentParams)
      .then((response) => {
        if (cancelled) return
        // Plain paginator → { data, current_page, ... }
        // API Resource collection → { data, links, meta: { current_page, ... } }
        const { data, ...rest } = response
        const meta = rest.meta ?? rest
        const rows = Array.isArray(data) ? data : []
        const { clientFilter } = optionsRef.current
        setState({
          items: clientFilter ? clientFilter(rows, currentParams) : rows,
          meta,
          loading: false,
          error: '',
        })
      })
      .catch((error) => {
        if (cancelled) return
        setState((previous) => ({
          ...previous,
          loading: false,
          error: getErrorMessage(error, 'Could not load the data.'),
        }))
      })

    return () => {
      cancelled = true
    }
  }, [fetcher, key, version])

  useEffect(() => {
    const page = params.page ?? 1
    if (!state.loading && !state.error && state.items.length === 0 && page > 1) {
      optionsRef.current.onEmptyPage?.()
    }
  }, [state.loading, state.error, state.items.length, params.page])

  const reload = useCallback(() => setVersion((value) => value + 1), [])

  return { ...state, reload }
}
