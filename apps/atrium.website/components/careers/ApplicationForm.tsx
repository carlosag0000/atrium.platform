'use client'

import { type FormEvent, type ReactNode, useRef, useState } from 'react'

// Multi-step application for the Account Manager listing. Posts to /careers-api/apply.php
// (PHP on Hostinger). Each answer is sent with its question so the admin view can show it as-is.

const API = '/careers-api/apply.php'

const TOOLS = [
  'Notion',
  'Metricool',
  'Meta Business Suite / Ads Manager',
  'Google Business Profile',
  'Google Ads',
  'Slack',
  'Google Workspace',
  'Dropbox',
  'Milanote',
  'Canva',
  'Adobe (Photoshop, Premiere…)',
  'CapCut',
  'ChatGPT / IA',
]

const AREAS = [
  'Contenido para redes',
  'Gestión de redes y comunidad',
  'Anuncios pagados (Meta / Google)',
  'Google Business y SEO local',
  'Reseñas y reputación',
  'Email y SMS',
  'Producción de foto y video',
  'Reportes y analítica',
]
const LEVELS = ['Nada', 'Básico', 'Intermedio', 'Avanzado']

const ENGLISH_PROMPT =
  'Escribe en inglés un mensaje corto (4 a 6 líneas) para el dueño de un restaurante en Houston: la sesión de fotos del martes se mueve al jueves por lluvia. Explica el cambio y confírmale que su calendario de contenido no se va a atrasar.'

type Values = Record<string, string>

const STEPS = ['Sobre ti', 'Tu perfil', 'Experiencia', 'Herramientas', 'Inglés', 'Para terminar'] as const

const inputClass =
  'w-full rounded-xl border bg-white px-4 py-3 text-[1rem] outline-none transition focus:border-[var(--teal-800)] focus:ring-2 focus:ring-[var(--mint-400)]'
const inputStyle = { borderColor: 'rgba(7,47,52,0.18)', color: 'var(--teal-800)' }

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-semibold text-[0.95rem]" style={{ color: 'var(--teal-800)' }}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : <span className="font-normal opacity-60"> (opcional)</span>}
      </span>
      {hint && (
        <span className="mb-2 block text-[0.875rem] leading-snug" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </span>
      )}
      {children}
    </label>
  )
}

