import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import { Card, Field, ListState, PageHeader, StatusBadge, Tabs } from '../../components/ui'
import { fullName, label } from '../../format'
import { useLoad } from '../../hooks'
import { useCurrentUser } from '../../session'
import { useAction } from '../../toast'
import { USER_ROLES, type User, type UserRole } from '../../types'

type Filter = 'ALL' | UserRole
const FILTERS: Filter[] = ['ALL', ...USER_ROLES]

export function UsersPage() {
  const me = useCurrentUser()
  const users = useLoad(() => api.users.list())
  const { run, busy } = useAction()
  const [filter, setFilter] = useState<Filter>('ALL')
  const [adding, setAdding] = useState(false)

  const counts: Partial<Record<Filter, number>> = { ALL: users.data?.length ?? 0 }
  for (const u of users.data ?? []) counts[u.role] = (counts[u.role] ?? 0) + 1

  const remove = async (u: User) => {
    if (!window.confirm(`Delete ${fullName(u)}? Users with reservations, leases or payments can't be deleted.`)) return
    if (await run(() => api.users.remove(u.id), `${fullName(u)} deleted.`)) await users.reload()
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Tenants, administrators and landlords."
        actions={
          !adding && (
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
              Add user
            </button>
          )
        }
      />

      {adding && (
        <UserForm
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            void users.reload()
          }}
        />
      )}

      <Tabs value={filter} options={FILTERS} onChange={setFilter} counts={counts} />

      <ListState state={users} empty="No users yet.">
        {(list) => {
          const shown = list.filter((u) => filter === 'ALL' || u.role === filter).sort((a, b) => a.lastName.localeCompare(b.lastName))
          if (shown.length === 0) return <p className="muted state">No {label(filter).toLowerCase()} users.</p>
          return (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Role</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{fullName(u)}</strong>
                        {u.id === me.id && <span className="muted small"> (you)</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>{u.contactNumber || '—'}</td>
                      <td>
                        <StatusBadge status={u.role} />
                      </td>
                      <td className="actions">
                        {u.id !== me.id && (
                          <button type="button" className="btn btn-small btn-danger-ghost" disabled={busy} onClick={() => void remove(u)}>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }}
      </ListState>
    </>
  )
}

function UserForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { run, busy } = useAction()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactNumber: '',
    role: 'TENANT' as UserRole,
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await run(() => api.users.create(form), `${form.firstName} ${form.lastName} added.`)
    if (ok) onSaved()
  }

  return (
    <Card title="New user">
      <form onSubmit={(e) => void submit(e)}>
        <div className="form-grid">
          <Field label="First name">
            <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Last name">
            <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
          <Field label="Email">
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Contact number">
            <input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
          </Field>
          <Field label="Temporary password">
            <input
              required
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Role">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {label(r)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="row-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Add user'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Card>
  )
}
