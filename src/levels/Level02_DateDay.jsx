/**
 * LEVEL 02 — El Día D
 *
 * Answer: 31 / 01 / 2024  ← El día que Li se incorporó a Ferrovial
 *
 * J1: Interactive calendar (days 1-31 only). Month & year selectors show "?" until set.
 * J2: Corporate event log with clues pointing to Li's start date.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { broadcast } from '../lib/sync'

const TARGET = { day: 31, month: 1, year: 2024 }

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const EVENTS = [
  {
    label: 'REGISTRO — AÑO',
    color: 'var(--cyan)',
    text: '«Fue el año en que un nuevo fichaje llegó a nuestro equipo para quedarse. Un año que marcó un antes y un después en la dinámica del grupo. Hablamos del año que siguió a 2023.»',
  },
  {
    label: 'REGISTRO — MES',
    color: 'var(--orange)',
    text: '«La incorporación ocurrió en el primer mes del año. Madrid todavía tenía frío, los cafés estaban llenos de propósitos de año nuevo y el equipo preparaba el sprint del primer trimestre.»',
  },
  {
    label: 'REGISTRO — DÍA',
    color: 'var(--gold)',
    text: '«El día exacto fue el último del mes en cuestión. No había más días después de ese en ese mes. Un número que es también el máximo posible en cualquier mes del calendario.»',
  },
  {
    label: 'NOTA INTERNA — RR.HH.',
    color: 'var(--purple)',
    text: '«Alta en sistema completada. Nuevo miembro: Li. Equipo asignado: el vuestro. Fecha de alta registrada en el sistema de incorporaciones de Ferrovial. Bienvenida oficial cursada.»',
  },
]

export default function Level02({ role, channel, onSolve, isAdmin }) {
  const [day,    setDay]    = useState(null)
  const [month,  setMonth]  = useState(null)
  const [year,   setYear]   = useState(2024)
  const [status, setStatus] = useState('')

  const [partnerDate, setPartnerDate] = useState({ day: null, month: null, year: 2024 })

  useEffect(() => {
    if (!channel) return
    channel.on('broadcast', { event: 'l02_date' }, ({ payload }) => setPartnerDate(payload))
  }, [channel])

  function broadcastDate(d, m, y) {
    if (channel) broadcast(channel, 'l02_date', { day: d, month: m, year: y })
  }

  function handleSubmit() {
    if (day === TARGET.day && month === TARGET.month && year === TARGET.year) {
      setStatus('solved')
      setTimeout(onSolve, 1200)
    } else {
      setStatus('wrong')
      setTimeout(() => setStatus(''), 1800)
    }
  }

  const dateDisplay = (d, m, y) =>
    `${d ? String(d).padStart(2, '0') : '??'} / ${m ? String(m).padStart(2, '0') : '??'} / ${y}`

  // ——— Reusable panels ———
  function CalendarPanel({ active }) {
    return (
      <div className={`level-panel j1-panel ${active ? 'active-panel' : ''}`}>
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 1 · Interfaz de Control</div>
          <div className="level-panel-title">Calendario Interactivo</div>
        </div>
        <div className="level-panel-body scroll-y">
          <div className="label">Selecciona el día exacto del acontecimiento</div>
          <div className="calendar-grid">
            {DAYS.map(d => (
              <div
                key={d}
                className={`cal-day ${day === d ? 'selected' : ''}`}
                onClick={() => { setDay(d); broadcastDate(d, month, year) }}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="divider" />
          <div className="label">Mes y Año (escucha a tu compañero)</div>
          <div className="date-selectors">
            <div className="select-stepper">
              <button className="stepper-btn" onClick={() => { const m = Math.max(1, (month || 1) - 1); setMonth(m); broadcastDate(day, m, year) }}>◀</button>
              <div className="stepper-val">{month ? `Mes ${month}` : 'Mes ?'}</div>
              <button className="stepper-btn" onClick={() => { const m = Math.min(12, (month || 0) + 1); setMonth(m); broadcastDate(day, m, year) }}>▶</button>
            </div>
            <div className="select-stepper">
              <button className="stepper-btn" onClick={() => setYear(y => { const v = y - 1; broadcastDate(day, month, v); return v })}>◀</button>
              <div className="stepper-val">{year}</div>
              <button className="stepper-btn" onClick={() => setYear(y => { const v = y + 1; broadcastDate(day, month, v); return v })}>▶</button>
            </div>
          </div>

          <div className="panel-card" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: '0.25rem' }}>Fecha seleccionada</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--gold)', letterSpacing: '0.15em' }}>
              {dateDisplay(day, month, year)}
            </div>
          </div>

          <AnimatePresence>
            {status === 'wrong' && (
              <motion.div className="status-msg error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                ❌ Fecha incorrecta. Pide más pistas a tu compañero.
              </motion.div>
            )}
            {status === 'solved' && (
              <motion.div className="status-msg success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                ✅ ¡Fecha encontrada! Acceso concedido.
              </motion.div>
            )}
          </AnimatePresence>

          <button className="btn btn-primary" onClick={handleSubmit} disabled={!day || !month || status === 'solved'}>
            📅 Confirmar Fecha
          </button>
        </div>
      </div>
    )
  }

  function EventLogPanel({ active }) {
    return (
      <div className={`level-panel j2-panel ${active ? 'active-panel' : ''}`}>
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 2 · Panel de Pistas</div>
          <div className="level-panel-title">Registro de Incorporaciones — Ferrovial</div>
        </div>
        <div className="level-panel-body scroll-y">
          <div className="label">Analiza los registros y guía a tu compañero</div>
          <div className="event-log">
            {EVENTS.map((ev, i) => (
              <div key={i} className="event-entry" style={{ borderLeftColor: ev.color }}>
                <div className="event-entry-label" style={{ color: ev.color }}>
                  {ev.label}
                </div>
                {ev.text}
              </div>
            ))}
          </div>
          <div className="panel-card">
            <div className="label" style={{ marginBottom: '0.25rem' }}>💡 Formato requerido</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Dile a J1: el <strong>día</strong>, el número de <strong>mes</strong> y el <strong>año</strong>.
              Por ejemplo: "Día 15, mes 3, año 2021."
            </p>
          </div>
          {/* Show partner's current selection */}
          {!isAdmin && (
            <>
              <div className="label">Selección actual de J1</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--gold)', textAlign: 'center', padding: '0.75rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)' }}>
                {dateDisplay(partnerDate.day, partnerDate.month, partnerDate.year)}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ——— ADMIN: both panels fully interactive ———
  if (isAdmin) {
    return (
      <>
        <CalendarPanel active={true} />
        <EventLogPanel active={true} />
      </>
    )
  }

  // ——— J1 VIEW ———
  if (role === 'j1') {
    return (
      <>
        <CalendarPanel active={true} />
        <div className="level-panel j2-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Jugador 2 · Registro Corporativo (vista)</div>
            <div className="level-panel-title">Dicta la fecha a J1</div>
          </div>
          <div className="level-panel-body">
            <div className="panel-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>📋</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Tu compañero tiene el registro de incorporaciones de Ferrovial.
                Escucha sus pistas para seleccionar la fecha correcta.
              </p>
            </div>
            <div className="label">Tu selección actual</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--gold)', textAlign: 'center', padding: '0.75rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)' }}>
              {dateDisplay(day, month, year)}
            </div>
          </div>
        </div>
      </>
    )
  }

  // ——— J2 VIEW ———
  return (
    <>
      <div className="level-panel j1-panel">
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 1 · Calendario (vista)</div>
          <div className="level-panel-title">Selección actual de J1</div>
        </div>
        <div className="level-panel-body">
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Esta es la fecha que tu compañero tiene seleccionada en este momento.
          </p>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--gold)', textAlign: 'center', padding: '1rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)', letterSpacing: '0.15em' }}>
            {dateDisplay(partnerDate.day, partnerDate.month, partnerDate.year)}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Guíale para que elija la fecha exacta basándote en los registros del panel derecho.
          </p>
        </div>
      </div>
      <EventLogPanel active={true} />
    </>
  )
}
