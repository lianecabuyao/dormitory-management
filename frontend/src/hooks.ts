import { useCallback, useEffect, useState } from 'react'

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export interface LoadState<T> {
  data: T | null
  error: string | null
  loading: boolean
  reload: () => Promise<void>
}

/** Runs `load` on mount (and whenever `deps` change) and tracks loading/error state. */
export function useLoad<T>(load: () => Promise<T>, deps: readonly unknown[] = []): LoadState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // `load` is usually an inline arrow; callers list what it depends on in `deps`.
  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setData(await load())
      setError(null)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, error, loading, reload }
}
