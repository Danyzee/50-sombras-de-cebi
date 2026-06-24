/**
 * LEVEL 09 — Sincronización
 *
 * Both players see a pendulum swinging.
 * Both must press a big red button AT THE SAME TIME (within 500ms).
 * First press starts a 2000ms window; if partner presses within window → solve.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { broadcast } from '../lib/sync'

const WINDOW_MS = 2000

export default function Level09({ role, channel, onSolve, isAdmin }) {
  const [myPressed,      setMyPressed]      = useState(false)
  const [partnerPressed, setPartnerPressed] = useState(false)
  const [myTime,         setMyTime]         = useState(null)
  const [partnerTime,    setPartnerTime]    = useState(null)
  const [status,         setStatus]         = useState('')  // '' | 'waiting' | 'solved' | 'missed'
  const windowRef = useRef(null)

  useEffect(() => {
    if (!channel) return
    channel.on('broadcast', { event: 'l09_press' }, ({ payload }) => {
      setPartnerPressed(true)
      setPartnerTime(payload.ts)
    })
  }, [channel])

  // Check sync whenever either time changes
  useEffect(() => {
    if (!myTime || !partnerTime) return
    const diff = Math.abs(myTime - partnerTime)
    if (diff <= 500) {
      setStatus('solved')
      clearTimeout(windowRef.current)
      setTimeout(onSolve, 1500)
    } else {
      setStatus('missed')
      setTimeout(() => {
        setMyPressed(false); setPartnerPressed(false)
        setMyTime(null); setPartnerTime(null)
        setStatus('')
      }, 2000)
    }
  }, [myTime, partnerTime]) // eslint-disable-line

  function handlePress() {
    if (myPressed || status === 'solved') return
    const ts = Date.now()
    setMyPressed(true)
    setMyTime(ts)
    setStatus('waiting')
    broadcast(channel, 'l09_press', { ts })

    // If partner already pressed before me
    if (partnerTime) return  // effect will trigger

    // Start window — if partner doesn't press within WINDOW_MS → missed
    windowRef.current = setTimeout(() => {
      if (!partnerTime) {
        setStatus('missed')
        setTimeout(() => {
          setMyPressed(false); setPartnerPressed(false)
          setMyTime(null); setPartnerTime(null)
          setStatus('')
        }, 1500)
      }
    }, WINDOW_MS)
  }

  const instrText = role === 'j1' ? 'Jugador 1' : 'Jugador 2'

  const Pendulum = () => (
    <div className="pendulum-wrap">
      <div className="pendulum-pivot" />
      <div className="pendulum-arm">
        <div className="pendulum-bob"
          style={status === 'solved' ? { background: 'radial-gradient(circle,var(--success) 0%,#006633 100%)', boxShadow: '0 0 30px var(--success)' } : {}}
        />
      </div>
    </div>
  )

  const statusColor = status === 'solved' ? 'var(--success)' : status === 'missed' ? 'var(--danger)' : 'var(--text-muted)'

  function Panel() {
    return (
      <div className="level-panel active-panel" style={{ display: 'flex', flexDirection: 'column' }}
        className={`level-panel ${role === 'j1' ? 'j1-panel' : 'j2-panel'} active-panel`}
      >
        <div className="level-panel-header">
          <div className={`level-panel-role`}>{instrText} · Panel de Sincronización</div>
          <div className="level-panel-title">Péndulo Sincronizado</div>
        </div>
        <div className="level-panel-body" style={{ alignItems: 'center', justifyContent: 'space-around' }}>
          <div className="panel-card" style={{ width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Observad el péndulo. Pulsad el botón rojo <strong>exactamente al mismo tiempo</strong> cuando el péndulo llegue al centro.
            </p>
          </div>

          <Pendulum />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <motion.button
              className="big-btn-pulse"
              onClick={handlePress}
              disabled={myPressed || status === 'solved'}
              whileTap={{ scale: 0.92 }}
            >
              PULSAR
            </motion.button>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Tú</div>
              <div style={{ fontSize: '1.4rem' }}>{myPressed ? '✅' : '⏳'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Compañero</div>
              <div style={{ fontSize: '1.4rem' }}>{partnerPressed ? '✅' : '⏳'}</div>
            </div>
          </div>

          <AnimatePresence>
            {status === 'waiting' && (
              <motion.div className="status-msg info" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                ⏱️ ¡Pulsado! Esperando al compañero…
              </motion.div>
            )}
            {status === 'solved' && (
              <motion.div className="status-msg success" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                ✅ ¡SINCRONIZADOS! ¡Perfecta coordinación!
              </motion.div>
            )}
            {status === 'missed' && (
              <motion.div className="status-msg error" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                ❌ Demasiado desfase. Intentadlo de nuevo.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Admin: show both panels + auto-solve
  if (isAdmin) {
    return (
      <>
        <Panel />
        <div className="level-panel j2-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Jugador 2 · Vista Admin</div>
            <div className="level-panel-title">Sincronización — Modo Admin</div>
          </div>
          <div className="level-panel-body" style={{ alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
            <div className="panel-card" style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Este nivel requiere dos personas pulsando simultáneamente.
                En modo admin puedes saltar directamente.
              </p>
            </div>
            <button className="btn" style={{ borderColor: 'var(--purple)', color: 'var(--purple)' }} onClick={onSolve}>
              ⚡ Resolver automáticamente
            </button>
          </div>
        </div>
      </>
    )
  }

  // Both players see the same panel (just different role label)
  return (
    <>
      <Panel />
      <div className={`level-panel ${role === 'j1' ? 'j2-panel' : 'j1-panel'}`}>
        <div className="level-panel-header">
          <div className="level-panel-role">{role === 'j1' ? 'Jugador 2' : 'Jugador 1'} · Vista del compañero</div>
          <div className="level-panel-title">El péndulo es el mismo para ambos</div>
        </div>
        <div className="level-panel-body" style={{ alignItems: 'center' }}>
          <div className="panel-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>⏱️</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Tu compañero tiene exactamente el mismo péndulo y el mismo botón rojo.
              Coordinad en voz alta: "<em>A la de tres…</em>"
            </p>
          </div>
          <div style={{ color: statusColor, fontFamily: 'var(--font-display)', fontSize: '0.9rem', textAlign: 'center' }}>
            {status === 'solved' ? '✅ ¡SINCRONIZADOS!' : status === 'missed' ? '❌ Desfase — repetid' : ''}
          </div>
        </div>
      </div>
    </>
  )
}
