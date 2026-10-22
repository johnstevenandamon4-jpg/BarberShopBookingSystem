import { useEffect, useState } from 'react'
import { fetchAllPages, getErrorMessage } from '../services/api'

/**
 * Every barber and service (all pages) for the booking dropdowns.
 * The list endpoints are paginated, so this walks every page once.
 */
export default function useCatalog() {
  const [state, setState] = useState({ services: [], barbers: [], loading: true, error: '' })

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchAllPages('/services'), fetchAllPages('/barbers')])
      .then(([services, barbers]) => {
        if (!cancelled) setState({ services, barbers, loading: false, error: '' })
      })
      .catch((error) => {
        if (!cancelled) {
          setState({ services: [], barbers: [], loading: false, error: getErrorMessage(error, 'Could not load services and barbers.') })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
