import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/useGameStore'
import { createChannel, broadcast, isSupabaseConfigured } from '../lib/sync'
import NpcBackground from '../components/ui/NpcBackground'

const ADMIN_CODE = 'LIELEMEJOR'

function generateCode() {
  return Math.random().toString(36).toUpperCase().slice(2, 8)
}

function Stars() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    top:  Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    d:    Math.random() * 4 + 2,
    delay: Math.random() * 4,
    minO: (Math.random() * 0.2).toFixed(2),
    maxO: (Math.random() * 0.7 + 0.3).toFixed(2),
  }))
  return (
    <div className="stars-bg">
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          top:    `${s.top}%`,
          left:   `${s.left}%`,
          width:  `${s.size}px`,
          height: `${s.size}px`,
          '--d':       `${s.d}s`,
          '--delay':   `${s.delay}s`,
          '--min-o':   s.minO,
          '--max-o':   s.maxO,
        }} />
      ))}
    </div>
  )
}

export default function LobbyScreen() {
  const { roomCode, role, setRoomCode, setRole, startGame, partnerConnected, setPartnerConnected, setAdmin, channel, setChannel } = useGameStore()
  const [localInput, setLocalInput] = useState('')
  const [phase, setPhase] = useState('enter-code')   // 'enter-code' | 'pick-role'
  const [takenRole, setTakenRole] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      // DO NOT unsubscribe on unmount, we want the channel to persist into GameScreen
    }
  }, [])

  // ---- Generate code ----
  function handleGenerate() {
    const code = generateCode()
    setLocalInput(code)
  }

  // ---- Join / create room ----
  async function handleJoin() {
    const code = localInput.trim().toUpperCase()
    if (code.length < 4) { setError('El código debe tener al menos 4 caracteres'); return }
    setError('')

    // Unsubscribe from any previous channel first
    if (channel) {
      try {
        await channel.unsubscribe()
      } catch (err) {
        console.error('Error unsubscribing previous channel:', err)
      }
      setChannel(null)
    }

    // ---- ADMIN MODE ----
    if (code === ADMIN_CODE) {
      setAdmin(true)
      setRoomCode('ADMIN')
      setRole('j1')
      setPartnerConnected(true)  // pretend partner is online
      setPhase('admin-ready')
      return
    }

    setRoomCode(code)
    setPhase('pick-role')

    // Subscribe to channel
    const ch = await createChannel(code)
    setChannel(ch)

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState()
      const vals  = Object.values(state)
      const otherRoles = vals.filter(v => v.role !== role).map(v => v.role)
      if (otherRoles.length > 0) {
        setTakenRole(otherRoles[0])
        setPartnerConnected(true)
      } else {
        setPartnerConnected(false)
      }
    })

    ch.on('broadcast', { event: 'game_start' }, () => {
      startGame()
    })

    await ch.subscribe()
  }

  async function handlePickRole(r) {
    if (r === takenRole) return
    setRole(r)
    // Usamos 'ch' si estamos en medio de setup, o 'channel' si ya se guardó.
    // Como handlePickRole se llama por un botón, 'channel' de Zustand ya debería tener el valor.
    if (channel) {
      await channel.track({ role: r })
    }
  }

  async function handleStart() {
    if (!role) return
    if (channel) {
      await broadcast(channel, 'game_start', {})
    }
    startGame()
  }

  const canStart = role && (partnerConnected || !isSupabaseConfigured)

  return (
    <div className="lobby-screen">
      <Stars />
      <NpcBackground />

      {/* Tower silhouette */}
      <svg className="tower-silhouette" viewBox="0 0 100 300" fill="currentColor" style={{ color: 'white' }}>
        <rect x="35" y="280" width="30" height="20" />
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={30 + i * 0.5} y={280 - (i + 1) * 26} width={40 - i} height={24} />
        ))}
        <polygon points="50,0 30,60 70,60" />
      </svg>

      <div className="lobby-content">
        {/* Logo */}
        <motion.div
          className="lobby-logo"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="lobby-logo-title">50 sombras de CEBI</div>
          <div className="lobby-logo-sub">Escape Room Cooperativo · 10 Pisos · 2 Jugadores</div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* PHASE 1: Enter room code */}
          {phase === 'enter-code' && (
            <motion.div
              key="enter-code"
              className="lobby-phase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="lobby-phase-title">Introduce o genera un código de sala</div>
              <div className="room-code-row">
                <input
                  className="room-input"
                  placeholder="CÓDIGO"
                  maxLength={10}
                  value={localInput}
                  onChange={e => setLocalInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
                <button className="btn-icon" onClick={handleGenerate} title="Generar código aleatorio">⚄</button>
              </div>
              {error && <div className="status-msg error">{error}</div>}
              <button className="btn btn-primary" onClick={handleJoin}>
                Entrar a la sala →
              </button>
              <div className="mode-badge">
                {isSupabaseConfigured
                  ? '🌐 Modo Online (Supabase)'
                  : '💻 Modo Local (misma pestaña/navegador)'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                Tip: usa un código especial para activar el modo administrador
              </div>
            </motion.div>
          )}

          {/* PHASE: Admin ready */}
          {phase === 'admin-ready' && (
            <motion.div
              key="admin-ready"
              className="lobby-phase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div style={{
                background: 'rgba(168,85,247,0.1)',
                border: '2px solid #a855f7',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem 2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <div style={{ fontSize: '2.5rem' }}>🔑</div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#a855f7',
                  letterSpacing: '0.15em',
                }}>MODO ADMINISTRADOR</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 340, lineHeight: 1.6 }}>
                  Activado correctamente. Verás los dos paneles a la vez y tendrás
                  acceso a pistas y botón de saltar en cada piso.
                </p>
              </div>
              <motion.button
                className="btn-start"
                style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' }}
                onClick={() => startGame()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                🚀 Iniciar Tour Admin
              </motion.button>
              <button
                className="btn"
                style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}
                onClick={() => { setPhase('enter-code'); setAdmin(false) }}
              >
                ← Volver
              </button>
            </motion.div>
          )}

          {/* PHASE 2: Pick role */}
          {phase === 'pick-role' && (
            <motion.div
              key="pick-role"
              className="lobby-phase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="lobby-phase-title">
                Sala: <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-display)', letterSpacing: '0.2em' }}>
                  {roomCode}
                </span>
              </div>

              <div className="role-cards">
                {/* Player 1 */}
                <motion.div
                  className={`role-card j1 ${role === 'j1' ? 'selected' : ''} ${takenRole === 'j1' ? 'disabled' : ''}`}
                  onClick={() => handlePickRole('j1')}
                  whileHover={{ scale: takenRole === 'j1' ? 1 : 1.03 }}
                  whileTap={{ scale: takenRole === 'j1' ? 1 : 0.97 }}
                >
                  <div className="role-icon">🔵</div>
                  <div className="role-name">Jugador 1</div>
                  <div className="role-desc">Controlas la interfaz principal. Necesitarás a tu compañero para entender lo que ves.</div>
                  {takenRole === 'j1' && <div className="role-taken-badge">Ocupado por tu compañero</div>}
                  {role === 'j1' && <div className="role-taken-badge" style={{ color: 'var(--cyan)', borderColor: 'var(--cyan)' }}>✓ Seleccionado</div>}
                </motion.div>

                {/* Player 2 */}
                <motion.div
                  className={`role-card j2 ${role === 'j2' ? 'selected' : ''} ${takenRole === 'j2' ? 'disabled' : ''}`}
                  onClick={() => handlePickRole('j2')}
                  whileHover={{ scale: takenRole === 'j2' ? 1 : 1.03 }}
                  whileTap={{ scale: takenRole === 'j2' ? 1 : 0.97 }}
                >
                  <div className="role-icon">🟠</div>
                  <div className="role-name">Jugador 2</div>
                  <div className="role-desc">Tienes las pistas y el mapa. Sin ti tu compañero está perdido — literalmente.</div>
                  {takenRole === 'j2' && <div className="role-taken-badge">Ocupado por tu compañero</div>}
                  {role === 'j2' && <div className="role-taken-badge" style={{ color: 'var(--orange)', borderColor: 'var(--orange)' }}>✓ Seleccionado</div>}
                </motion.div>
              </div>

              {/* Partner presence */}
              <div className="presence-row">
                <div className={`presence-dot ${role ? 'online' : ''}`}>
                  <div className="dot" />
                  <span>Tú ({role ? (role === 'j1' ? 'J1' : 'J2') : '—'})</span>
                </div>
                <div className={`presence-dot ${partnerConnected ? 'online' : ''}`}>
                  <div className="dot" />
                  <span>{partnerConnected ? 'Compañero conectado ✓' : 'Esperando compañero…'}</span>
                </div>
              </div>

              {!isSupabaseConfigured && (
                <div className="status-msg info" style={{ maxWidth: 420 }}>
                  💡 <strong>Modo local:</strong> Abre una segunda pestaña con el mismo código y selecciona el otro rol para probar.
                </div>
              )}

              <motion.button
                className="btn-start"
                onClick={handleStart}
                disabled={!canStart}
                whileHover={{ scale: canStart ? 1.05 : 1 }}
                whileTap={{ scale: canStart ? 0.97 : 1 }}
              >
                {canStart ? '🚀 Iniciar La Torre' : 'Esperando…'}
              </motion.button>

              <button
                className="btn"
                style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}
                onClick={async () => {
                  if (channel) {
                    try {
                      await channel.unsubscribe()
                    } catch (err) {
                      console.error(err)
                    }
                    setChannel(null)
                  }
                  setPhase('enter-code')
                  setTakenRole(null)
                  setPartnerConnected(false)
                }}
              >
                ← Cambiar sala
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
