import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { errorMessage } from './hooks'

type ToastKind = 'success' | 'error'
interface Toast {
  id: number
  kind: ToastKind
  text: string
}

type Notify = (kind: ToastKind, text: string) => void

const ToastContext = createContext<Notify>(() => {})

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback<Notify>(
    (kind, text) => {
      const id = nextId++
      setToasts((list) => [...list, { id, kind, text }])
      setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <span>{t.text}</span>
            <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): Notify {
  return useContext(ToastContext)
}

/**
 * Runs a mutation, shows a success or error toast, and tracks a busy flag.
 * Resolves to true when the action succeeded.
 */
export function useAction() {
  const notify = useToast()
  const [busy, setBusy] = useState(false)

  const run = useCallback(
    async (action: () => Promise<unknown>, successText?: string): Promise<boolean> => {
      setBusy(true)
      try {
        await action()
        if (successText) notify('success', successText)
        return true
      } catch (e) {
        notify('error', errorMessage(e))
        return false
      } finally {
        setBusy(false)
      }
    },
    [notify],
  )

  return { run, busy }
}
