'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { isIgnored, setIgnored } from '@/lib/analytics'
import { fmtWhen, get, post, type User } from './api'
import { Button, C, Card, field, fieldStyle, Pill, Spinner } from './ui'

type Settings = { site_name: string; timezone: string; notify_email: string; notify_contact: string; notify_application: string; exclude_ips: string }
type Member = { id: number; email: string; name: string; role: User['role']; created_at: string; last_login: string }

const ROLE_HELP: Record<User['role'], string> = {
  owner: 'Everything, including team and settings',
  editor: 'See everything; change and delete messages and applications',
  viewer: 'See everything; change nothing',
}

export default function SettingsView({ user, onSaved }: { user: User; onSaved: () => void }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Account user={user} />
      <ThisBrowser />
      {user.role === 'owner' && <SiteSettings onSaved={onSaved} />}
      {user.role === 'owner' && <Team me={user} />}
    </div>
  )
}

function Msg({ text, ok }: { text: string; ok?: boolean | undefined }) {
  if (!text) return null
  return (
    <p role="status" className="m-0 text-[0.85rem]" style={{ color: ok ? C.up : C.down }}>
      {text}
    </p>
  )
}

function Account({ user }: { user: User }) {
  const [name, setName] = useState(user.name)
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok?: boolean | undefined }>({ text: '' })

  async function save(e: FormEvent) {
    e.preventDefault()
    setMsg({ text: '' })
    try {
      if (name !== user.name) await post('profile', { name })
      if (next) {
        if (next.length < 10) return setMsg({ text: 'Use at least 10 characters for the new password.' })
        await post('password', { current: cur, next })
        setCur('')
        setNext('')
      }
      setMsg({ text: 'Saved.', ok: true })
    } catch (err) {
      const code = (err as { code?: string | undefined }).code
      setMsg({ text: code === 'wrong_password' ? 'Your current password is not right.' : 'Could not save. Try again.' })
    }
  }

  return (
    <Card title="Your account">
      <form onSubmit={save} className="grid gap-3">
        <p className="m-0 text-[0.85rem]" style={{ color: C.muted }}>
          Signed in as <b style={{ color: C.ink }}>{user.email}</b> · <Pill>{user.role}</Pill>
        </p>
        <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} style={fieldStyle} />
        </label>
        <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
          Current password
          <input type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} className={field} style={fieldStyle} />
        </label>
        <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
          New password <span className="font-normal opacity-60">(leave empty to keep it)</span>
          <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={field} style={fieldStyle} />
        </label>
        <div className="flex items-center gap-3">
          <Button type="submit">Save</Button>
          <Msg {...msg} />
        </div>
      </form>
    </Card>
  )
}

function ThisBrowser() {
  const [ignored, setIgn] = useState(true)
  useEffect(() => setIgn(isIgnored()), [])
  return (
    <Card title="This browser">
      <label className="flex items-start gap-3 text-[0.9rem]" style={{ color: C.ink }}>
        <input
          type="checkbox"
          checked={ignored}
          onChange={(e) => {
            setIgnored(e.target.checked)
            setIgn(e.target.checked)
          }}
          className="mt-1 h-4 w-4"
        />
        <span>
          <b>Don&apos;t count my visits from this browser</b>
          <span className="block text-[0.85rem]" style={{ color: C.muted }}>
            Turned on automatically when you sign in, so your own clicks around the site don&apos;t inflate the numbers. Do this on each device you use.
          </span>
        </span>
      </label>
    </Card>
  )
}

function SiteSettings({ onSaved }: { onSaved: () => void }) {
  const [s, setS] = useState<Settings | null>(null)
  const [zones, setZones] = useState<string[]>([])
  const [ip, setIp] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok?: boolean | undefined }>({ text: '' })

  useEffect(() => {
    get<{ settings: Settings; your_ip: string; timezones: string[] }>('settings').then((d) => {
      setS(d.settings)
      setZones(d.timezones)
      setIp(d.your_ip)
    })
  }, [])
  if (!s) return <Card title="Website settings"><Spinner /></Card>
  const set = (k: keyof Settings, v: string) => setS({ ...s, [k]: v })

  async function save(e: FormEvent) {
    e.preventDefault()
    setMsg({ text: '' })
    try {
      await post('settings_save', { settings: s })
      setMsg({ text: 'Saved.', ok: true })
      onSaved()
    } catch (err) {
      const code = (err as { code?: string | undefined }).code
      setMsg({ text: code === 'email' ? 'One of the notification emails is not valid.' : code === 'timezone' ? 'Pick a timezone from the list.' : 'Could not save.' })
    }
  }

  async function test() {
    setMsg({ text: '' })
    try {
      await post('test_email')
      setMsg({ text: `Test email sent to ${s?.notify_email}. Check spam if it doesn't arrive in a minute.`, ok: true })
    } catch {
      setMsg({ text: 'Save a notification email first, then send the test.' })
    }
  }

  return (
    <Card title="Website settings" className="xl:col-span-2">
      <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
          Email new messages and applications to
          <input value={s.notify_email} onChange={(e) => set('notify_email', e.target.value)} placeholder="you@atriumad.com, teammate@atriumad.com" className={field} style={fieldStyle} />
          <span className="font-normal" style={{ color: C.muted }}>
            Separate several addresses with commas. Leave empty for no emails.
          </span>
        </label>
        <div className="grid content-start gap-2 text-[0.9rem]" style={{ color: C.ink }}>
          <span className="text-[0.85rem] font-medium">Send an email for</span>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.notify_contact === '1'} onChange={(e) => set('notify_contact', e.target.checked ? '1' : '0')} /> Contact form messages
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.notify_application === '1'} onChange={(e) => set('notify_application', e.target.checked ? '1' : '0')} /> Job applications
          </label>
        </div>
        <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
          Dashboard timezone
          <select value={s.timezone} onChange={(e) => set('timezone', e.target.value)} className={field} style={fieldStyle}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <span className="font-normal" style={{ color: C.muted }}>
            Days and hours in the charts follow this timezone (applies to new visits).
          </span>
        </label>
        <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
          Never count visits from these IP addresses
          <input value={s.exclude_ips} onChange={(e) => set('exclude_ips', e.target.value)} placeholder="e.g. office internet" className={field} style={fieldStyle} />
          <span className="font-normal" style={{ color: C.muted }}>
            Comma-separated. Your current IP is <code>{ip}</code>{' '}
            <button type="button" className="underline" onClick={() => set('exclude_ips', [s.exclude_ips, ip].filter(Boolean).join(', '))}>
              add it
            </button>
            .
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <Button type="submit">Save settings</Button>
          <Button variant="ghost" onClick={test}>
            Send a test email
          </Button>
          <Msg {...msg} />
        </div>
      </form>
    </Card>
  )
}

