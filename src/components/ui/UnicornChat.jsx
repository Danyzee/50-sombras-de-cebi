/**
 * UnicornChat — Chat de emergencia con Li 🦄
 *
 * Se activa cuando el temporizador de 45s expira en Nivel 4 (opción fácil)
 * o Nivel 6 (tres en raya).
 *
 * Flujo:
 * 1. PHRASE  — Ambos escriben "AYUDAME, LI. SOY TONTE."
 * 2. RESPOND — El unicornio dice "No, hay que tomar distancias."
 * 3. CHOICE  — Los 4 botones aparecen. AMBOS deben elegir SIMULTÁNEAMENTE.
 *              Cualquier opción es válida. Deben coordinar.
 * 4. DONE    — El unicornio les da otra oportunidad.
 *
 * Props:
 *   channel   — sync channel (puede ser null en admin)
 *   role      — 'j1' | 'j2' | admin
 *   levelId   — 'l04' | 'l06'  (para namespacing de eventos)
 *   onDone()  — callback cuando el chat termina (reintentar nivel)
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { broadcast } from '../../lib/sync'

const PHRASE   = 'AYUDAME, LI. SOY TONTE.'
const SYNC_WIN = 5000   // ms de ventana para elección simultánea

const OPTIONS = [
  'USAR TÉCNICA: SONRISA FALSA DE JOSÉ',
  'USAR TÉCNICA: RACISMO INSTITUCIONAL',
  'USAR TÉCNICA: Gaslighting',
  'Llorar',
]

// Burbuja estilo WhatsApp
function Bubble({ from, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.35, type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        display: 'flex',
        justifyContent: from === 'uni' ? 'flex-start' : 'flex-end',
        marginBottom: '0.5rem',
      }}
    >
      {from === 'uni' && (
        <span style={{ fontSize: '1.4rem', marginRight: '0.5rem', alignSelf: 'flex-end', marginBottom: 2 }}>
          🦄
        </span>
      )}
      <div style={{
        maxWidth: '75%',
        padding: '0.55rem 0.9rem',
        borderRadius: from === 'uni' ? '4px 18px 18px 18px' : '18px 18px 4px 18px',
        background: from === 'uni'
          ? 'rgba(168,85,247,0.22)'
          : 'rgba(0,212,255,0.15)',
        border: `1px solid ${from === 'uni' ? 'rgba(168,85,247,0.4)' : 'rgba(0,212,255,0.3)'}`,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.82rem',
        color: 'var(--text-primary)',
        lineHeight: 1.5,
      }}>
        {children}
      </div>
    </motion.div>
  )
}

export default function UnicornChat({ channel, role, levelId, onDone }) {
  // chatPhase: 'phrase' | 'unicorn_typing' | 'choice' | 'choice_waiting' | 'choice_fail' | 'done'
  const [chatPhase,   setChatPhase]   = useState('phrase')
  const [myText,      setMyText]      = useState('')
  const [myPhraseOk,  setMyPhraseOk]  = useState(false)
  const [partPhraseOk,setPartPhraseOk]= useState(false)
  const [myChoice,    setMyChoice]    = useState(null)   // index 0-3
  const [myChoiceTs,  setMyChoiceTs]  = useState(null)
  const [partChoiceTs,setPartChoiceTs]= useState(null)
  const [syncResult,  setSyncResult]  = useState('')     // '' | 'ok' | 'slow'
  const pfx = `${levelId}_chat`      // event prefix

  // ── Recibir eventos del compañero ──────────────────────────────────────
  useEffect(() => {
    if (!channel) return
    channel.on('broadcast', { event: `${pfx}_phrase_ok` }, () => {
      setPartPhraseOk(true)
    })
    channel.on('broadcast', { event: `${pfx}_choice` }, ({ payload }) => {
      setPartChoiceTs(payload.ts)
    })
  }, [channel, pfx])

  // ── Cuando ambos completan la frase → pasar a respuesta ────────────────
  useEffect(() => {
    if (myPhraseOk && partPhraseOk && chatPhase === 'phrase') {
      setChatPhase('unicorn_typing')
      setTimeout(() => setChatPhase('choice'), 2800)
    }
  }, [myPhraseOk, partPhraseOk, chatPhase])

  // ── Cuando llega el timestamp del compañero → comprobar sincronía ──────
  useEffect(() => {
    if (!partChoiceTs || !myChoiceTs || chatPhase !== 'choice_waiting') return
    const diff = Math.abs(myChoiceTs - partChoiceTs)
    if (diff <= SYNC_WIN) {
      setSyncResult('ok')
      setChatPhase('done')
      setTimeout(onDone, 3500)
    } else {
      setSyncResult('slow')
      setChatPhase('choice_fail')
      setTimeout(() => {
        setMyChoice(null)
        setMyChoiceTs(null)
        setPartChoiceTs(null)
        setSyncResult('')
        setChatPhase('choice')
      }, 2000)
    }
  }, [partChoiceTs, myChoiceTs, chatPhase]) // eslint-disable-line

  // ── Escribir la frase ──────────────────────────────────────────────────
  function handlePhraseChange(val) {
    const upper = val.toUpperCase()
    setMyText(upper)
    if (upper === PHRASE && !myPhraseOk) {
      setMyPhraseOk(true)
      if (channel) broadcast(channel, `${pfx}_phrase_ok`, {})
    }
  }

  // ── Elegir opción ──────────────────────────────────────────────────────
  function handleOption(idx) {
    if (myChoice !== null || chatPhase !== 'choice') return
    const ts = Date.now()
    setMyChoice(idx)
    setMyChoiceTs(ts)
    setChatPhase('choice_waiting')
    if (channel) broadcast(channel, `${pfx}_choice`, { ts })
  }

  // Admin: saltar directamente
  function handleAdminSkip() {
    setChatPhase('done')
    setTimeout(onDone, 1000)
  }

  // ── UI ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        style={{
          width: '100%', maxWidth: 480,
          background: 'linear-gradient(160deg, #0a0820 0%, #080618 100%)',
          border: '1px solid rgba(168,85,247,0.4)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(168,85,247,0.25)',
        }}
      >
        {/* Header estilo WhatsApp */}
        <div style={{
          background: 'rgba(168,85,247,0.18)',
          borderBottom: '1px solid rgba(168,85,247,0.25)',
          padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.8rem' }}>🦄</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, color: '#a855f7' }}>
              Li Unicornio ✨
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
              {chatPhase === 'unicorn_typing' ? 'escribiendo…' : 'en línea'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(168,85,247,0.6)' }}>
            ⏱ TIEMPO AGOTADO
          </div>
        </div>

        {/* Área de chat */}
        <div style={{ padding: '1rem', minHeight: 200, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>

          {/* Fase 1: escribir la frase */}
          <Bubble from="uni" delay={0.1}>
            ¿En qué puedo ayudaros? 🦄
          </Bubble>

          {myPhraseOk && (
            <Bubble from="me" delay={0}>
              {PHRASE}
            </Bubble>
          )}

          {partPhraseOk && !myPhraseOk && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'right' }}>
              ✅ Tu compañero ya ha escrito la frase…
            </div>
          )}

          {/* Respuesta del unicornio */}
          {(chatPhase === 'unicorn_typing' || chatPhase === 'choice' || chatPhase === 'choice_waiting' || chatPhase === 'choice_fail' || chatPhase === 'done') && (
            <>
              {chatPhase === 'unicorn_typing' ? (
                <Bubble from="uni" delay={0.2}>
                  <span style={{ opacity: 0.6 }}>•••</span>
                </Bubble>
              ) : (
                <Bubble from="uni" delay={0.1}>
                  No, hay que tomar distancias. 🌈<br />
                  <span style={{ fontSize: '0.75rem', color: '#a855f7' }}>
                    Elegid una técnica de distanciamiento, <strong>al mismo tiempo</strong>:
                  </span>
                </Bubble>
              )}
            </>
          )}

          {/* Fase 3: 4 opciones */}
          {(chatPhase === 'choice' || chatPhase === 'choice_waiting' || chatPhase === 'choice_fail') && (
            <div style={{ marginTop: '0.25rem' }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                color: 'var(--orange)', textAlign: 'center', marginBottom: '0.5rem',
                padding: '0.3rem 0.5rem',
                background: 'rgba(255,107,53,0.1)', borderRadius: 6,
                border: '1px solid rgba(255,107,53,0.2)',
              }}>
                ⚠️ Debéis elegir AL MISMO TIEMPO — coordinaos en voz alta
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {OPTIONS.map((opt, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleOption(i)}
                    disabled={myChoice !== null}
                    whileHover={myChoice === null ? { scale: 1.02, x: 4 } : {}}
                    whileTap={myChoice === null ? { scale: 0.98 } : {}}
                    style={{
                      background: myChoice === i
                        ? 'rgba(0,212,255,0.2)'
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${myChoice === i ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 8, padding: '0.55rem 0.75rem',
                      fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                      color: myChoice === i ? 'var(--cyan)' : 'var(--text-primary)',
                      textAlign: 'left', cursor: myChoice === null ? 'pointer' : 'default',
                      transition: 'all 0.15s',
                    }}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </motion.button>
                ))}
              </div>

              {chatPhase === 'choice_waiting' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '0.5rem' }}
                >
                  ✅ Has elegido. Esperando a tu compañero…
                </motion.div>
              )}

              {chatPhase === 'choice_fail' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--danger)', textAlign: 'center', marginTop: '0.5rem' }}
                >
                  ❌ No fue simultáneo. Intentadlo de nuevo, ¡coordinaos!
                </motion.div>
              )}
            </div>
          )}

          {/* Fase 4: done */}
          {chatPhase === 'done' && (
            <Bubble from="uni" delay={0.1}>
              {syncResult === 'ok' && <>
                🌟 Perfecto. Habéis demostrado coordinación.<br />
                Os concedo una segunda oportunidad. ¡No la desperdiciéis! 🦄
              </>}
            </Bubble>
          )}
        </div>

        {/* Input de la frase (solo en fase 'phrase') */}
        {chatPhase === 'phrase' && (
          <div style={{
            borderTop: '1px solid rgba(168,85,247,0.2)',
            padding: '0.75rem 1rem',
            display: 'flex', flexDirection: 'column', gap: '0.4rem',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(168,85,247,0.7)' }}>
              Escribe EXACTAMENTE (ambos jugadores):
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--gold)',
              background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '0.35rem 0.6rem',
              userSelect: 'all',
            }}>
              {PHRASE}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <textarea
                style={{
                  flex: 1, resize: 'none', height: 56,
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${myPhraseOk ? 'var(--success)' : 'rgba(168,85,247,0.3)'}`,
                  borderRadius: 8, padding: '0.5rem 0.75rem',
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                  color: myPhraseOk ? 'var(--success)' : 'var(--text-primary)',
                  outline: 'none',
                }}
                placeholder="Escribe aquí…"
                value={myText}
                onChange={e => handlePhraseChange(e.target.value)}
                disabled={myPhraseOk}
              />
              {myPhraseOk && (
                <div style={{ fontSize: '1.4rem', paddingBottom: 4 }}>✅</div>
              )}
            </div>
            {/* Barra de progreso */}
            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${Math.min((myText.length / PHRASE.length) * 100, 100)}%` }}
                style={{ height: '100%', background: myPhraseOk ? 'var(--success)' : '#a855f7', borderRadius: 2 }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)' }}>
              <span>{myText.length}/{PHRASE.length}</span>
              <span>{myPhraseOk ? '✅ Tú listo' : ''} {partPhraseOk ? '· ✅ Compañero listo' : '· ⏳ Compañero pendiente'}</span>
            </div>
          </div>
        )}

        {/* Admin skip */}
        {role === 'admin' || !channel ? (
          <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid rgba(168,85,247,0.15)' }}>
            <button className="btn" style={{ fontSize: '0.7rem', borderColor: '#a855f7', color: '#a855f7', width: '100%' }}
              onClick={handleAdminSkip}>
              Admin: Saltar chat y reintentar
            </button>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  )
}
