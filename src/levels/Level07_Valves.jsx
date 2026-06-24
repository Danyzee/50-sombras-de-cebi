/**
 * LEVEL 07 — Encuentra el 4
 *
 * 100 números del 1 al 100 flotan y rebotan por la pantalla de J1.
 * J1 debe hacer clic en el número 4.
 *
 * J2 tiene la PISTA: "En el último correo de Li hay palabras escondidas
 * de un color que no se ve a primera vista. ¿Cuántas 'O' hay en esas
 * palabras?" → Respuesta: 4
 *
 * J2 lee el correo REAL que Li mandará, cuenta las O's y dicta el
 * número a J1.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { broadcast } from '../lib/sync'

const TARGET = 4
const TOTAL  = 100

// Genera las 100 bolas con posición y velocidad aleatorias
function initBalls(w, h) {
  return Array.from({ length: TOTAL }, (_, i) => {
    return {
      id:    i,
      value: i + 1,                            // 1 … 100
      x:     10 + Math.random() * (w - 80),
      y:     10 + Math.random() * (h - 60),
    }
  })
}

// ── Panel de J1: 100 números en movimiento ───────────────────────────────────
function MovingNumbers({ onClickTarget, solved }) {
  const containerRef = useRef(null)
  const ballsRef     = useRef([])
  const [renderKey, setRenderKey] = useState(0)

  // Inicializar bolas al montar
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const { width: w, height: h } = el.getBoundingClientRect()
    ballsRef.current = initBalls(w || 560, h || 480)
    setRenderKey(k => k + 1)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        flex: 1,
        minHeight: 380,
        overflow: 'hidden',
        background: 'var(--bg-deep)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
      }}
    >
      {ballsRef.current.map(b => (
        <div
          id={`ball-${b.id}`}
          key={b.id}
          onClick={() => !solved && onClickTarget(b.value)}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            transform: `translate(${b.x}px, ${b.y}px)`,
            width: 42, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            cursor: 'pointer',
            userSelect: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.55)',
            transition: 'color 0.1s, background 0.1s',
            zIndex: b.value === TARGET ? 2 : 1,
          }}
          onMouseEnter={e => {
            if (!solved) e.currentTarget.style.color = 'var(--cyan)'
          }}
          onMouseLeave={e => {
            if (!solved) e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
          }}
        >
          {b.value}
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Level07({ role, channel, onSolve, isAdmin }) {
  const [status, setStatus] = useState('') // '' | 'wrong' | 'solved'
  const [clickCount, setClickCount] = useState(0)
  const [wrongNum,   setWrongNum]   = useState(null)

  useEffect(() => {
    if (!channel) return
    channel.on('broadcast', { event: 'l07_solved' }, () => setStatus('solved'))
  }, [channel])

  function handleClick(value) {
    if (status === 'solved') return
    setClickCount(c => c + 1)
    if (value === TARGET) {
      setStatus('solved')
      if (channel) broadcast(channel, 'l07_solved', {})
      setTimeout(onSolve, 1200)
    } else {
      setWrongNum(value)
      setStatus('wrong')
      setTimeout(() => { setStatus(''); setWrongNum(null) }, 900)
    }
  }

  // ── Panel de J1: números en movimiento ────────────────────────────────────
  function J1Panel({ active }) {
    return (
      <div className={`level-panel j1-panel ${active ? 'active-panel' : ''}`}>
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 1 · Campo de Números</div>
          <div className="level-panel-title">Encuentra el número correcto</div>
        </div>
        <div className="level-panel-body" style={{ gap: '0.5rem' }}>
          <div className="label" style={{ textAlign: 'center' }}>
            Haz clic en el número que te diga tu compañero
          </div>

          <MovingNumbers onClickTarget={handleClick} solved={status === 'solved'} />

          <AnimatePresence>
            {status === 'wrong' && (
              <motion.div className="status-msg error"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center' }}>
                ❌ El {wrongNum} no es. Sigue buscando…
              </motion.div>
            )}
            {status === 'solved' && (
              <motion.div className="status-msg success"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: 'center' }}>
                ✅ ¡Correcto! Acceso concedido.
              </motion.div>
            )}
          </AnimatePresence>

          {clickCount > 0 && status !== 'solved' && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)', textAlign: 'center' }}>
              Intentos: {clickCount}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Panel de J2: pista ────────────────────────────────────────────────────
  function J2Panel({ active }) {
    return (
      <div className={`level-panel j2-panel ${active ? 'active-panel' : ''}`}>
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 2 · Panel de Pistas</div>
          <div className="level-panel-title">La pista del número</div>
        </div>
        <div className="level-panel-body scroll-y" style={{ alignItems: 'center', justifyContent: 'center' }}>

          <div className="panel-card" style={{ width: '100%' }}>
            <div className="label" style={{ color: 'var(--orange)', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
              📬 PISTA
            </div>
            <p style={{
              fontSize: '0.92rem',
              color: 'var(--text-primary)',
              lineHeight: 1.8,
              fontFamily: 'Georgia, serif',
            }}>
              En el último correo de Li hay palabras escondidas de un color
              que no se ve a primera vista.
            </p>
            <p style={{
              fontSize: '1rem',
              color: 'var(--cyan)',
              lineHeight: 1.8,
              marginTop: '0.75rem',
              fontFamily: 'Georgia, serif',
              fontWeight: 'bold',
            }}>
              ¿Cuántas "O" hay en las palabras escondidas?
            </p>
          </div>

          <div className="panel-card" style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🔍</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Lee el correo que Li mandó en la vida real.<br />
              Busca las palabras ocultas — están ahí.<br />
              Cuando sepas el número, <strong style={{ color: 'var(--text-primary)' }}>dicta el número a J1</strong>.
            </p>
          </div>

          {status === 'solved' && (
            <motion.div className="status-msg success"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ width: '100%', textAlign: 'center' }}>
              ✅ ¡J1 encontró el número correcto!
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  // ── Vistas ────────────────────────────────────────────────────────────────
  if (isAdmin) return <><J1Panel active={true} /><J2Panel active={true} /></>

  if (role === 'j1') {
    return (
      <>
        <J1Panel active={true} />
        <div className="level-panel j2-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Jugador 2 · Pista (vista)</div>
            <div className="level-panel-title">Tu compañero busca el número</div>
          </div>
          <div className="level-panel-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="panel-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📬</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Tu compañero tiene la pista del correo de Li.<br />
                Espera su instrucción y haz clic en ese número.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  // J2
  return (
    <>
      <div className="level-panel j1-panel">
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 1 · Números (vista)</div>
          <div className="level-panel-title">Está buscando el número</div>
        </div>
        <div className="level-panel-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="panel-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔢</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              J1 tiene 100 números en movimiento.<br />
              Dile qué número debe clicar.
            </p>
            {clickCount > 0 && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                Intentos de J1: {clickCount}
              </div>
            )}
          </div>
          {status === 'solved' && (
            <motion.div className="status-msg success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ✅ ¡Número encontrado!
            </motion.div>
          )}
        </div>
      </div>
      <J2Panel active={true} />
    </>
  )
}
