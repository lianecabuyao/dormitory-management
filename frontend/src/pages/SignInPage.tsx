import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Field } from '../components/ui'
import { homeFor, useSession } from '../session'
import { useAction } from '../toast'
import type { Portal, User } from '../types'

const COPY: Record<Portal, { title: string; subtitle: string }> = {
  TENANT: { title: 'Tenant sign in', subtitle: 'Reserve rooms, pay rent and report issues.' },
  STAFF: { title: 'Staff sign in', subtitle: 'For administrators and landlords.' },
}

/** Rendered at /login (portal TENANT) and /admin (portal STAFF). */
export function SignInPage({ portal }: { portal: Portal }) {
  const { user, signIn } = useSession()
  const navigate = useNavigate()
  const { run, busy } = useAction()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (user) return <Navigate to={homeFor(user.role)} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    let signedIn: User | undefined
    await run(async () => {
      signedIn = await api.auth.login(email.trim(), password, portal)
    })
    if (signedIn) {
      signIn(signedIn)
      navigate(homeFor(signedIn.role))
    }
  }

  const { title, subtitle } = COPY[portal]

  return (
    <div className="auth-page">
      <div className="auth-column">
        <form className="auth-card" onSubmit={(e) => void submit(e)}>
          <div className="brand brand-large">
            <span className="brand-mark" aria-hidden="true">
              D
            </span>
            <span className="brand-name">DormiSync</span>
          </div>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>

          <Field label="Email">
            <input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          {portal === 'TENANT' ? (
            <p className="muted small center">
              New here? <Link to="/register">Create a tenant account</Link>
            </p>
          ) : (
            <p className="muted small center">
              Tenant? <Link to="/login">Sign in here</Link>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

