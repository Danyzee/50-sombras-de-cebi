/**
 * LEVEL 10 — El Cofre Final
 *
 * J1 key: NURIA  |  J2 key: JOSE
 * Both must enter their key and click INSERT simultaneously (within 3s of each other).
 *
 * On success: 3D CSS chest opens → SOUL animation:
 *   Names appear: [Li] [Nuria] [José]
 *   Letters highlight: L from Li, U from nUria, O+S from JOSé
 *   Letters fly to center and form "SOUL"
 *   Farewell message fades in.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { broadcast } from '../lib/sync'

const KEYS = { j1: 'NURIA', j2: 'JOSE' }
const WINDOW_MS = 4000

// Which letters in each name form SOUL
// Name chars: Li=[L,i]  Nuria=[N,u,r,i,a]  José=[J,o,s,é]
const NAME_DATA = [
  {
    name: 'Li',
    chars: ['L', 'i'],
    highlight: [0],   // L
    color: 'var(--cyan)',
  },
  {
    name: 'Nuria',
    chars: ['N', 'u', 'r', 'i', 'a'],
    highlight: [1],   // u
    color: 'var(--orange)',
  },
  {
    name: 'José',
    chars: ['J', 'o', 's', 'é'],
    highlight: [1, 2], // o, s
    color: 'var(--purple)',
  },
]

// Confetti
function spawnConfetti() {
  const colors = ['#00d4ff', '#ff6b35', '#ffd700', '#a855f7', '#00ff88', '#ff2244']
  return Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    duration: 2 + Math.random() * 2,
    delay: Math.random() * 1.5,
    size: 6 + Math.random() * 8,
  }))
}

export default function Level10({ role, channel, onSolve, isAdmin }) {
  const [inputVal,    setInputVal]    = useState('')
  const [keyLocked,   setKeyLocked]   = useState(false)
  const [myTs,        setMyTs]        = useState(null)
  const [partnerTs,   setPartnerTs]   = useState(null)
  const [chestOpen,   setChestOpen]   = useState(false)
  const [soulPhase,   setSoulPhase]   = useState(0)
  const [confetti,    setConfetti]    = useState([])
  const [status,      setStatus]      = useState('')
  const [wrongTries,  setWrongTries]  = useState(0)  // controls which riddle clue to show
  const windowRef = useRef(null)

  const myKey = KEYS[role]

  useEffect(() => {
    if (!channel) return
    channel.on('broadcast', { event: 'l10_insert' }, ({ payload }) => {
      setPartnerTs(payload.ts)
    })
  }, [channel])

  // Check sync whenever both timestamps available
  useEffect(() => {
    if (!myTs || !partnerTs) return
    const diff = Math.abs(myTs - partnerTs)
    if (diff <= WINDOW_MS) {
      triggerSoul()
    } else {
      setStatus('missed')
      setKeyLocked(false)
      setMyTs(null)
      setPartnerTs(null)
      setTimeout(() => setStatus(''), 2000)
    }
  }, [myTs, partnerTs]) // eslint-disable-line

  function handleInsert() {
    // JOSE answer has no accent — correct key is 'JOSE' not 'JOSÉ'
    if (inputVal.toUpperCase() !== myKey) {
      setWrongTries(t => t + 1)
      setStatus('wrongkey')
      setTimeout(() => setStatus(''), 1500)
      return
    }
    setKeyLocked(true)
    setStatus('waiting')
    const ts = Date.now()
    setMyTs(ts)
    broadcast(channel, 'l10_insert', { ts, role })

    // Timeout window
    windowRef.current = setTimeout(() => {
      if (!partnerTs) {
        setStatus('missed')
        setKeyLocked(false)
        setMyTs(null)
        setTimeout(() => setStatus(''), 2000)
      }
    }, WINDOW_MS + 1000)
  }

  function triggerSoul() {
    setChestOpen(true)
    setStatus('solved')
    clearTimeout(windowRef.current)

    // Phase sequence
    setTimeout(() => setSoulPhase(1), 1600)   // names appear
    setTimeout(() => setSoulPhase(2), 3200)   // letters highlight
    setTimeout(() => setSoulPhase(3), 5000)   // SOUL word
    setTimeout(() => {
      setSoulPhase(4)
      setConfetti(spawnConfetti())
    }, 6000)  // message + confetti
    setTimeout(() => onSolve(), 13000)
  }

  // Admin: auto-trigger
  function handleAdminTrigger() {
    triggerSoul()
  }

  function Panel({ isActive }) {
    return (
      <div className={`level-panel ${role === 'j1' ? 'j1-panel' : 'j2-panel'} ${isActive ? 'active-panel' : ''}`}>
        <div className="level-panel-header">
          <div className="level-panel-role">{role === 'j1' ? 'Jugador 1' : 'Jugador 2'} · El Cofre Final</div>
          <div className="level-panel-title">Introducir Llave Digital</div>
        </div>
        <div className="level-panel-body" style={{ alignItems: 'center' }}>
          {/* 3D Chest */}
          <div className="chest-scene" style={{ minHeight: 160 }}>
            <div className="chest-3d">
              <div className={`chest-lid ${chestOpen ? 'open' : ''}`} />
              <div className="chest-body" />
              <div className={`chest-glow ${chestOpen ? 'visible' : ''}`} />
            </div>
          </div>

          <div className="key-input-wrap" style={{ width: '100%', maxWidth: 320 }}>
            {/* Progressive riddle clue — never shows the answer directly */}
            <div className="key-hint" style={{ lineHeight: 1.5 }}>
              {wrongTries === 0
                ? <>🔐 Pista: <em style={{ color: 'var(--gold)' }}>¿Cuál es tu nombre?</em></>
                : <>🔐 Pista: <em style={{ color: 'var(--orange)' }}>¿Cuál es el nombre de la persona que tienes en frente?</em></>
              }
            </div>
            <input
              className={`key-input ${keyLocked ? 'locked' : ''}`}
              placeholder="Escribe el nombre aquí"
              value={inputVal}
              onChange={e => !keyLocked && setInputVal(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && !keyLocked && handleInsert()}
              disabled={keyLocked}
              maxLength={10}
            />
          </div>

          <AnimatePresence>
            {status === 'wrongkey' && (
              <motion.div className="status-msg error" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                {wrongTries === 1
                  ? '❌ Incorrecto. Pista: ¿Cuál es el nombre de la persona que tienes en frente?'
                  : '❌ Tampoco. Piénsalo bien…'
                }
              </motion.div>
            )}
            {status === 'waiting' && (
              <motion.div className="status-msg info" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                🔑 Llave insertada. Esperando a tu compañero…
              </motion.div>
            )}
            {status === 'missed' && (
              <motion.div className="status-msg error" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                ❌ No fue simultáneo. Coordinad mejor e intentadlo de nuevo.
              </motion.div>
            )}
          </AnimatePresence>

          {!keyLocked && (
            <motion.button
              className="btn btn-gold"
              onClick={handleInsert}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
            >
              🗝️ Insertar Llave
            </motion.button>
          )}
          {keyLocked && status === 'waiting' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              <div className="waiting-spinner" style={{ width: 24, height: 24, borderTopColor: 'var(--gold)' }} />
              Esperando sincronización…
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* SOUL Reveal Overlay */}
      <AnimatePresence>
        {soulPhase >= 1 && (
          <motion.div
            className="soul-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Confetti */}
            {confetti.map(c => (
              <div
                key={c.id}
                className="confetti-piece"
                style={{
                  left:              `${c.left}%`,
                  background:        c.color,
                  width:             `${c.size}px`,
                  height:            `${c.size}px`,
                  animationDuration: `${c.duration}s`,
                  animationDelay:    `${c.delay}s`,
                  borderRadius:      Math.random() > 0.5 ? '50%' : '2px',
                }}
              />
            ))}

            {/* Names row */}
            <div className="soul-names-row">
              {NAME_DATA.map((nd, ni) => (
                <motion.div
                  key={nd.name}
                  className="soul-name-card"
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={soulPhase >= 1 ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ delay: ni * 0.25, type: 'spring', stiffness: 200 }}
                >
                  <div className="soul-name-label" style={{ color: nd.color }}>{nd.name}</div>
                  <div className="soul-name-letters">
                    {nd.chars.map((ch, ci) => (
                      <motion.span
                        key={ci}
                        className={`soul-letter ${soulPhase >= 2 && nd.highlight.includes(ci) ? 'highlight' : ''}`}
                        animate={soulPhase >= 2 && nd.highlight.includes(ci)
                          ? { color: '#ffd700', scale: 1.3, textShadow: '0 0 20px #ffd700' }
                          : {}
                        }
                        transition={{ delay: ci * 0.1, duration: 0.4 }}
                        style={{ color: nd.highlight.includes(ci) ? (soulPhase >= 2 ? '#ffd700' : nd.color) : 'var(--text-dim)' }}
                      >
                        {ch}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Arrow */}
            {soulPhase >= 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ color: 'var(--gold)', fontSize: '2rem' }}
              >
                ↓
              </motion.div>
            )}

            {/* SOUL word */}
            {soulPhase >= 3 && (
              <motion.div className="soul-word">
                SOUL
              </motion.div>
            )}

            {/* Farewell message */}
            {soulPhase >= 4 && (
              <motion.p
                className="soul-message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                El alma de este equipo ha estado siempre en vosotros.<br />
                Una <strong style={{ color: 'var(--cyan)' }}>L</strong> de <strong style={{ color: 'var(--cyan)' }}>Li</strong>,
                una <strong style={{ color: 'var(--orange)' }}>U</strong> de n<strong style={{ color: 'var(--orange)' }}>U</strong>ria,
                una <strong style={{ color: 'var(--purple)' }}>O</strong> y una <strong style={{ color: 'var(--purple)' }}>S</strong> de J<strong style={{ color: 'var(--purple)' }}>OS</strong>é.<br /><br />
                <span style={{ color: 'var(--gold)', fontSize: '1.2em' }}>
                  Gracias por todo. Ha sido un privilegio trabajar con vosotros. ✨
                </span>
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game panels (hidden when overlay is open) */}
      {soulPhase === 0 && (isAdmin ? (
          <>
            <div className="level-panel j1-panel active-panel">
              <div className="level-panel-header">
                <div className="level-panel-role">Jugador 1 · Llave NURIA</div>
                <div className="level-panel-title">El Cofre Final — Admin</div>
              </div>
              <div className="level-panel-body" style={{ alignItems: 'center' }}>
                <div className="chest-scene" style={{ minHeight: 160 }}>
                  <div className="chest-3d">
                    <div className={`chest-lid ${chestOpen ? 'open' : ''}`} />
                    <div className="chest-body" />
                    <div className={`chest-glow ${chestOpen ? 'visible' : ''}`} />
                  </div>
                </div>
                <div className="panel-card" style={{ width: '100%', textAlign: 'center' }}>
                  <div className="label" style={{ marginBottom: '0.25rem' }}>J1 escribe → <strong style={{ color: 'var(--gold)' }}>NURIA</strong></div>
                  <div className="label">J2 escribe → <strong style={{ color: 'var(--orange)' }}>JOSE</strong></div>
                </div>
                <motion.button className="btn btn-gold" onClick={handleAdminTrigger}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} style={{ width: '100%' }}>
                  🗝️ Abrir Cofre — Ver Animación SOUL
                </motion.button>
              </div>
            </div>
            <div className="level-panel j2-panel">
              <div className="level-panel-header">
                <div className="level-panel-role">Jugador 2 · Llave JOSE</div>
                <div className="level-panel-title">Claves del cofre</div>
              </div>
              <div className="level-panel-body">
                <div className="panel-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem' }}>🗝️</div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    En el juego real, ambos insertan sus llaves simultáneamente.
                    Pulsa el botón del panel izquierdo para ver la animación SOUL.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <Panel isActive={true} />
          {/* Partner panel */}
          <div className={`level-panel ${role === 'j1' ? 'j2-panel' : 'j1-panel'}`}>
            <div className="level-panel-header">
              <div className="level-panel-role">{role === 'j1' ? 'Jugador 2' : 'Jugador 1'} · El Cofre Final</div>
              <div className="level-panel-title">Sincronizad las llaves</div>
            </div>
            <div className="level-panel-body" style={{ alignItems: 'center' }}>
              <div className="panel-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem' }}>🗝️</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Tu compañero también tiene una llave digital diferente.<br />
                  Ambos debéis introducirla y pulsar <strong>INSERTAR</strong> al mismo tiempo.<br /><br />
                  Coordinad en voz alta: <em>"A la de tres… uno… dos… ¡TRES!"</em>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tú</div>
                  <div style={{ fontSize: '2rem' }}>{keyLocked ? '🔑' : '⏳'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Compañero</div>
                  <div style={{ fontSize: '2rem' }}>{partnerTs ? '🔑' : '⏳'}</div>
                </div>
              </div>
            </div>
          </div>
        </>
        )
      )}
    </>
  )
}
