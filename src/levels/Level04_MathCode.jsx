/**
 * LEVEL 04 — El Código Matemático (Versión Revisada)
 *
 * Dos opciones:
 *
 * 🧮 OPCIÓN FÁCIL  → Ecuación matemática absolutamente imposible de resolver.
 *                    El input siempre dice "incorrecto". No hay salida.
 *
 * 🦄 OPCIÓN DIFÍCIL → Cada jugador debe escribir EXACTAMENTE:
 *                    "YO, NURIA O JOSÉ, SOY INCAPAZ DE RESOLVER ESTE EJERCICIO SIN AYUDA DE LI, AYUDA"
 *                    Cuando ambos lo hacen → aparece un unicornio que destruye la opción fácil → avanzar.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { broadcast } from '../lib/sync'
import UnicornChat from '../components/ui/UnicornChat'

const PHRASE = 'YO, NURIA O JOSÉ, SOY INCAPAZ DE RESOLVER ESTE EJERCICIO SIN AYUDA DE LI, AYUDA'

// The impossible equation — displayed in all its horrifying glory
const EQUATION_LINES = [
  '∫₋∞^∞ [ e^(x²·ζ(3)·Γ(⅓)) · ∏ₙ₌₀^∞ (1 + x^(2ⁿ)) ] · sin(π·Γ(x)²) dx',
  '─────────────────────────────────────────────────────────────────────────',
  'lim_{s→1} [(s-1)·ζ(s)]^(eᵖⁱ) · (2^(2⁶²−1) · (2^(2⁶³−1)))',
  '',
  '× Σₖ₌₁^(10¹⁰⁰) [ μ(k²) · φ(k) · Λ(k) ]  mod  p₁₀₀₀',
  '',
  '+ lim_{x→∞} [ x² · sin(1/x) · ln(x!) ] ÷ ∜(π^(√2) · e^(i·φ))',
]

const WRONG_RESPONSES = [
  '❌ Incorrecto. ¿Has tenido en cuenta la convergencia de la serie?',
  '❌ Incorrecto. El resultado lleva 847 decimales significativos.',
  '❌ Incorrecto. Quizás deberías revisar la función de von Mangoldt.',
  '❌ Incorrecto. Ese número ni siquiera es un número real.',
  '❌ Incorrecto. Fascinante intento. Pero no.',
  '❌ Incorrecto. ¿Esto lo has calculado mentalmente?',
  '❌ Incorrecto. El p₁₀₀₀ es 7919, por si te ayuda. (No te ayuda.)',
  '❌ Incorrecto. En serio, para. Existe otra opción.',
]

export default function Level04({ role, channel, onSolve, isAdmin }) {
  // 'choice' | 'easy' | 'hard' | 'unicorn'
  const [phase,       setPhase]       = useState('choice')
  const [easyInput,   setEasyInput]   = useState('')
  const [wrongIdx,    setWrongIdx]    = useState(0)
  const [wrongMsg,    setWrongMsg]    = useState('')
  const [myPhrase,    setMyPhrase]    = useState('')
  const [partnerDone, setPartnerDone] = useState(false)
  const [myDone,      setMyDone]      = useState(false)
  const [unicornPos,  setUnicornPos]  = useState(-200)
  // — Timer 45s (sólo en opción fácil) —
  const [showChat,    setShowChat]    = useState(false)   // UnicornChat visible
  const [timerSec,    setTimerSec]    = useState(45)      // cuenta atrás
  const timerRef = useRef(null)

  // Receive phase change + phrase done from partner
  useEffect(() => {
    if (!channel) return
    channel.on('broadcast', { event: 'l04_phase' }, ({ payload }) => {
      setPhase(payload.phase)
    })
    channel.on('broadcast', { event: 'l04_partner_done' }, () => {
      setPartnerDone(true)
    })
    channel.on('broadcast', { event: 'l04_unicorn' }, () => {
      triggerUnicorn()
    })
    // Partner triggered UnicornChat
    channel.on('broadcast', { event: 'l04_chat_open' }, () => {
      setShowChat(true)
    })
  }, [channel]) // eslint-disable-line

  // Timer de 45s: activo SOLO cuando phase === 'easy' y showChat === false
  useEffect(() => {
    if (phase !== 'easy' || showChat || isAdmin) return
    setTimerSec(45)
    timerRef.current = setInterval(() => {
      setTimerSec(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setShowChat(true)
          if (channel) broadcast(channel, 'l04_chat_open', {})
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, showChat]) // eslint-disable-line

  function selectPhase(p) {
    setPhase(p)
    if (channel) broadcast(channel, 'l04_phase', { phase: p })
  }

  // Easy option: always wrong
  function handleEasySubmit() {
    if (!easyInput.trim()) return
    const msg = WRONG_RESPONSES[wrongIdx % WRONG_RESPONSES.length]
    setWrongMsg(msg)
    setWrongIdx(i => i + 1)
    setEasyInput('')
    setTimeout(() => setWrongMsg(''), 3000)
  }

  // Hard option: phrase check
  function handlePhraseChange(val) {
    setMyPhrase(val)
    if (val === PHRASE && !myDone) {
      setMyDone(true)
      if (channel) broadcast(channel, 'l04_partner_done', {})
    }
  }

  // Trigger unicorn when both done
  useEffect(() => {
    if (myDone && partnerDone) {
      // Give a tiny delay so both see "done" state first
      setTimeout(() => {
        triggerUnicorn()
        if (channel) broadcast(channel, 'l04_unicorn', {})
      }, 600)
    }
  }, [myDone, partnerDone]) // eslint-disable-line

  function triggerUnicorn() {
    setPhase('unicorn')
  }

  // Unicorn animation: after it plays, call onSolve
  useEffect(() => {
    if (phase !== 'unicorn') return
    const t = setTimeout(() => onSolve(), 5500)
    return () => clearTimeout(t)
  }, [phase]) // eslint-disable-line

  const phraseProgress = myPhrase.length / PHRASE.length

  // ===================== UNICORN PHASE =====================
  if (phase === 'unicorn') {
    return (
      <motion.div
        style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'linear-gradient(135deg, #0a0020 0%, #1a0040 50%, #0a0020 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '1.5rem', overflow: 'hidden',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Stars */}
        {Array.from({ length: 40 }, (_, i) => (
          <motion.div key={i} style={{
            position: 'absolute',
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            borderRadius: '50%',
            background: '#fff',
            top:  `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
            transition={{ duration: Math.random() * 2 + 1, repeat: Infinity }}
          />
        ))}

        {/* Unicorn */}
        <motion.div
          style={{ fontSize: 'clamp(5rem, 20vw, 12rem)', lineHeight: 1, position: 'relative', zIndex: 10 }}
          initial={{ x: '-110vw', rotate: -20 }}
          animate={{ x: 0, rotate: [-20, 10, -5, 0] }}
          transition={{ type: 'spring', stiffness: 60, damping: 14, duration: 1.2 }}
        >
          🦄
        </motion.div>

        {/* Explosion rings */}
        {[0.4, 0.7, 1.0].map((delay, i) => (
          <motion.div key={i} style={{
            position: 'absolute',
            width: 10, height: 10,
            borderRadius: '50%',
            border: '3px solid',
            borderColor: ['#ff6b35', '#a855f7', '#00d4ff'][i],
          }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 25, 40], opacity: [1, 0.5, 0] }}
            transition={{ delay, duration: 1.5, ease: 'easeOut' }}
          />
        ))}

        {/* Destruction text */}
        <motion.div
          style={{ textAlign: 'center', zIndex: 10 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 3vw, 1.8rem)',
            fontWeight: 900, color: '#a855f7', letterSpacing: '0.05em',
            textShadow: '0 0 30px #a855f7',
          }}>
            ¡EL UNICORNIO DE LI HA LLEGADO!
          </div>
          <motion.div
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            💥 La opción "fácil" ha sido destruida.
          </motion.div>
          <motion.div
            style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
              color: 'var(--gold)', marginTop: '1rem',
              textShadow: '0 0 20px var(--gold)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            ✨ La humildad os abre la puerta al siguiente piso ✨
          </motion.div>
        </motion.div>

        {/* Rainbow trail */}
        {['#ff0000','#ff7700','#ffff00','#00ff00','#0000ff','#8b00ff'].map((c, i) => (
          <motion.div key={c} style={{
            position: 'absolute',
            left: 0, top: `calc(50% + ${(i - 2.5) * 18}px)`,
            height: 12, borderRadius: 6, background: c, opacity: 0.5,
          }}
            initial={{ width: 0 }}
            animate={{ width: '60vw' }}
            transition={{ delay: 0.1 * i, duration: 0.8, ease: 'easeOut' }}
          />
        ))}
      </motion.div>
    )
  }

  // ===================== CHOICE PHASE =====================
  if (phase === 'choice') {
    return (
      <>
        <div className="level-panel j1-panel active-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Ambos Jugadores · Decisión</div>
            <div className="level-panel-title">El Código Matemático — Elección de Dificultad</div>
          </div>
          <div className="level-panel-body" style={{ alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
            <div className="panel-card" style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
                ANTES DE CONTINUAR, DEBÉIS ELEGIR
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                ¿Cómo queréis superar este piso?
              </div>
            </div>

            {/* Easy option */}
            <motion.button
              onClick={() => selectPhase('easy')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', maxWidth: 380, padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(0,204,102,0.15) 0%, rgba(0,204,102,0.05) 100%)',
                border: '2px solid rgba(0,204,102,0.4)',
                borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>🧮</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#00cc66', marginBottom: '0.25rem' }}>
                  OPCIÓN FÁCIL
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Resolved una operación matemática. Suena sencillo, ¿verdad?
                </div>
              </div>
            </motion.button>

            {/* Hard option */}
            <motion.button
              onClick={() => selectPhase('hard')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', maxWidth: 380, padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(168,85,247,0.05) 100%)',
                border: '2px solid rgba(168,85,247,0.4)',
                borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>🦄</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#a855f7', marginBottom: '0.25rem' }}>
                  OPCIÓN DIFÍCIL
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Un reto de otra índole. Requiere valentía y humildad.
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        <div className="level-panel j2-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Ambos Jugadores · Decisión</div>
            <div className="level-panel-title">Consultad y elegid juntos</div>
          </div>
          <div className="level-panel-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="panel-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🤔</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                Hablad entre vosotros.<br />
                Cualquiera de los dos puede elegir la opción en el panel izquierdo.<br /><br />
                <strong style={{ color: 'var(--text-primary)' }}>¿Fácil o difícil?</strong>
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ===================== EASY PHASE (THE TRAP) =====================
  if (phase === 'easy') {
    return (
      <>
        <div className="level-panel j1-panel active-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Ambos Jugadores · Opción Fácil 🧮</div>
            <div className="level-panel-title">Calcula el siguiente valor exacto</div>
            {/* Temporizador */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
              color: timerSec <= 10 ? 'var(--danger)' : 'var(--text-muted)',
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}>
              <span style={{ fontSize: '0.9rem' }}>{timerSec <= 10 ? '⏰' : '⏳'}</span>
              <span style={{ fontWeight: 700, fontSize: timerSec <= 10 ? '0.9rem' : '0.7rem' }}>{timerSec}s</span>
            </div>
          </div>
          <div className="level-panel-body scroll-y">
            {/* The horrifying equation */}
            <div style={{
              background: 'var(--bg-deep)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              fontFamily: 'var(--font-mono)',
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>
                EJERCICIO 4.7 — ANÁLISIS COMPLEJO & TEORÍA DE NÚMEROS
              </div>
              {EQUATION_LINES.map((line, i) => (
                <div key={i} style={{
                  fontSize: line.startsWith('─') ? '0.7rem' : '0.82rem',
                  color: line.startsWith('─') ? 'var(--border)' : 'var(--cyan)',
                  marginBottom: line === '' ? '0.5rem' : '0.1rem',
                  textAlign: line.startsWith('─') ? 'center' : 'left',
                  letterSpacing: '0.02em',
                  lineHeight: 1.6,
                }}>
                  {line || '\u00A0'}
                </div>
              ))}
              <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5, borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                Donde p_n denota el n-ésimo primo, μ es la función de Möbius, φ la función de Euler,
                Λ la función de von Mangoldt, ζ la función Zeta de Riemann y Γ la función Gamma.
                El resultado debe expresarse con <strong style={{ color: 'var(--danger)' }}>exactamente 400 cifras decimales.</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="input"
                placeholder="Introduce el resultado exacto (400 decimales)…"
                value={easyInput}
                onChange={e => setEasyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEasySubmit()}
                style={{ flex: 1 }}
              />
              <button className="btn" onClick={handleEasySubmit} style={{ flexShrink: 0 }}>
                ✓
              </button>
            </div>

            <AnimatePresence>
              {wrongMsg && (
                <motion.div
                  className="status-msg error"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                >
                  {wrongMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {wrongIdx > 2 && (
              <motion.div
                className="status-msg warning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontSize: '0.78rem', textAlign: 'center' }}
              >
                💡 Pista: existe una <strong>Opción Difícil</strong> que quizás no sea tan difícil…
              </motion.div>
            )}

            <button className="btn" style={{ opacity: 0.6 }} onClick={() => selectPhase('choice')}>
              ← Volver a elegir opción
            </button>
          </div>
        </div>

        <div className="level-panel j2-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Jugador 2 · Opción Fácil</div>
            <div className="level-panel-title">Notas de cálculo</div>
          </div>
          <div className="level-panel-body scroll-y">
            <div className="panel-card">
              <div className="label" style={{ marginBottom: '0.5rem' }}>📊 Datos conocidos</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', lineHeight: 2, color: 'var(--text-muted)' }}>
                <div>ζ(2) = π²/6 ≈ 1.6449340668482264…</div>
                <div>ζ(3) ≈ 1.2020569031595942…  <em style={{ color: 'var(--danger)' }}>(constante de Apéry)</em></div>
                <div>Γ(1/3) ≈ 2.6789385347077476…</div>
                <div>p₁₀₀₀ = 7919</div>
                <div>eᵖⁱ ≈ 23.14069263277927…</div>
                <div>2⁶² − 1 = 4.611.686.018.427.387.903</div>
                <div>42! = 1.405.006.117.752.879.898.543.142.606.244.511.569.936.384.000.000.000</div>
              </div>
            </div>
            <div className="panel-card" style={{ textAlign: 'center', background: 'rgba(255,34,68,0.05)', border: '1px solid rgba(255,34,68,0.2)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>😅</div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Buena suerte con los 400 decimales.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  // UnicornChat overlay (se muestra encima de cualquier phase si showChat === true)
  const unicornChatNode = showChat && (
    <UnicornChat
      channel={channel}
      role={isAdmin ? 'admin' : role}
      levelId="l04"
      onDone={() => {
        setShowChat(false)
        setTimerSec(45)
        selectPhase('choice')  // volver a elegir
      }}
    />
  )

  // ===================== HARD PHASE (THE REAL WAY) =====================
  // Both players type the phrase
  const myCorrect      = myPhrase === PHRASE
  const partnerCorrect = partnerDone

  function PhrasePanel({ panelRole, isActiveRole }) {
    const isMe = role === panelRole || isAdmin
    return (
      <div className={`level-panel ${panelRole === 'j1' ? 'j1-panel' : 'j2-panel'} ${isActiveRole ? 'active-panel' : ''}`}>
        <div className="level-panel-header">
          <div className="level-panel-role">
            {panelRole === 'j1' ? 'Jugador 1' : 'Jugador 2'} · Opción Difícil 🦄
          </div>
          <div className="level-panel-title">
            {panelRole === 'j1' ? 'Tu confesión' : 'Tu confesión'}
          </div>
        </div>
        <div className="level-panel-body">
          <div className="panel-card" style={{
            background: 'rgba(168,85,247,0.08)',
            border: '1px solid rgba(168,85,247,0.25)',
          }}>
            <div className="label" style={{ color: '#a855f7', marginBottom: '0.5rem' }}>📜 Escribe EXACTAMENTE lo siguiente:</div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--gold)',
              lineHeight: 1.7,
              letterSpacing: '0.02em',
              padding: '0.5rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 6,
              userSelect: 'all',
            }}>
              {PHRASE}
            </div>
          </div>

          {isMe ? (
            <>
              <textarea
                style={{
                  background: 'var(--bg-deep)',
                  border: `2px solid ${myCorrect ? 'var(--success)' : myPhrase.length > 0 ? 'rgba(168,85,247,0.5)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: myCorrect ? 'var(--success)' : 'var(--text-primary)',
                  outline: 'none',
                  width: '100%',
                  resize: 'none',
                  height: 90,
                  transition: 'border-color 0.2s',
                }}
                placeholder="Escribe aquí la frase exacta…"
                value={myPhrase}
                onChange={e => handlePhraseChange(e.target.value.toUpperCase())}
                disabled={myCorrect}
              />
              {/* Progress bar */}
              <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  style={{
                    height: '100%',
                    background: myCorrect ? 'var(--success)' : 'linear-gradient(90deg, #a855f7, #00d4ff)',
                    borderRadius: 2,
                  }}
                  animate={{ width: `${Math.min(phraseProgress * 100, 100)}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{myPhrase.length} / {PHRASE.length} caracteres</span>
                {myCorrect && <span style={{ color: 'var(--success)' }}>✅ ¡Frase correcta!</span>}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {partnerCorrect ? '✅' : '⌨️'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: partnerCorrect ? 'var(--success)' : 'var(--text-muted)' }}>
                {partnerCorrect ? 'Tu compañero ha completado la frase' : 'Tu compañero está escribiendo…'}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Status banner
  const bothDone = myCorrect && partnerDone

  if (role === 'j1' && !isAdmin) {
    return (
      <>
        <PhrasePanel panelRole="j1" isActiveRole={true} />
        <div className="level-panel j2-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Jugador 2 · Opción Difícil</div>
            <div className="level-panel-title">Estado de tu compañero</div>
          </div>
          <div className="level-panel-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '3rem' }}>{partnerDone ? '✅' : '⌨️'}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: partnerDone ? 'var(--success)' : 'var(--text-muted)' }}>
                {partnerDone ? 'J2 ha completado la frase' : 'Esperando a J2…'}
              </div>
              {myCorrect && !partnerDone && (
                <div className="status-msg info">✅ Tú ya has terminado. Espera a tu compañero.</div>
              )}
              {bothDone && <div className="status-msg success">🦄 ¡Ambos completados! Invocan al unicornio…</div>}
            </div>
          </div>
        </div>
      </>
    )
  }

  if (role === 'j2' && !isAdmin) {
    return (
      <>
        {unicornChatNode}
        <div className="level-panel j1-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Jugador 1 · Opción Difícil</div>
            <div className="level-panel-title">Estado de tu compañero</div>
          </div>
          <div className="level-panel-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '3rem' }}>{partnerDone ? '✅' : '⌨️'}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: partnerDone ? 'var(--success)' : 'var(--text-muted)' }}>
                {partnerDone ? 'J1 ha completado la frase' : 'Esperando a J1…'}
              </div>
            </div>
          </div>
        </div>
        <PhrasePanel panelRole="j2" isActiveRole={true} />
      </>
    )
  }

  // Admin: show both panels
  return (
    <>
      {unicornChatNode}
      <PhrasePanel panelRole="j1" isActiveRole={true} />
      <PhrasePanel panelRole="j2" isActiveRole={true} />
    </>
  )
}
