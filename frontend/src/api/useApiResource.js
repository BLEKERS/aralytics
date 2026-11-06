import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Small data-fetching hook with loading/error/empty friendly state.
 *
 *   const { data, loading, error, reload } = useApiResource(
 *     () => api.teacher.dashboard(),
 *     [],
 *   )
 *
 * `loader` may change identity without causing a refetch; pass the values it
 * depends on through `deps`.
 */
export function useApiResource(loader, deps = []) {
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let active = true
    setState((previous) => ({ ...previous, loading: true, error: null }))

    Promise.resolve()
      .then(() => loaderRef.current())
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        if (active) {
          setState((previous) => ({ data: previous.data, loading: false, error }))
        }
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  return { ...state, reload }
}
