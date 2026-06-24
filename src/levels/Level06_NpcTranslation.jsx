/**
 * LEVEL 06 — Tres en Raya
 *
 * J1 (X) y J2 (O) juegan al tres en raya entre ellos.
 * Solo puede ganar UNA persona — nunca los dos a la vez.
 * Pueden reintentar todas las veces que quieran.
 *
 * Cuando alguien gana → mensaje "la victoria hay que compartirla"
 * → aparece el botón del unicornio de Li.
 * Cada jugador escribe la frase de rendición → 🦄 → avanzar.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { broadcast } from '../lib/sync'
import UnicornChat from '../components/ui/UnicornChat'

const PHRASE = 'EL UNICORNIO ME HA GANADO, LI ES LA MEJOR'

// Combinaciones ganadoras
const WINS = [
  [0,1,2],[3,4,5],[6,7,8],  // filas
  [0,3,6],[1,4,7],[2,5,8],  // columnas
  [0,4,8],[2,4,6],          // diagonales
]

function checkWinner(board) {
  for (const [a,b,c] of WINS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a,b,c] }
    }
  }
  if (board.every(c => c !== null)) return { winner: 'draw', line: [] }
  return null
}

// ── Animación del Unicornio ──────────────────────────────────────────────────
function UnicornReveal() {
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
      {/* Arcoíris */}
      {['#ff0000','#ff7700','#ffff00','#00ff00','#0000ff','#8b00ff'].map((c, i) => (
        <motion.div key={c} style={{
          position: 'absolute', left: 0,
          top: `calc(50% + ${(i - 2.5) * 20}px)`,
          height: 14, borderRadius: 7, background: c, opacity: 0.5,
        }}
          initial={{ width: 0 }}
          animate={{ width: '65vw' }}
          transition={{ delay: 0.1 * i, duration: 0.8, ease: 'easeOut' }}
        />
      ))}

      {/* Anillos de explosión */}
      {[0.3, 0.6, 0.9].map((delay, i) => (
        <motion.div key={i} style={{
          position: 'absolute', width: 10, height: 10,
          borderRadius: '50%', border: '3px solid',
          borderColor: ['#ff6b35','#a855f7','#00d4ff'][i],
        }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: [0, 22, 36], opacity: [1, 0.5, 0] }}
          transition={{ delay, duration: 1.4, ease: 'easeOut' }}
        />
      ))}

      {/* Unicornio */}
      <motion.div
        style={{ fontSize: 'clamp(5rem, 18vw, 10rem)', position: 'relative', zIndex: 10 }}
        initial={{ x: '-110vw', rotate: -20 }}
        animate={{ x: 0, rotate: [-20, 10, -5, 0] }}
        transition={{ type: 'spring', stiffness: 60, damping: 14 }}
      >
        🦄
      </motion.div>

      <motion.div style={{ textAlign: 'center', zIndex: 10 }}
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
      >
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 3vw, 1.6rem)',
          fontWeight: 900, color: '#a855f7', letterSpacing: '0.05em',
          textShadow: '0 0 30px #a855f7',
        }}>
          ¡EL UNICORNIO DE LI HA LLEGADO!
        </div>
        <motion.div
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
        >
          💥 El tablero ha sido destruido. La humildad os abre la puerta.
        </motion.div>
        <motion.div
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 2.2vw, 1.3rem)', color: 'var(--gold)', marginTop: '1rem', textShadow: '0 0 20px var(--gold)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}
        >
          ✨ La victoria pertenece al equipo ✨
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Level06({ role, channel, onSolve, isAdmin }) {
  const [board,     setBoard]     = useState(Array(9).fill(null))
  const [turn,      setTurn]      = useState('j1')
  const [result,    setResult]    = useState(null)
  const [winCount,  setWinCount]  = useState({ j1: 0, j2: 0 })
  const [helpPhase, setHelpPhase] = useState(false)
  const [myPhrase,  setMyPhrase]  = useState('')
  const [myDone,    setMyDone]    = useState(false)
  const [partDone,  setPartDone]  = useState(false)
  const [unicorn,   setUnicorn]   = useState(false)
  // — Timer 45s —
  const [showChat,   setShowChat]   = useState(false)
  const [timerSec,   setTimerSec]   = useState(45)
  const [gameEpoch,  setGameEpoch]  = useState(0)  // increment to restart timer
  const timerRef = useRef(null)

  // ── Recibir eventos del compañero ──
  useEffect(() => {
    if (!channel) return
    channel.on('broadcast', { event: 'l06_move' }, ({ payload }) => {
      setBoard(payload.board)
      setTurn(payload.turn)
      const r = checkWinner(payload.board)
      if (r) {
        setResult(r)
        setWinCount(prev => r.winner !== 'draw' ? { ...prev, [r.winner === 'X' ? 'j1' : 'j2']: prev[r.winner === 'X' ? 'j1' : 'j2'] + 1 } : prev)
      }
    })
    channel.on('broadcast', { event: 'l06_reset' }, () => {
      setBoard(Array(9).fill(null))
      setTurn('j1')
      setResult(null)
    })
    channel.on('broadcast', { event: 'l06_help' }, () => {
      setHelpPhase(true)
    })
    channel.on('broadcast', { event: 'l06_phrase_done' }, () => {
      setPartDone(true)
    })
    channel.on('broadcast', { event: 'l06_unicorn' }, () => {
      setUnicorn(true)
    })
    // Partner triggered chat
    channel.on('broadcast', { event: 'l06_chat_open' }, () => {
      setShowChat(true)
    })
  }, [channel]) // eslint-disable-line

  // Timer de 45s — corre mientras no hay chat abierto, ni unicornio, ni fase de ayuda
  useEffect(() => {
    if (showChat || unicorn || helpPhase || isAdmin) return
    setTimerSec(45)
    timerRef.current = setInterval(() => {
      setTimerSec(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setShowChat(true)
          if (channel) broadcast(channel, 'l06_chat_open', {})
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [gameEpoch, showChat, unicorn, helpPhase]) // eslint-disable-line

  // ── Cuando ambos completan la frase ──
  useEffect(() => {
    if (myDone && partDone && !unicorn) {
      setTimeout(() => {
        setUnicorn(true)
        if (channel) broadcast(channel, 'l06_unicorn', {})
      }, 600)
    }
  }, [myDone, partDone]) // eslint-disable-line

  // Unicorn animation: after it plays, call onSolve
  useEffect(() => {
    if (!unicorn) return
    const t = setTimeout(() => onSolve(), 5500)
    return () => clearTimeout(t)
  }, [unicorn]) // eslint-disable-line

  // ── Hacer un movimiento (solo el jugador de turno) ──
  function handleCell(idx) {
    const myMark  = role === 'j1' ? 'X' : 'O'
    const myTurn  = (turn === 'j1' && role === 'j1') || (turn === 'j2' && role === 'j2') || isAdmin
    if (!myTurn || board[idx] || result) return

    const newBoard = [...board]
    newBoard[idx]  = isAdmin ? (turn === 'j1' ? 'X' : 'O') : myMark
    const nextTurn = turn === 'j1' ? 'j2' : 'j1'
    const newResult = checkWinner(newBoard)

    setBoard(newBoard)
    setTurn(nextTurn)
    if (newResult) {
      setResult(newResult)
      setWinCount(prev => newResult.winner !== 'draw' ? {
        ...prev,
        [newResult.winner === 'X' ? 'j1' : 'j2']: prev[newResult.winner === 'X' ? 'j1' : 'j2'] + 1
      } : prev)
    }
    if (channel) broadcast(channel, 'l06_move', { board: newBoard, turn: nextTurn })
  }

  function handleReset() {
    setBoard(Array(9).fill(null))
    setTurn('j1')
    setResult(null)
    if (channel) broadcast(channel, 'l06_reset', {})
  }

  function handleHelp() {
    setHelpPhase(true)
    if (channel) broadcast(channel, 'l06_help', {})
  }

  function handlePhrase(val) {
    const upper = val.toUpperCase()
    setMyPhrase(upper)
    if (upper === PHRASE && !myDone) {
      setMyDone(true)
      if (channel) broadcast(channel, 'l06_phrase_done', {})
    }
  }

  // ── Render del tablero ──
  const MARK_COLOR = { X: 'var(--cyan)', O: 'var(--orange)' }

  function Board() {
    const myMark   = role === 'j1' || isAdmin ? 'X' : 'O'
    const myTurn   = (turn === 'j1' && (role === 'j1' || isAdmin)) || (turn === 'j2' && (role === 'j2' || isAdmin))
    const isMyRole = role === 'j1' || role === 'j2'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
        {/* Turno */}
        {!result && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', textAlign: 'center' }}>
            {myTurn
              ? <span style={{ color: MARK_COLOR[isAdmin ? (turn==='j1'?'X':'O') : myMark] }}>● Tu turno — haz clic en una casilla</span>
              : <span style={{ color: 'var(--text-muted)' }}>⏳ Turno de tu compañero…</span>
            }
          </div>
        )}

        {/* Grid 3×3 */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6, width: '100%', maxWidth: 260,
        }}>
          {board.map((cell, idx) => {
            const isWinLine = result?.line?.includes(idx)
            const canClick  = !cell && !result && myTurn
            return (
              <motion.div
                key={idx}
                onClick={() => handleCell(idx)}
                whileHover={canClick ? { scale: 1.05, borderColor: MARK_COLOR[isAdmin?(turn==='j1'?'X':'O'):myMark] } : {}}
                whileTap={canClick ? { scale: 0.95 } : {}}
                style={{
                  aspectRatio: '1',
                  background: isWinLine ? 'rgba(255,215,0,0.12)' : 'var(--bg-elevated)',
                  border: `2px solid ${isWinLine ? 'var(--gold)' : cell ? MARK_COLOR[cell] + '55' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: canClick ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                }}
              >
                <AnimatePresence>
                  {cell && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(1.2rem, 4vw, 2rem)',
                        fontWeight: 900,
                        color: MARK_COLOR[cell],
                        textShadow: `0 0 12px ${MARK_COLOR[cell]}`,
                      }}
                    >
                      {cell}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Marcador */}
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>J1 (X)</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--cyan)' }}>{winCount.j1}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--border)', alignSelf: 'center' }}>—</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>J2 (O)</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--orange)' }}>{winCount.j2}</div>
          </div>
        </div>
      </div>
    )
  }

  // ── Resultado: victoria o empate ──
  function ResultPanel() {
    if (!result) return null
    const isDraw    = result.winner === 'draw'
    const winnerMk  = result.winner  // 'X' | 'O' | 'draw'
    const winnerRole = winnerMk === 'X' ? 'J1' : 'O' ? 'J2' : ''
    const winnerColor = winnerMk === 'X' ? 'var(--cyan)' : 'var(--orange)'

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{
            background: isDraw ? 'rgba(255,215,0,0.08)' : `rgba(${winnerMk==='X'?'0,212,255':'255,107,53'},0.08)`,
            border: `2px solid ${isDraw ? 'var(--gold)' : winnerColor}`,
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            textAlign: 'center',
            width: '100%',
          }}
        >
          {isDraw ? (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🤝</div>
              <div style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '0.9rem', fontWeight: 700 }}>EMPATE</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Nadie gana. ¿Otra partida?</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🏆</div>
              <div style={{ fontFamily: 'var(--font-display)', color: winnerColor, fontSize: '0.9rem', fontWeight: 700 }}>
                {winnerRole} HA GANADO
              </div>
              <div style={{
                fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem',
                fontStyle: 'italic', lineHeight: 1.5,
              }}>
                Pero… ¿de qué sirve ganar si no podéis avanzar juntos?<br />
                <strong style={{ color: 'var(--text-primary)' }}>La victoria hay que compartirla.</strong>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn" style={{ fontSize: '0.75rem' }} onClick={handleReset}>
              🔄 Reintentar
            </button>
            {!helpPhase && (
              <motion.button
                className="btn"
                style={{ fontSize: '0.75rem', borderColor: '#a855f7', color: '#a855f7' }}
                onClick={handleHelp}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🦄 Necesitamos la ayuda de Li
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── Fase de ayuda: cada jugador escribe la frase ──
  function HelpPanel() {
    if (!helpPhase) return null
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(168,85,247,0.08)',
            border: '2px solid rgba(168,85,247,0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            width: '100%',
          }}
        >
          <div className="label" style={{ color: '#a855f7', marginBottom: '0.5rem' }}>
            📜 Escribe EXACTAMENTE para convocar al unicornio:
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--gold)',
            padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: 6,
            marginBottom: '0.75rem', lineHeight: 1.6, userSelect: 'all',
          }}>
            {PHRASE}
          </div>

          <textarea
            style={{
              width: '100%', resize: 'none', height: 80,
              background: 'var(--bg-deep)',
              border: `2px solid ${myDone ? 'var(--success)' : myPhrase.length > 0 ? 'rgba(168,85,247,0.5)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
              color: myDone ? 'var(--success)' : 'var(--text-primary)',
              outline: 'none', transition: 'border-color 0.2s',
            }}
            placeholder="Escribe aquí la frase exacta…"
            value={myPhrase}
            onChange={e => handlePhrase(e.target.value)}
            disabled={myDone}
          />

          {/* Barra de progreso */}
          <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
            <motion.div
              style={{ height: '100%', background: myDone ? 'var(--success)' : '#a855f7', borderRadius: 2 }}
              animate={{ width: `${Math.min((myPhrase.length / PHRASE.length) * 100, 100)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4 }}>
            <span>{myPhrase.length} / {PHRASE.length}</span>
            {myDone ? (
              <span style={{ color: 'var(--success)' }}>✅ Tu frase completada</span>
            ) : (
              <span>Esperando tu frase…</span>
            )}
          </div>

          <div style={{ marginTop: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: partDone ? 'var(--success)' : 'var(--text-dim)' }}>
            {partDone ? '✅ Tu compañero también ha completado la frase' : '⏳ Esperando a tu compañero…'}
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── Unicornio ──
  if (unicorn) return <UnicornReveal />

  // ── Admin: panel único con todo ──
  if (isAdmin) {
    return (
      <>
        {showChat && (
          <UnicornChat channel={null} role="admin" levelId="l06"
            onDone={() => {
              setShowChat(false)
              setBoard(Array(9).fill(null))
              setTurn('j1')
              setResult(null)
              setGameEpoch(e => e + 1)
            }}
          />
        )}
        <div className="level-panel j1-panel active-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Admin · Tres en Raya</div>
            <div className="level-panel-title">Tablero — haz clic para mover (cualquier turno)</div>
          </div>
          <div className="level-panel-body" style={{ alignItems: 'center', gap: '0.75rem' }}>
            <Board />
            <ResultPanel />
            <HelpPanel />
          </div>
        </div>
        <div className="level-panel j2-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Admin · Estado</div>
            <div className="level-panel-title">Turno actual y progreso</div>
          </div>
          <div className="level-panel-body">
            <div className="panel-card" style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: turn === 'j1' ? 'var(--cyan)' : 'var(--orange)' }}>
                Turno: {turn.toUpperCase()} ({turn === 'j1' ? 'X' : 'O'})
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Haz clic para mover. Tras una victoria, usa "Necesitamos la ayuda de Li" y escribe la frase.
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── J1 y J2: ambos ven el mismo tablero ──
  const myLabel  = role === 'j1' ? 'Jugador 1 (X)' : 'Jugador 2 (O)'
  const myColor  = role === 'j1' ? 'var(--cyan)' : 'var(--orange)'
  const oppLabel = role === 'j1' ? 'Jugador 2 (O)' : 'Jugador 1 (X)'

  return (
    <>
      {/* UnicornChat overlay cuando el timer expira */}
      {showChat && (
        <UnicornChat
          channel={channel}
          role={role}
          levelId="l06"
          onDone={() => {
            setShowChat(false)
            setBoard(Array(9).fill(null))
            setTurn('j1')
            setResult(null)
            setGameEpoch(e => e + 1)  // reinicia el timer
          }}
        />
      )}
      {/* Panel activo del jugador actual */}
      <div className={`level-panel ${role === 'j1' ? 'j1-panel' : 'j2-panel'} active-panel`}>
        <div className="level-panel-header">
          <div className="level-panel-role" style={{ color: myColor }}>{myLabel} · Tres en Raya</div>
          <div className="level-panel-title">Tablero de juego</div>
          {/* Temporizador */}
          {!helpPhase && (
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
              color: timerSec <= 10 ? 'var(--danger)' : 'var(--text-muted)',
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}>
              <span>{timerSec <= 10 ? '⏰' : '⏳'}</span>
              <span style={{ fontWeight: 700 }}>{timerSec}s</span>
            </div>
          )}
        </div>
        <div className="level-panel-body" style={{ alignItems: 'center', gap: '0.75rem' }}>
          <Board />
          <ResultPanel />
          <HelpPanel />
        </div>
      </div>

      {/* Panel del oponente: misma vista pero sin controles */}
      <div className={`level-panel ${role === 'j1' ? 'j2-panel' : 'j1-panel'}`}>
        <div className="level-panel-header">
          <div className="level-panel-role">{oppLabel} · Vista del oponente</div>
          <div className="level-panel-title">Mismo tablero en tiempo real</div>
        </div>
        <div className="level-panel-body" style={{ alignItems: 'center' }}>
          <div className="panel-card" style={{ width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Tu oponente ve exactamente el mismo tablero.<br />
              Solo puede ganar <strong style={{ color: 'var(--text-primary)' }}>una persona</strong>.<br />
              ¿Quizás la victoria hay que compartirla?
            </p>
          </div>
          {result && !helpPhase && (
            <motion.button
              className="btn"
              style={{ borderColor: '#a855f7', color: '#a855f7', fontSize: '0.8rem' }}
              onClick={handleHelp}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
            >
              🦄 Necesitamos la ayuda de Li
            </motion.button>
          )}
          {helpPhase && (
            <div style={{ fontSize: '0.78rem', color: '#a855f7', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
              {myDone ? '✅ Has completado la frase' : '⏳ Escribe la frase en tu panel izquierdo…'}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── UnicornChat overlay para Level06 — renderizado al final del return principal ──
// Esto se añade a través del wrapper en GameScreen.