function Team({ me }: { me: User }) {
  const [list, setList] = useState<Member[] | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<User['role']>('viewer')
  const [msg, setMsg] = useState<{ text: string; ok?: boolean | undefined }>({ text: '' })
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null)

  const load = () => get<{ items: Member[] }>('users').then((d) => setList(d.items))
  useEffect(() => {
    load()
  }, [])

  async function add(e: FormEvent) {
    e.preventDefault()
    setMsg({ text: '' })
    try {
      const r = await post<{ temp_password: string }>('user_create', { email, name, role })
      setSecret({ email, password: r.temp_password })
      setEmail('')
      setName('')
      load()
    } catch (err) {
      const code = (err as { code?: string | undefined }).code
      setMsg({ text: code === 'exists' ? 'That email already has access.' : 'Check the email address.' })
    }
  }

  async function change(m: Member, r: User['role']) {
    try {
      await post('user_update', { role: r }, { id: m.id })
      load()
    } catch (err) {
      setMsg({ text: (err as { code?: string | undefined }).code === 'last_owner' ? 'There must be at least one owner.' : 'Could not change the role.' })
    }
  }

  async function reset(m: Member) {
    if (!window.confirm(`Make a new temporary password for ${m.email}? Their current password stops working.`)) return
    const r = await post<{ temp_password: string }>('user_update', { reset: true }, { id: m.id })
    setSecret({ email: m.email, password: r.temp_password })
  }

  async function remove(m: Member) {
    if (!window.confirm(`Remove ${m.email}'s access to the dashboard?`)) return
    await post('user_delete', {}, { id: m.id })
    load()
  }

  return (
    <Card title="Team access" className="xl:col-span-2">
      {secret && (
        <div className="mb-4 rounded-xl px-4 py-3 text-[0.9rem]" style={{ background: 'rgba(184,232,154,0.4)', color: C.ink }}>
          Send these to <b>{secret.email}</b> privately. The password is shown only once; they can change it in Settings after signing in.
          <div className="mt-2 font-mono">
            www.atriumad.com/admin · {secret.email} · <b>{secret.password}</b>
          </div>
          <button type="button" className="mt-2 text-[0.8rem] underline" onClick={() => setSecret(null)}>
            Done, hide it
          </button>
        </div>
      )}
      {!list ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[0.875rem]">
            <thead>
              <tr className="text-left" style={{ color: C.muted }}>
                <th className="py-2 pr-3 font-medium">Person</th>
                <th className="py-2 pr-3 font-medium">Role</th>
                <th className="py-2 pr-3 font-medium">Last sign-in</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} className="border-t" style={{ borderColor: C.line, color: C.ink }}>
                  <td className="py-2.5 pr-3">
                    <b>{m.name || m.email}</b>
                    {m.name && <span className="block text-[0.8rem]" style={{ color: C.muted }}>{m.email}</span>}
                  </td>
                  <td className="py-2.5 pr-3">
                    <select value={m.role} onChange={(e) => change(m, e.target.value as User['role'])} className="rounded-lg border px-2 py-1" style={fieldStyle} aria-label={`Role for ${m.email}`} title={ROLE_HELP[m.role]}>
                      {(['owner', 'editor', 'viewer'] as const).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 pr-3" style={{ color: C.muted }}>
                    {m.last_login ? fmtWhen(m.last_login) : 'Never'}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    {m.id !== me.id && (
                      <>
                        <button type="button" onClick={() => reset(m)} className="mr-3 text-[0.8rem] underline" style={{ color: C.series }}>
                          New password
                        </button>
                        <button type="button" onClick={() => remove(m)} className="text-[0.8rem] underline" style={{ color: C.down }}>
                          Remove
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form onSubmit={add} className="mt-5 grid gap-3 border-t pt-5 md:grid-cols-[1.4fr_1fr_0.8fr_auto] md:items-end" style={{ borderColor: C.line }}>
        <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} style={fieldStyle} />
        </label>
        <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} style={fieldStyle} />
        </label>
        <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as User['role'])} className={field} style={fieldStyle}>
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
            <option value="owner">owner</option>
          </select>
        </label>
        <Button type="submit">Add person</Button>
      </form>
      <p className="m-0 mt-2 text-[0.8rem]" style={{ color: C.muted }}>
        {ROLE_HELP[role]}.
      </p>
      <div className="mt-2">
        <Msg {...msg} />
      </div>
    </Card>
  )
}
