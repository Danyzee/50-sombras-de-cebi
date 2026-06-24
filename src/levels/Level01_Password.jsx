/**
 * LEVEL 01 — La Contraseña Oculta (v2)
 *
 * Answer: HELENERS  (H·E·L·E·N·E·R·S)
 * Encoded: 8 · 5 · 12 · 5 · 14 · 5 · 18 · 19  (A=1…Z=26)
 *
 * J1: Ve ~35 fichas de letras mezcladas (mayoría son señuelos).
 *     Debe colocar exactamente 8 en los huecos numerados.
 * J2: Ve el código numérico y la tabla de cifrado A=1…Z=26.
 *     Descifra y dicta las letras en orden.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { broadcast } from '../lib/sync'

const ANSWER  = 'HELENERS'
const ENCODED = [8, 5, 12, 5, 14, 5, 18, 19]   // H E L E N E R S

// Fichas reales (IDs 0-7) + señuelos (IDs 8+)
// Las 8 fichas necesarias: H E L E N E R S
const REAL_LETTERS = ['H','E','L','E','N','E','R','S']
const DECOY_LETTERS = [
  'A','B','C','D','F','G','I','J','K','M',
  'O','P','Q','T','U','V','W','X','Y','Z',
  'A','C','T','O','I','P','U','D','G','F',
  'K','M','B','V','W',
]

function buildTiles() {
  const all = [
    ...REAL_LETTERS.map((l, i) => ({ id: i, letter: l })),
    ...DECOY_LETTERS.map((l, i) => ({ id: REAL_LETTERS.length + i, letter: l })),
  ]
  // Shuffle
  return all.sort(() => Math.random() - 0.5)
}

const INITIAL_TILES = buildTiles()

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l, i) => ({ letter: l, num: i + 1 }))

export default function Level01({ role, channel, onSolve, isAdmin }) {
  const [tiles,        setTiles]        = useState(INITIAL_TILES)
  const [slots,        setSlots]        = useState(Array(8).fill(null))
  const [selected,     setSelected]     = useState(null)
  const [status,       setStatus]       = useState('')
  const [partnerSlots, setPartnerSlots] = useState(Array(8).fill(null))

  useEffect(() => {
    if (!channel) return
    channel.on('broadcast', { event: 'l01_slots' }, ({ payload }) => {
      setPartnerSlots(payload.slots)
    })
  }, [channel])

  function handleTileClick(tile) {
    if (role !== 'j1' && !isAdmin) return
    if (tile.used) return
    if (selected?.id === tile.id) { setSelected(null); return }
    setSelected(tile)
  }

  function handleSlotClick(idx) {
    if (role !== 'j1' && !isAdmin) return
    const newSlots = [...slots]

    if (newSlots[idx] !== null) {
      const removed = newSlots[idx]
      newSlots[idx] = null
      setTiles(prev => prev.map(t => t.id === removed.id ? { ...t, used: false } : t))
      setSlots(newSlots)
      broadcastSlots(newSlots)
      return
    }

    if (selected) {
      newSlots[idx] = selected
      setTiles(prev => prev.map(t => t.id === selected.id ? { ...t, used: true } : t))
      setSlots(newSlots)
      setSelected(null)
      broadcastSlots(newSlots)
    }
  }

  function broadcastSlots(s) {
    if (channel) broadcast(channel, 'l01_slots', { slots: s.map(t => t?.letter ?? null) })
  }

  function handleSubmit() {
    if (role !== 'j1' && !isAdmin) return
    const word = slots.map(t => t?.letter ?? '').join('')
    if (word === ANSWER) {
      setStatus('solved')
      setTimeout(() => onSolve(), 1200)
    } else {
      setStatus('wrong')
      setTimeout(() => setStatus(''), 1800)
    }
  }

  const allFilled = slots.every(s => s !== null)

  // ── Panel de fichas (J1) ─────────────────────────────────────────────────
  function TilesPanel({ active }) {
    return (
      <div className={`level-panel j1-panel ${active ? 'active-panel' : ''}`}>
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 1 · Panel de Letras</div>
          <div className="level-panel-title">Contraseña Oculta — 8 letras</div>
        </div>
        <div className="level-panel-body scroll-y">
          <div className="label">Fichas disponibles — selecciona y coloca en los huecos</div>

          {/* Gran cuadrícula de fichas (reales + señuelos mezclados) */}
          <div className="letter-tiles" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
            {tiles.map(tile => (
              <motion.div
                key={tile.id}
                className={`letter-tile ${tile.used ? 'used' : ''} ${selected?.id === tile.id ? 'selected' : ''}`}
                onClick={() => handleTileClick(tile)}
                style={{
                  opacity: tile.used ? 0.3 : 1,
                  ...(selected?.id === tile.id ? { borderColor: 'var(--cyan)', boxShadow: 'var(--shadow-cyan)' } : {}),
                  fontSize: '0.9rem',
                  minWidth: 36, minHeight: 36,
                  cursor: tile.used ? 'default' : 'pointer',
                }}
                whileHover={!tile.used ? { y: -3, scale: 1.08 } : {}}
                whileTap={!tile.used ? { scale: 0.95 } : {}}
              >
                {tile.letter}
              </motion.div>
            ))}
          </div>

          <div className="divider" />

          <div className="label">Huecos — coloca las letras en el orden que dicte J2</div>
          <div className="word-slots" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
            {slots.map((slot, i) => (
              <div
                key={i}
                className={`word-slot ${slot ? 'filled' : ''}`}
                onClick={() => handleSlotClick(i)}
                title={slot ? 'Clic para quitar' : 'Clic para colocar letra seleccionada'}
              >
                {slot?.letter ?? ''}
                <span className="slot-num">{i + 1}</span>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {status === 'wrong' && (
              <motion.div className="status-msg error"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                ❌ Combinación incorrecta. Habla con tu compañero.
              </motion.div>
            )}
            {status === 'solved' && (
              <motion.div className="status-msg success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                ✅ ¡Contraseña correcta! Subiendo al siguiente piso…
              </motion.div>
            )}
          </AnimatePresence>

          {selected && (
            <div className="status-msg info">
              Ficha seleccionada: <strong style={{ color: 'var(--cyan)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{selected.letter}</strong>
              — ahora haz clic en un hueco
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!allFilled || status === 'solved'}
          >
            🔓 Verificar Contraseña
          </button>
        </div>
      </div>
    )
  }

  // ── Panel de cifrado (J2) ────────────────────────────────────────────────
  function CipherPanel({ active }) {
    return (
      <div className={`level-panel j2-panel ${active ? 'active-panel' : ''}`}>
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 2 · Panel de Pistas</div>
          <div className="level-panel-title">Descifrador de Código</div>
        </div>
        <div className="level-panel-body scroll-y">
          <div className="label">Mensaje encriptado — descífralo y dicta las letras en orden</div>

          <div className="encoded-message">{ENCODED.join(' · ')}</div>

          <div className="panel-card">
            <div className="label" style={{ marginBottom: '0.5rem' }}>🔑 Clave: cada número = una letra del alfabeto</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Usa la tabla de abajo para descifrar. Luego dicta letra por letra a J1:<br />
              <em>"En el hueco 1 pon la letra…, en el 2…"</em>
            </p>
          </div>

          <div className="label">Tabla A=1 … Z=26</div>
          <div className="cipher-table">
            {ALPHABET.map(({ letter, num }) => (
              <div key={letter} className="cipher-cell">
                <div className="letter">{letter}</div>
                <div className="num">{num}</div>
              </div>
            ))}
          </div>

          {/* Partner progress */}
          {!isAdmin && (
            <>
              <div className="label" style={{ marginTop: '0.5rem' }}>Progreso de J1</div>
              <div className="word-slots" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
                {partnerSlots.map((letter, i) => (
                  <div key={i} className={`word-slot ${letter ? 'filled' : ''}`} style={{ cursor: 'default' }}>
                    {letter ?? ''}
                    <span className="slot-num">{i + 1}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Admin: ambos paneles ─────────────────────────────────────────────────
  if (isAdmin) return <><TilesPanel active={true} /><CipherPanel active={true} /></>

  // ── J1 ───────────────────────────────────────────────────────────────────
  if (role === 'j1') {
    return (
      <>
        <TilesPanel active={true} />
        <div className="level-panel j2-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Jugador 2 · Panel de Pistas (vista)</div>
            <div className="level-panel-title">Descifrador de Código</div>
          </div>
          <div className="level-panel-body">
            <div className="panel-card" style={{ textAlign: 'center' }}>
              <div className="label" style={{ marginBottom: '0.5rem' }}>Tu compañero ve un código encriptado.</div>
              <div style={{ fontSize: '2rem' }}>🔐</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Escucha sus instrucciones y coloca las letras en el orden correcto.
              </p>
            </div>
            <div className="label">Tu progreso</div>
            <div className="word-slots" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
              {slots.map((slot, i) => (
                <div key={i} className={`word-slot ${slot ? 'filled' : ''}`} style={{ cursor: 'default' }}>
                  {slot?.letter ?? ''}
                  <span className="slot-num">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── J2 ───────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="level-panel j1-panel">
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 1 · Panel de Letras (vista)</div>
          <div className="level-panel-title">Progreso de tu compañero</div>
        </div>
        <div className="level-panel-body">
          <div className="label">Huecos que ha rellenado J1 hasta ahora:</div>
          <div className="word-slots" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
            {partnerSlots.map((letter, i) => (
              <div key={i} className={`word-slot ${letter ? 'filled' : ''}`} style={{ cursor: 'default' }}>
                {letter ?? ''}
                <span className="slot-num">{i + 1}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Dicta las letras en orden. Tu compañero las coloca en los huecos numerados.
          </p>
        </div>
      </div>
      <CipherPanel active={true} />
    </>
  )
}
