import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, LEVEL_META } from '../store/useGameStore'
import { createChannel, broadcast } from '../lib/sync'
import TowerHeader from '../components/ui/TowerHeader'
import NpcBackground from '../components/ui/NpcBackground'
import AdminBar from '../components/ui/AdminBar'
import UnicornChat from '../components/ui/UnicornChat'

// Level components
import Level01 from '../levels/Level01_Password'
import Level02 from '../levels/Level02_DateDay'
import Level03 from '../levels/Level03_Cables'
import Level04 from '../levels/Level04_MathCode'
import Level05 from '../levels/Level05_Maze'
import Level06 from '../levels/Level06_NpcTranslation'
import Level07 from '../levels/Level07_Valves'
import Level08 from '../levels/Level08_VisualMemory'
import Level09 from '../levels/Level09_Sync'
import Level10 from '../levels/Level10_Chest'

const LEVELS      = [null, Level01, Level02, Level03, Level04, Level05, Level06, Level07, Level08, Level09, Level10]
const TIMER_SECS  = 120
const NO_TIMER    = [10]  // Level 10 (finale) has no pressure timer

// ── Gran temporizador visual ─────────────────────────────────────────────────
function BigTimer({ sec, total = TIMER_SECS }) {
  const pct     = Math.max(0, sec / total)
  const urgent  = sec <= 10
  const warning = sec <= 20

  return (
    <motion.div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.4rem 1.5rem 0.5rem',
        background: urgent
          ? 'rgba(255,34,68,0.08)'
          : 'rgba(0,0,0,0.35)',
        borderBottom: `2px solid ${urgent ? 'rgba(255,34,68,0.5)' : 'rgba(255,255,255,0.06)'}`,
        backdropFilter: 'blur(8px)',
        transition: 'background 0.5s, border-color 0.5s',
        zIndex: 10,
      }}
    >
      {/* Número principal — ENORME */}
      <motion.div
        key={sec}          // re-animate on each tick
        initial={{ scale: 1.15, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{
          fontFamily:  'var(--font-display)',
          fontSize:    urgent ? '4.5rem' : '3.8rem',
          fontWeight:  900,
          lineHeight:  1,
          minWidth:    '3ch',
          textAlign:   'right',
          color:       urgent ? '#ff2244' : warning ? '#ffd700' : '#00d4ff',
          textShadow:  urgent
            ? '0 0 40px rgba(255,34,68,0.9), 0 0 80px rgba(255,34,68,0.4)'
            : warning
              ? '0 0 30px rgba(255,215,0,0.7)'
              : '0 0 20px rgba(0,212,255,0.6)',
          transition:  'color 0.4s, text-shadow 0.4s, font-size 0.2s',
          ...(urgent ? { animation: 'timerPulse 0.45s ease-in-out infinite alternate' } : {}),
        }}
      >
        {String(sec).padStart(2, '0')}
      </motion.div>

      {/* Barra + etiqueta */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          letterSpacing: '0.15em',
          color: urgent ? 'rgba(255,34,68,0.8)' : 'rgba(255,255,255,0.3)',
        }}>
          {urgent ? '⚠️  TIEMPO AGOTÁNDOSE' : '⏳  TIEMPO RESTANTE'}
        </div>
        {/* Barra de progreso */}
        <div style={{
          height: 10, background: 'rgba(255,255,255,0.06)',
          borderRadius: 5, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <motion.div
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
            style={{
              height: '100%', borderRadius: 5,
              background: urgent
                ? 'linear-gradient(90deg, #ff2244, #ff6b35)'
                : warning
                  ? 'linear-gradient(90deg, #ffd700, #ff6b35)'
                  : 'linear-gradient(90deg, #00d4ff, #a855f7)',
              boxShadow: urgent ? '0 0 12px rgba(255,34,68,0.7)' : 'none',
              transition: 'background 0.5s',
            }}
          />
        </div>
        {/* Mini segmentos de 5s */}
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: Math.floor(total / 5) }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: (i * 5) < sec
                ? (urgent ? 'rgba(255,34,68,0.6)' : 'rgba(0,212,255,0.35)')
                : 'rgba(255,255,255,0.05)',
              transition: 'background 0.4s',
            }} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default function GameScreen() {
  const { floor, role, roomCode, channel, advanceFloor, setPartnerConnected, isAdmin } = useGameStore()
  const advancedRef = useRef(false)

  // ── Timer global ──────────────────────────────────────────────────────────
  const [timerSec,  setTimerSec]  = useState(TIMER_SECS)
  const [showChat,  setShowChat]  = useState(false)
  const [chatKey,   setChatKey]   = useState(0)     // force remount on new chat
  const timerRef = useRef(null)

  // Reset timer when floor changes
  useEffect(() => {
    setTimerSec(TIMER_SECS)
    setShowChat(false)
    advancedRef.current = false
  }, [floor])

  // Countdown tick
  useEffect(() => {
    if (NO_TIMER.includes(floor) || isAdmin || showChat) {
      clearInterval(timerRef.current)
      return
    }
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimerSec(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setShowChat(true)
          if (channel) broadcast(channel, 'global_chat_open', { targetFloor: floor })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [floor, showChat, isAdmin]) // eslint-disable-line

  // ── Sync channel ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAdmin || !channel) return

    const onSync = () => {
      const count = Object.keys(channel.presenceState()).length
      setPartnerConnected(count >= 2)
    }

    const onAdvance = ({ payload }) => {
      console.log('[DEBUG] Recibido evento floor_advance:', payload)
      if (advancedRef.current) {
        console.log('[DEBUG] Ya avanzado, ignorando floor_advance')
        return
      }
      advancedRef.current = true
      advanceFloor()
    }

    const onChatOpen = ({ payload }) => {
      // If they opened the chat for an old floor, ignore it
      if (payload?.targetFloor !== undefined && payload.targetFloor !== useGameStore.getState().floor) return
      setShowChat(true)
    }

    channel.on('presence', { event: 'sync' }, onSync)
    channel.on('broadcast', { event: 'floor_advance' }, onAdvance)
    channel.on('broadcast', { event: 'global_chat_open' }, onChatOpen)

    return () => {
      channel.off('presence', { event: 'sync' }, onSync)
      channel.off('broadcast', { event: 'floor_advance' }, onAdvance)
      channel.off('broadcast', { event: 'global_chat_open' }, onChatOpen)
    }
  }, [channel, isAdmin]) // eslint-disable-line

  async function handleSolve() {
    console.log('[DEBUG] Solucionado localmente. advancedRef:', advancedRef.current)
    if (advancedRef.current) return
    advancedRef.current = true
    if (isAdmin) { advanceFloor(); return }
    if (channel) {
      console.log('[DEBUG] Enviando broadcast floor_advance para piso:', floor)
      await broadcast(channel, 'floor_advance', { floor })
    }
    advanceFloor()
  }

  function handleChatDone() {
    setShowChat(false)
    setChatKey(k => k + 1)   // remount chat fresh next time
    setTimerSec(TIMER_SECS)  // restart timer
  }

  const LevelComponent = LEVELS[floor]
  const showTimer = !NO_TIMER.includes(floor) && !isAdmin && !showChat

  return (
    <div className="game-screen">
      <NpcBackground />
      <TowerHeader />

      {/* ── GRAN TEMPORIZADOR ── */}
      <AnimatePresence>
        {showTimer && (
          <motion.div
            key={`timer-${floor}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <BigTimer sec={timerSec} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NIVEL ACTIVO ── */}
      <AnimatePresence mode="wait">
        {LevelComponent && (
          <motion.div
            key={floor}
            className="level-layout"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.4 }}
            style={{ flex: 1, minHeight: 0 }}
          >
            <LevelComponent
              role={role}
              channel={channel}
              onSolve={handleSolve}
              isAdmin={isAdmin}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── UNICORNIO CHAT (timer expirado) ── */}
      {showChat && !isAdmin && (
        <UnicornChat
          key={chatKey}
          channel={channel}
          role={role}
          levelId="global"
          onDone={handleChatDone}
        />
      )}

      {/* Admin bar */}
      {isAdmin && <AdminBar onSkip={handleSolve} />}
    </div>
  )
}
