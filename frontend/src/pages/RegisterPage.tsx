import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Field } from '../components/ui'
import { homeFor, useSession } from '../session'
import { useAction } from '../toast'
import type { User } from '../types'

export function RegisterPage() {
  const { signIn } = useSession()
  const navigate = useNavigate()
  const { run, busy } = useAction()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', contactNumber: '' })

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    let created: User | undefined
    const ok = await run(async () => {
      created = await api.auth.register(form)
    }, 'Account created. Welcome!')
    if (ok && created) {
      signIn(created)
      navigate(homeFor(created.role))
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={(e) => void submit(e)}>
        <h1>Create a tenant account</h1>
        <p className="muted">Register to browse and reserve rooms.</p>

        <div className="form-grid">
          <Field label="First name">
            <input required value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
          </Field>
          <Field label="Last name">
            <input required value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
          </Field>
        </div>
        <Field label="Email">
          <input required type="email" value={form.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Contact number">
          <input value={form.contactNumber} onChange={set('contactNumber')} autoComplete="tel" placeholder="09XX XXX XXXX" />
        </Field>
        <Field label="Password">
          <input required type="password" minLength={6} value={form.password} onChange={set('password')} autoComplete="new-password" />
        </Field>

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="muted small center">
          Already registered? <Link to="/login">Choose your account</Link>
        </p>
      </form>
    </div>
  )
}