function Choice({ name, options, value, onChange }: { name: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {options.map((opt) => {
        const on = value === opt
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(opt)}
            className="rounded-full border px-4 py-2 text-[0.95rem] transition"
            style={{
              borderColor: on ? 'var(--teal-800)' : 'rgba(7,47,52,0.18)',
              background: on ? 'var(--teal-800)' : 'white',
              color: on ? 'var(--mint-400)' : 'var(--teal-800)',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export default function ApplicationForm({ job }: { job: string }) {
  const [step, setStep] = useState(0)
  const [v, setV] = useState<Values>({})
  const [tools, setTools] = useState<string[]>([])
  const [areas, setAreas] = useState<Record<string, string>>({})
  const [cv, setCv] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  const set = (k: string) => (val: string) => setV((prev) => ({ ...prev, [k]: val }))
  const text = (k: string) => ({
    value: v[k] ?? '',
    onChange: (e: { target: { value: string } }) => set(k)(e.target.value),
    className: inputClass,
    style: inputStyle,
  })
  const filled = (k: string) => (v[k] ?? '').trim().length > 0

  function validate(s: number): string {
    if (s === 0) {
      if (!filled('name') || !filled('phone') || !filled('area')) return 'Completa los campos marcados con *.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email ?? '')) return 'Revisa tu email.'
    }
    if (s === 1 && !filled('linkedin') && !filled('instagram') && !filled('portfolio'))
      return 'Comparte al menos un perfil: LinkedIn, Instagram profesional o portafolio.'
    if (s === 1 && cv && (cv.size > 5 * 1024 * 1024 || cv.type !== 'application/pdf')) return 'El CV debe ser un PDF de máximo 5 MB.'
    if (s === 2 && (!filled('years') || !filled('agency') || !filled('hospitality') || !filled('team') || !filled('accounts') || !filled('experience')))
      return 'Responde todas las preguntas marcadas con *.'
    if (s === 3 && Object.keys(areas).length < AREAS.length) return 'Marca tu nivel en cada área.'
    if (s === 4 && (!filled('englishLevel') || (v.englishTest ?? '').trim().length < 80))
      return 'Elige tu nivel y escribe el mensaje en inglés (al menos 4 líneas).'
    if (s === 5 && (!filled('why') || !filled('start') || v.onsite !== 'yes' || v.consent !== 'yes'))
      return 'Completa los campos marcados con * y confirma las dos casillas.'
    return ''
  }

  function go(next: number) {
    if (next > step) {
      const msg = validate(step)
      if (msg) {
        setError(msg)
        return
      }
    }
    setError('')
    setStep(next)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (step < STEPS.length - 1) {
      go(step + 1)
      return
    }
    const msg = validate(step)
    if (msg) {
      setError(msg)
      return
    }
    const answers = {
      sections: [
        {
          title: 'Sobre ti',
          items: [
            { label: 'Nombre completo', value: v.name },
            { label: 'Cómo prefiere que le llamen', value: v.preferred ?? '' },
            { label: 'Email', value: v.email },
            { label: 'WhatsApp / teléfono', value: v.phone },
            { label: 'Dónde vive', value: v.area },
          ],
        },
        {
          title: 'Perfil',
          items: [
            { label: 'LinkedIn', value: v.linkedin ?? '' },
            { label: 'Instagram profesional', value: v.instagram ?? '' },
            { label: 'Portafolio / web', value: v.portfolio ?? '' },
          ],
        },
        {
          title: 'Experiencia',
          items: [
            { label: 'Años en marketing / gestión de cuentas', value: v.years },
            { label: 'Ha trabajado en una agencia', value: v.agency },
            { label: 'Experiencia con restaurantes / hospitalidad', value: v.hospitality },
            { label: 'Personas que ha coordinado', value: v.team },
            { label: 'Cuentas a la vez', value: v.accounts },
            { label: 'Su experiencia', value: v.experience },
          ],
        },
        {
          title: 'Herramientas y áreas',
          items: [
            { label: 'Herramientas que usa', value: tools.join(', ') || 'Ninguna marcada' },
            { label: 'Otras herramientas', value: v.otherTools ?? '' },
            ...AREAS.map((a) => ({ label: a, value: areas[a] ?? '' })),
          ],
        },
        {
          title: 'Inglés',
          items: [
            { label: 'Nivel de lectura y escritura', value: v.englishLevel },
            { label: 'Prueba escrita', value: v.englishTest },
          ],
        },
        {
          title: 'Para terminar',
          items: [
            { label: '¿Por qué Atrium?', value: v.why },
            { label: 'Puede empezar', value: v.start },
            { label: 'Confirma presencial en La Habana', value: 'Sí' },
            { label: 'Expectativa salarial (USD/mes)', value: v.salary ?? '' },
          ],
        },
      ],
    }
    const body = new FormData()
    body.set('job', job)
    body.set('name', v.name ?? '')
    body.set('email', v.email ?? '')
    body.set('phone', v.phone ?? '')
    body.set('website', v.website ?? '')
    body.set('answers', JSON.stringify(answers))
    if (cv) body.set('cv', cv)
    setSending(true)
    setError('')
    try {
      const res = await fetch(API, { method: 'POST', body })
      if (res.status === 429) throw new Error('Demasiados intentos. Espera una hora y vuelve a intentarlo.')
      if (!res.ok) throw new Error('No pudimos enviar tu aplicación. Revisa tus datos e inténtalo otra vez.')
      setDone(true)
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar tu aplicación.')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div ref={topRef} className="rounded-3xl p-8 md:p-12" style={{ background: 'var(--teal-800)', color: 'var(--cloud-300)' }}>
        <p className="type-eyebrow mb-4" style={{ color: 'var(--mint-400)' }}>
          Aplicación enviada
        </p>
        <h3 className="type-card-title m-0" style={{ color: 'var(--cloud-300)' }}>
          ¡Gracias{v.preferred || v.name ? `, ${(v.preferred || v.name || '').split(' ')[0]}` : ''}!</h3>
        <p className="type-body mt-4 max-w-xl opacity-80">
          Recibimos tu aplicación. La revisamos con calma y, si tu perfil encaja, te escribimos por email o WhatsApp para coordinar una entrevista.
        </p>
      </div>
    )
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      <ol className="mb-8 flex flex-wrap gap-2" aria-label="Pasos">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? 'step' : undefined}
            className="rounded-full px-3 py-1 text-[0.8rem] font-semibold"
            style={{
              background: i === step ? 'var(--teal-800)' : i < step ? 'var(--mint-200)' : 'rgba(7,47,52,0.06)',
              color: i === step ? 'var(--mint-400)' : 'var(--teal-800)',
            }}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <form onSubmit={submit} noValidate className="rounded-3xl bg-white p-6 shadow-sm md:p-10" style={{ border: '1px solid rgba(7,47,52,0.1)' }}>
        <h3 className="type-card-title m-0 mb-8" style={{ color: 'var(--teal-800)' }}>
          {STEPS[step]}
        </h3>

        {/* Honeypot: hidden from people, filled by bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={v.website ?? ''}
          onChange={(e) => set('website')(e.target.value)}
          className="hidden"
        />

        <div className="grid gap-6">
          {step === 0 && (
            <>
              <Field label="Nombre completo" required>
                <input autoComplete="name" {...text('name')} />
              </Field>
              <Field label="¿Cómo prefieres que te llamemos?" hint="Tu nombre, un apodo o como prefieras.">
                <input {...text('preferred')} />
              </Field>
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Email" required>
                  <input type="email" autoComplete="email" {...text('email')} />
                </Field>
                <Field label="WhatsApp o teléfono" required>
                  <input type="tel" autoComplete="tel" placeholder="+53 …" {...text('phone')} />
                </Field>
              </div>
              <Field label="¿Dónde vives?" hint="Municipio o barrio en La Habana. El puesto es presencial en nuestra oficina." required>
                <input {...text('area')} />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <p className="type-body m-0" style={{ color: 'var(--text-muted)' }}>
                Queremos conocerte. Comparte al menos uno de estos perfiles.
              </p>
              <Field label="LinkedIn">
                <input type="url" inputMode="url" placeholder="https://linkedin.com/in/…" {...text('linkedin')} />
              </Field>
              <Field label="Instagram profesional" hint="Si tienes un perfil profesional o una cuenta que hayas manejado.">
                <input placeholder="@usuario" {...text('instagram')} />
              </Field>
              <Field label="Portafolio, web u otro perfil">
                <input type="url" inputMode="url" placeholder="https://…" {...text('portfolio')} />
              </Field>
              <Field label="CV en PDF" hint="Máximo 5 MB.">
                <span className="flex flex-wrap items-center gap-3">
                  <span
                    className="inline-flex cursor-pointer rounded-full border px-5 py-2 font-semibold text-[0.95rem]"
                    style={{ borderColor: 'var(--teal-800)', color: 'var(--teal-800)' }}
                  >
                    {cv ? 'Cambiar PDF' : 'Elegir PDF'}
                  </span>
                  <span className="text-[0.95rem]" style={{ color: 'var(--text-muted)' }}>
                    {cv ? cv.name : 'Ningún archivo elegido'}
                  </span>
                  <input type="file" accept="application/pdf" onChange={(e) => setCv(e.target.files?.[0] ?? null)} className="sr-only" />
                </span>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="¿Cuántos años de experiencia tienes en marketing o gestión de cuentas?" required>
                <Choice name="Años" options={['Menos de 1', '1 a 2', '2 a 4', '5 o más']} value={v.years ?? ''} onChange={set('years')} />
              </Field>
              <Field label="¿Has trabajado en una agencia de marketing?" required>
                <Choice name="Agencia" options={['Sí', 'No']} value={v.agency ?? ''} onChange={set('agency')} />
              </Field>
              <Field label="¿Has trabajado con restaurantes, hoteles o marcas de comida?" required>
                <Choice name="Hospitalidad" options={['Sí, como marketing', 'Sí, dentro del negocio', 'No']} value={v.hospitality ?? ''} onChange={set('hospitality')} />
              </Field>
              <Field label="¿A cuántas personas has coordinado a la vez?" required>
                <Choice name="Equipo" options={['Ninguna', '1 a 3', '4 a 8', 'Más de 8']} value={v.team ?? ''} onChange={set('team')} />
              </Field>
              <Field label="¿Cuántas cuentas o clientes has manejado a la vez?" required>
                <Choice name="Cuentas" options={['1 a 3', '4 a 7', '8 a 12', 'Más de 12']} value={v.accounts ?? ''} onChange={set('accounts')} />
              </Field>
              <Field label="Cuéntanos tu experiencia" hint="Dónde has trabajado, con qué tipo de clientes y qué estaba a tu cargo." required>
                <textarea rows={5} {...text('experience')} />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="¿Qué herramientas sabes usar?" hint="Marca todas las que hayas usado en un trabajo real.">
                <div className="flex flex-wrap gap-2">
                  {TOOLS.map((t) => {
                    const on = tools.includes(t)
                    return (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setTools((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))}
                        className="rounded-full border px-4 py-2 text-[0.95rem] transition"
                        style={{
                          borderColor: on ? 'var(--teal-800)' : 'rgba(7,47,52,0.18)',
                          background: on ? 'var(--teal-800)' : 'white',
                          color: on ? 'var(--mint-400)' : 'var(--teal-800)',
                        }}
                      >
                        {on ? '✓ ' : ''}
                        {t}
                      </button>
                    )
                  })}
                </div>
              </Field>
              <Field label="¿Otras herramientas?">
                <input {...text('otherTools')} />
              </Field>
              <div>
                <span className="mb-1 block font-semibold text-[0.95rem]" style={{ color: 'var(--teal-800)' }}>
                  ¿Qué tanto conoces cada área? *
                </span>
                <span className="mb-4 block text-[0.875rem]" style={{ color: 'var(--text-muted)' }}>
                  Responde con honestidad: nadie domina todo.
                </span>
                <div className="grid gap-4">
                  {AREAS.map((a) => (
                    <div key={a} className="grid gap-2 border-t pt-4 md:grid-cols-[1fr_auto] md:items-center" style={{ borderColor: 'rgba(7,47,52,0.1)' }}>
                      <span style={{ color: 'var(--teal-800)' }}>{a}</span>
                      <Choice name={a} options={LEVELS} value={areas[a] ?? ''} onChange={(lvl) => setAreas((prev) => ({ ...prev, [a]: lvl }))} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <Field label="¿Cómo lees y escribes en inglés?" required>
                <Choice name="Inglés" options={['Básico', 'Intermedio', 'Avanzado', 'Nativo / bilingüe']} value={v.englishLevel ?? ''} onChange={set('englishLevel')} />
              </Field>
              <Field label="Prueba corta" hint={ENGLISH_PROMPT} required>
                <textarea rows={7} lang="en" spellCheck={false} placeholder="Hi …," {...text('englishTest')} />
              </Field>
              <p className="m-0 text-[0.875rem]" style={{ color: 'var(--text-muted)' }}>
                Escríbelo tú, sin traductor: queremos ver cómo escribes de verdad.
              </p>
            </>
          )}

          {step === 5 && (
            <>
              <Field label="¿Por qué quieres trabajar en Atrium?" required>
                <textarea rows={4} {...text('why')} />
              </Field>
              <Field label="¿Cuándo podrías empezar?" required>
                <Choice name="Inicio" options={['De inmediato', 'En 2 semanas', 'En 1 mes', 'Más adelante']} value={v.start ?? ''} onChange={set('start')} />
              </Field>
              <Field label="Expectativa salarial mensual (USD)">
                <input inputMode="numeric" {...text('salary')} />
              </Field>
              <label className="flex gap-3 text-[0.95rem]" style={{ color: 'var(--teal-800)' }}>
                <input type="checkbox" className="mt-1 h-5 w-5" checked={v.onsite === 'yes'} onChange={(e) => set('onsite')(e.target.checked ? 'yes' : '')} />
                <span>Confirmo que puedo trabajar presencial y a tiempo completo en la oficina de Atrium en La Habana. *</span>
              </label>
              <label className="flex gap-3 text-[0.95rem]" style={{ color: 'var(--teal-800)' }}>
                <input type="checkbox" className="mt-1 h-5 w-5" checked={v.consent === 'yes'} onChange={(e) => set('consent')(e.target.checked ? 'yes' : '')} />
                <span>Acepto que Atrium guarde mis datos solo para este proceso de selección. *</span>
              </label>
            </>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl px-4 py-3 text-[0.95rem]" style={{ background: '#fdecea', color: '#8a1c12' }}>
            {error}
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => go(step - 1)}
            disabled={step === 0}
            className="rounded-full px-5 py-3 font-semibold transition disabled:invisible"
            style={{ color: 'var(--teal-800)' }}
          >
            ← Atrás
          </button>
          <span className="text-[0.875rem]" style={{ color: 'var(--text-muted)' }}>
            Paso {step + 1} de {STEPS.length}
          </span>
          <button
            type="submit"
            disabled={sending}
            className="rounded-full px-7 py-3 font-semibold transition disabled:opacity-60"
            style={{ background: 'var(--teal-800)', color: 'var(--mint-400)' }}
          >
            {step < STEPS.length - 1 ? 'Siguiente →' : sending ? 'Enviando…' : 'Enviar aplicación'}
          </button>
        </div>
      </form>
    </div>
  )
}
