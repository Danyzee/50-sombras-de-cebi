/**
 * LEVEL 08 — Memoria Visual (v2)
 *
 * J1 genera una secuencia de 5 colores y la envía a J2 al arrancar.
 * J1 ve los colores parpadeando uno a uno (como Simón Dice).
 * Tras la reproducción J1 NO ve ninguna lista — debe dictar de memoria.
 * J2 tiene los botones en orden aleatorio y debe pulsarlos según J1 dicte.
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { broadcast } from '../lib/sync'

const COLORS = [
  { id: 'rojo',   label: 'ROJO',   bg: '#ff2244', glow: 'rgba(255,34,68,0.6)' },
  { id: 'azul',   label: 'AZUL',   bg: '#00aaff', glow: 'rgba(0,170,255,0.6)' },
  { id: 'verde',  label: 'VERDE',  bg: '#00cc66', glow: 'rgba(0,204,102,0.6)' },
  { id: 'dorado', label: 'DORADO', bg: '#ffd700', glow: 'rgba(255,215,0,0.6)' },
  { id: 'morado', label: 'MORADO', bg: '#a855f7', glow: 'rgba(168,85,247,0.6)' },
]

function genSeq(n = 5) {
  return Array.from({ length: n }, () => COLORS[Math.floor(Math.random() * COLORS.length)].id)
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function Level08({ role, channel, onSolve, isAdmin }) {
  // ── J1: genera la secuencia maestra UNA vez ──────────────────────────────
  // (useMemo para que no cambie entre renders)
  const masterSeq    = useMemo(() => genSeq(), [])        // J1's truth
  const shuffledBtns = useMemo(() => shuffle(COLORS), []) // J2 button layout

  // ── Estado compartido ────────────────────────────────────────────────────
  const [litIndex,  setLitIndex]  = useState(-1)          // cuál luz brilla (-1 = ninguna)
  const [phase,     setPhase]     = useState('ready')     // 'ready'|'playing'|'done'

  // ── Estado de J2 ─────────────────────────────────────────────────────────
  const [j2Seq,     setJ2Seq]     = useState([])          // secuencia recibida de J1
  const [j2Clicks,  setJ2Clicks]  = useState([])          // botones pulsados por J2
  const [j2Status,  setJ2Status]  = useState('')          // ''|'wrong'|'solved'
  const [partPhase, setPartPhase] = useState('ready')     // para J1, ver estado de J2

  const playingRef = useRef(false)   // guard doble-play

  // ── Canal: escuchar eventos del compañero ────────────────────────────────
  useEffect(() => {
    if (!channel) return

    // J2 recibe la secuencia real (enviada por J1 al arrancar el nivel)
    channel.on('broadcast', { event: 'l08_seq' }, ({ payload }) => {
      setJ2Seq(payload.seq)
    })

    // Ambos reciben el estado de la fase
    channel.on('broadcast', { event: 'l08_phase' }, ({ payload }) => {
      setPartPhase(payload.phase)
      if (payload.phase === 'playing') setLitIndex(-1)
    })

    // J2 pide repetición → J1 reproduce de nuevo
    channel.on('broadcast', { event: 'l08_replay' }, () => {
      if (role === 'j1' || isAdmin) startPlay()
    })

    // J1 escucha si J2 resolvió (para actualizar su UI)
    channel.on('broadcast', { event: 'l08_result' }, ({ payload }) => {
      setJ2Status(payload.status)
    })
  }, [channel]) // eslint-disable-line

  // ── Al montar: J1 envía la secuencia a J2 ───────────────────────────────
  useEffect(() => {
    if ((role === 'j1' || isAdmin) && channel) {
      // Pequeño delay para asegurarse de que J2 ya tiene el canal abierto
      const t = setTimeout(() => {
        broadcast(channel, 'l08_seq', { seq: masterSeq })
      }, 800)
      return () => clearTimeout(t)
    }
  }, [channel]) // eslint-disable-line

  // ── Reproducir secuencia (J1) ────────────────────────────────────────────
  function startPlay() {
    if (playingRef.current) return
    playingRef.current = true
    setPhase('playing')
    setLitIndex(-1)
    if (channel) broadcast(channel, 'l08_phase', { phase: 'playing' })
    // Reenviar la secuencia cada vez que se reproduce (por si J2 llegó tarde)
    if (channel) broadcast(channel, 'l08_seq', { seq: masterSeq })

    let i = 0
    const tick = () => {
      setLitIndex(i)
      setTimeout(() => {
        setLitIndex(-1)
        i++
        if (i < masterSeq.length) {
          setTimeout(tick, 450)
        } else {
          playingRef.current = false
          setPhase('done')
          if (channel) broadcast(channel, 'l08_phase', { phase: 'done' })
        }
      }, 750)
    }
    setTimeout(tick, 600)
  }

  // ── J2 pulsa un botón ────────────────────────────────────────────────────
  function handleJ2Click(colorId) {
    if (j2Status === 'solved') return
    if (j2Seq.length === 0) return  // secuencia aún no recibida

    const newClicks = [...j2Clicks, colorId]
    setJ2Clicks(newClicks)

    if (newClicks.length === j2Seq.length) {
      const correct = newClicks.every((c, i) => c === j2Seq[i])
      if (correct) {
        setJ2Status('solved')
        if (channel) broadcast(channel, 'l08_result', { status: 'solved' })
        setTimeout(onSolve, 1200)
      } else {
        setJ2Status('wrong')
        if (channel) broadcast(channel, 'l08_result', { status: 'wrong' })
        setTimeout(() => { setJ2Clicks([]); setJ2Status('') }, 1800)
      }
    }
  }

  function requestReplay() {
    if (channel) broadcast(channel, 'l08_replay', {})
  }

  // ── Colores que ilumina J1 (con los que conoce de verdad) ────────────────
  const seqForDisplay = (role === 'j1' || isAdmin) ? masterSeq : j2Seq

  // ── Render ───────────────────────────────────────────────────────────────

  // Panel de luces de J1 (sin lista de colores después de jugar)
  function J1LightsPanel({ active }) {
    return (
      <div className={`level-panel j1-panel ${active ? 'active-panel' : ''}`}>
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 1 · Panel de Luces</div>
          <div className="level-panel-title">Memoriza la secuencia</div>
        </div>
        <div className="level-panel-body" style={{ alignItems: 'center', gap: '1rem' }}>

          {phase === 'ready' && (
            <div className="panel-card" style={{ width: '100%', textAlign: 'center' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Pulsa <strong style={{ color: 'var(--cyan)' }}>Reproducir</strong> para ver la secuencia de colores.<br />
                Memorízalos y luego dicta los colores en orden a tu compañero.<br />
                <strong style={{ color: 'var(--orange)' }}>¡No podrás verlos de nuevo una vez terminada!</strong>
              </p>
            </div>
          )}

          {/* Pantalla de luces */}
          <div className="light-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', maxWidth: '100%' }}>
            {seqForDisplay.map((cid, idx) => {
              const col = COLORS.find(c => c.id === cid)
              const isLit = litIndex === idx
              return (
                <motion.div
                  key={idx}
                  className={`light-panel ${isLit ? 'lit' : ''}`}
                  style={{
                    background: isLit ? col.bg : 'var(--bg-elevated)',
                    borderColor: isLit ? col.bg : 'var(--border-subtle)',
                    boxShadow: isLit ? `0 0 28px ${col.glow}, inset 0 0 14px rgba(255,255,255,0.2)` : 'none',
                  }}
                  animate={isLit ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  {isLit
                    ? <span style={{ fontSize: '1.4rem', color: '#fff' }}>●</span>
                    : <span style={{ opacity: 0.2, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{idx + 1}</span>
                  }
                </motion.div>
              )
            })}
          </div>

          {/* Mensaje según fase — SIN mostrar los colores */}
          {phase === 'playing' && (
            <div className="status-msg info" style={{ width: '100%', textAlign: 'center' }}>
              👁️ Observa y memoriza los colores…
            </div>
          )}

          {phase === 'done' && (
            <div className="panel-card" style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>🧠</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Dicta los colores <strong style={{ color: 'var(--cyan)' }}>en orden</strong> a tu compañero.<br />
                Si necesitan repetir, tu compañero te lo pedirá.
              </p>
              {j2Status === 'wrong' && (
                <div className="status-msg error" style={{ marginTop: '0.5rem' }}>
                  ❌ J2 se equivocó — ¿repetimos la secuencia?
                </div>
              )}
              {j2Status === 'solved' && (
                <div className="status-msg success" style={{ marginTop: '0.5rem' }}>
                  ✅ ¡J2 ha acertado! Subiendo al siguiente piso…
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          {phase === 'ready' && (
            <button className="btn btn-primary" onClick={startPlay}>
              ▶ Reproducir Secuencia
            </button>
          )}
          {phase === 'done' && j2Status !== 'solved' && (
            <button className="btn" onClick={startPlay} style={{ fontSize: '0.8rem' }}>
              🔁 Repetir secuencia
            </button>
          )}
        </div>
      </div>
    )
  }

  // Panel de botones de J2
  function J2ButtonsPanel({ active }) {
    const waiting = j2Seq.length === 0 && partPhase !== 'done'
    return (
      <div className={`level-panel j2-panel ${active ? 'active-panel' : ''}`}>
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 2 · Panel de Botones</div>
          <div className="level-panel-title">Pulsa los colores en el orden que dicte J1</div>
        </div>
        <div className="level-panel-body" style={{ alignItems: 'center' }}>

          <div className="label" style={{ textAlign: 'center' }}>
            {partPhase === 'ready'   && '⏳ Espera a que J1 reproduzca la secuencia…'}
            {partPhase === 'playing' && '👁️ J1 está memorizando la secuencia…'}
            {partPhase === 'done'    && '🎤 J1 te dictará los colores — pulsa según te indique'}
          </div>

          {/* Botones en layout aleatorio */}
          <div className="light-grid">
            {shuffledBtns.map(col => (
              <motion.button
                key={col.id}
                className="light-panel"
                style={{
                  background: col.bg + '28',
                  borderColor: col.bg,
                  color: col.bg,
                  cursor: (partPhase === 'done' && j2Status !== 'solved') ? 'pointer' : 'default',
                  border: '2px solid',
                  opacity: partPhase !== 'done' ? 0.45 : 1,
                }}
                onClick={() => { if (partPhase === 'done') handleJ2Click(col.id) }}
                whileHover={partPhase === 'done' ? { scale: 1.08, boxShadow: `0 0 20px ${col.glow}` } : {}}
                whileTap={partPhase === 'done' ? { scale: 0.92 } : {}}
                disabled={j2Status === 'solved'}
              >
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: '0.65rem',
                  fontWeight: 700, letterSpacing: '0.1em',
                }}>
                  {col.label}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Progreso de clics de J2 */}
          <div style={{
            display: 'flex', gap: '0.4rem', flexWrap: 'wrap',
            justifyContent: 'center', minHeight: 28,
          }}>
            {j2Clicks.map((cid, i) => {
              const col = COLORS.find(c => c.id === cid)
              return (
                <span key={i} style={{
                  background: col.bg + '33', border: `1px solid ${col.bg}`,
                  borderRadius: 6, padding: '0.15rem 0.4rem',
                  fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: col.bg,
                }}>
                  {i + 1}. {col.label}
                </span>
              )
            })}
          </div>

          <AnimatePresence>
            {j2Status === 'wrong' && (
              <motion.div className="status-msg error"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                ❌ Secuencia incorrecta. Pide a J1 que repita.
              </motion.div>
            )}
            {j2Status === 'solved' && (
              <motion.div className="status-msg success"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                ✅ ¡Secuencia correcta! Acceso concedido.
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{
            display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {j2Clicks.length > 0 && j2Status === '' && (
              <button className="btn" style={{ fontSize: '0.72rem' }}
                onClick={() => setJ2Clicks([])}>
                🗑 Borrar mis clics
              </button>
            )}
            {partPhase === 'done' && j2Status !== 'solved' && (
              <button className="btn" style={{ fontSize: '0.72rem', borderColor: 'var(--orange)', color: 'var(--orange)' }}
                onClick={requestReplay}>
                🔁 Pedir a J1 que repita
              </button>
            )}
          </div>

          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {j2Clicks.length}/{j2Seq.length || 5} pulsaciones
          </p>
        </div>
      </div>
    )
  }

  // ── Vistas según rol ──────────────────────────────────────────────────────

  if (isAdmin) {
    return (
      <>
        <J1LightsPanel active={true} />
        <J2ButtonsPanel active={true} />
      </>
    )
  }

  if (role === 'j1') {
    return (
      <>
        <J1LightsPanel active={true} />
        {/* Panel derecho: J1 ve el estado de J2, sin mapa ni colores */}
        <div className="level-panel j2-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Jugador 2 · Botones (estado)</div>
            <div className="level-panel-title">Tu compañero pulsa los colores</div>
          </div>
          <div className="level-panel-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="panel-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎛️</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Tu compañero tiene botones de colores en <strong>orden diferente</strong>.<br />
                Dicta los colores que has memorizado uno a uno.
              </p>
            </div>
            {/* Progreso J2 */}
            {j2Clicks.length > 0 && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                J2 ha pulsado {j2Clicks.length} de {masterSeq.length}
              </div>
            )}
            {j2Status === 'wrong' && (
              <div className="status-msg error">❌ J2 se equivocó. Repite la secuencia.</div>
            )}
            {j2Status === 'solved' && (
              <div className="status-msg success">✅ ¡J2 acertó!</div>
            )}
          </div>
        </div>
      </>
    )
  }

  // J2 view
  return (
    <>
      {/* J2's left: estado de J1 */}
      <div className="level-panel j1-panel">
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 1 · Luces (vista)</div>
          <div className="level-panel-title">J1 reproduce la secuencia</div>
        </div>
        <div className="level-panel-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="panel-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {partPhase === 'ready' ? '⏳' : partPhase === 'playing' ? '👁️' : '🎤'}
            </div>
            <div className="status-msg info" style={{ textAlign: 'center' }}>
              {partPhase === 'ready'   && 'Esperando a que J1 reproduzca la secuencia…'}
              {partPhase === 'playing' && 'J1 está memorizando la secuencia ahora…'}
              {partPhase === 'done'    && '✅ J1 ha visto la secuencia — escucha y pulsa los colores'}
            </div>
          </div>
        </div>
      </div>

      <J2ButtonsPanel active={true} />
    </>
  )
}
