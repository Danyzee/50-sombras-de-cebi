/**
 * LEVEL 05 — Laberinto a Ciegas (v2 — Mapa reforzado)
 *
 * J1: Canvas con fog-of-war. Se mueve con teclado. NO ve el mapa.
 * J2: Mapa completo con posición del avatar, trampas y salida.
 *     J1 NO puede ver el mapa en ninguno de sus paneles.
 *
 * Laberinto más difícil con camino más largo y más callejones sin salida.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { broadcast } from '../lib/sync'

const CELL  = 26    // px por celda en vista de J1
const MINI  = 16    // px por celda en minimapa de J2
const FOGR  = 2.2   // radio de niebla más estrecho = más difícil
const ROWS  = 15
const COLS  = 15

/* eslint-disable */
// Laberinto nuevo — más difícil, más callejones sin salida
// Entrada: (1,1)  Salida: (13,13)
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,1,0,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,1,1,0,1,0,1,1,1,1,1,0,1,1,1],
  [1,0,0,0,1,0,1,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,0,1,1,1,0,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,1,0,1,0,0,0,1],
  [1,0,1,0,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]
/* eslint-enable */

const START = { x: 1, y: 1 }
const EXIT  = { x: 13, y: 13 }
// Trampas solo visibles en el mapa de J2
const TRAPS = [{ x: 5, y: 1 }, { x: 5, y: 6 }, { x: 7, y: 12 }]

// ── Dibujado del laberinto ──────────────────────────────────────────────────
function drawMaze(ctx, px, py, foggy) {
  const cs = foggy ? CELL : MINI
  const W  = COLS * cs
  const H  = ROWS * cs
  ctx.clearRect(0, 0, W, H)

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const isWall = MAZE[r][c] === 1
      const isExit = c === EXIT.x && r === EXIT.y
      const isTrap = TRAPS.some(t => t.x === c && t.y === r)

      if (foggy) {
        // Fog of war
        const dist = Math.hypot(c - px, r - py)
        if (dist > FOGR + 0.5) {
          ctx.fillStyle = '#000'
          ctx.fillRect(c * cs, r * cs, cs, cs)
          continue
        }
        const alpha = dist > FOGR - 0.5 ? 1 - (dist - (FOGR - 0.5)) : 1
        if (isWall) {
          ctx.fillStyle = `rgba(13,26,46,${alpha})`
          ctx.fillRect(c * cs, r * cs, cs, cs)
          ctx.strokeStyle = `rgba(0,212,255,${alpha * 0.35})`
          ctx.lineWidth = 0.5
          ctx.strokeRect(c * cs, r * cs, cs, cs)
        } else {
          ctx.fillStyle = `rgba(5,10,20,${alpha})`
          ctx.fillRect(c * cs, r * cs, cs, cs)
        }
      } else {
        // Mapa completo (J2)
        if (isWall) {
          ctx.fillStyle = 'rgba(13,26,46,0.95)'
          ctx.fillRect(c * cs, r * cs, cs, cs)
          ctx.strokeStyle = 'rgba(0,212,255,0.2)'
          ctx.lineWidth = 0.5
          ctx.strokeRect(c * cs, r * cs, cs, cs)
        } else if (isExit) {
          ctx.fillStyle = 'rgba(0,255,136,0.2)'
          ctx.fillRect(c * cs, r * cs, cs, cs)
        } else if (isTrap) {
          ctx.fillStyle = 'rgba(255,34,68,0.12)'
          ctx.fillRect(c * cs, r * cs, cs, cs)
        } else {
          ctx.fillStyle = 'rgba(5,10,20,0.7)'
          ctx.fillRect(c * cs, r * cs, cs, cs)
        }
      }
    }
  }

  // Marcadores de J2 (solo en mapa completo)
  if (!foggy) {
    const fs = Math.max(MINI - 2, 8)
    ctx.font = `${fs}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Salida
    ctx.fillStyle = 'rgba(0,255,136,0.9)'
    ctx.fillText('★', EXIT.x * cs + cs / 2, EXIT.y * cs + cs / 2)

    // Trampas
    TRAPS.forEach(t => {
      ctx.fillStyle = 'rgba(255,34,68,0.85)'
      ctx.fillText('✕', t.x * cs + cs / 2, t.y * cs + cs / 2)
    })
  }

  // Jugador (punto azul)
  const cx = px * cs + cs / 2
  const cy = py * cs + cs / 2
  const r  = foggy ? cs * 0.36 : cs * 0.3
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
  grd.addColorStop(0,   '#00d4ff')
  grd.addColorStop(0.6, '#0077aa')
  grd.addColorStop(1,   'transparent')
  ctx.fillStyle = grd
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  // Niebla exterior (vignette)
  if (foggy) {
    const fog = ctx.createRadialGradient(cx, cy, (FOGR - 0.5) * cs, cx, cy, (FOGR + 0.5) * cs)
    fog.addColorStop(0, 'rgba(0,0,0,0)')
    fog.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = fog
    ctx.fillRect(0, 0, W, H)
  }
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function Level05({ role, channel, onSolve, isAdmin }) {
  const [pos,     setPos]     = useState(START)
  const [partPos, setPartPos] = useState(START)
  const [solved,  setSolved]  = useState(false)
  const [trapped, setTrapped] = useState(false)  // red flash on trap
  const canvasRef  = useRef(null)  // Foggy view (J1)
  const minimapRef = useRef(null)  // Full map (J2)
  const solvedRef  = useRef(false) // Guard against double onSolve

  // Redibuja vista de J1 cuando se mueve
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    drawMaze(c.getContext('2d'), pos.x, pos.y, true)
  }, [pos])

  // Redibuja minimapa de J2 cuando cambia la posición del compañero
  useEffect(() => {
    const c = minimapRef.current
    if (!c) return
    const p = role === 'j2' || isAdmin ? partPos : pos
    drawMaze(c.getContext('2d'), p.x, p.y, false)
  }, [partPos, pos, role, isAdmin])

  // Teclado — solo J1
  const handleKey = useCallback((e) => {
    if ((role !== 'j1' && !isAdmin) || solvedRef.current) return
    const dirs = {
      ArrowUp:    { dx: 0,  dy: -1 }, ArrowDown:  { dx: 0,  dy: 1 },
      ArrowLeft:  { dx: -1, dy: 0  }, ArrowRight: { dx: 1,  dy: 0 },
      w: { dx: 0, dy: -1 }, s: { dx: 0, dy: 1 },
      a: { dx: -1, dy: 0 }, d: { dx: 1, dy: 0 },
    }
    const dir = dirs[e.key]
    if (!dir) return
    e.preventDefault()
    setPos(prev => {
      const nx = prev.x + dir.dx
      const ny = prev.y + dir.dy
      // Bounds check + wall check: MAZE is row-major [row][col] = [ny][nx]
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return prev
      if (MAZE[ny][nx] === 1) return prev  // wall
      const next = { x: nx, y: ny }

      // Trap check — send J1 back to START
      const hitTrap = TRAPS.some(t => t.x === nx && t.y === ny)
      if (hitTrap) {
        setTrapped(true)
        setTimeout(() => setTrapped(false), 1200)
        if (channel) broadcast(channel, 'l05_pos', START)
        return START
      }

      if (channel) broadcast(channel, 'l05_pos', next)
      if (nx === EXIT.x && ny === EXIT.y && !solvedRef.current) {
        solvedRef.current = true
        setSolved(true)
        setTimeout(onSolve, 1200)
      }
      return next
    })
  }, [role, isAdmin, channel, onSolve])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Recibir posición de J1 (en la pantalla de J2)
  useEffect(() => {
    if (!channel) return
    channel.on('broadcast', { event: 'l05_pos' }, ({ payload }) => {
      setPartPos(payload)
      if (payload.x === EXIT.x && payload.y === EXIT.y) setSolved(true)
    })
  }, [channel])

  // ── J1 VIEW ─────────────────────────────────────────────────────────────
  if (role === 'j1' && !isAdmin) {
    return (
      <>
        {/* Panel izquierdo: laberinto con niebla */}
        <div className="level-panel j1-panel active-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Jugador 1 · Control de Avatar</div>
            <div className="level-panel-title">Laberinto — Vista Restringida</div>
          </div>
          <div className="level-panel-body" style={{ alignItems: 'center' }}>
            <div className="status-msg warning" style={{ width: '100%' }}>
              ⚠️ Tu visión está limitada. Pide el mapa a tu compañero.
            </div>
            <div className="maze-canvas-wrap" style={{ position: 'relative' }}>
              <canvas
                ref={canvasRef}
                className="maze-canvas"
                width={COLS * CELL}
                height={ROWS * CELL}
                tabIndex={0}
              />
              {/* Red flash overlay when trapped */}
              {trapped && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(255,34,68,0.55)',
                  borderRadius: 8,
                  pointerEvents: 'none',
                  animation: 'trapFlash 1.2s ease-out forwards',
                }} />
              )}
            </div>
            <div className="maze-controls-hint">
              <div className="key-icon" style={{ gridColumn: 2, gridRow: 1 }}>↑</div>
              <div className="key-icon" style={{ gridColumn: 1, gridRow: 2 }}>←</div>
              <div className="key-icon" style={{ gridColumn: 2, gridRow: 2 }}>↓</div>
              <div className="key-icon" style={{ gridColumn: 3, gridRow: 2 }}>→</div>
            </div>
            <div className="label">Usa las flechas del teclado o WASD</div>
            {trapped && <div className="status-msg error">💥 ¡TRAMPA! Vuelves al inicio…</div>}
            {solved  && <div className="status-msg success">✅ ¡Has encontrado la salida!</div>}
          </div>
        </div>

        {/* Panel derecho: SIN MAPA — solo instrucciones */}
        <div className="level-panel j2-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Jugador 2 · Mapa (oculto)</div>
            <div className="level-panel-title">Tu compañero guía</div>
          </div>
          <div className="level-panel-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="panel-card" style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🗺️</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                Tu compañero tiene el mapa completo.<br />
                Escucha sus instrucciones:<br /><br />
                <strong style={{ color: 'var(--cyan)' }}>arriba · abajo · izquierda · derecha</strong>
              </p>
            </div>
            <div className="panel-card" style={{ width: '100%' }}>
              <div className="label" style={{ marginBottom: '0.5rem' }}>Leyenda de tu compañero</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>🔵 Punto azul — tu avatar</span>
                <span>★ Verde — la salida</span>
                <span>✕ Rojo — trampas (evítalas)</span>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── J2 VIEW (y admin) ────────────────────────────────────────────────────
  return (
    <>
      {/* Panel izquierdo: posición actual del compañero */}
      <div className={`level-panel j1-panel ${isAdmin ? 'active-panel' : ''}`}>
        <div className="level-panel-header">
          <div className="level-panel-role">{isAdmin ? 'Admin · Laberinto' : 'Jugador 1 · Avatar (vista)'}</div>
          <div className="level-panel-title">Posición de J1 en tiempo real</div>
        </div>
        <div className="level-panel-body" style={{ alignItems: 'center' }}>
          {isAdmin && (
            <>
              <div className="status-msg warning" style={{ width: '100%' }}>
                ⚠️ Admin: teclado activo. El mapa completo está en el panel derecho.
              </div>
              <div className="maze-canvas-wrap">
                <canvas
                  ref={canvasRef}
                  className="maze-canvas"
                  width={COLS * CELL}
                  height={ROWS * CELL}
                  tabIndex={0}
                />
              </div>
              <div className="label">Flechas o WASD para mover</div>
            </>
          )}
          {!isAdmin && (
            <>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Guía a J1 con instrucciones: arriba, abajo, izquierda, derecha.
              </p>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--cyan)',
                background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem', width: '100%', textAlign: 'center',
              }}>
                📍 Posición: ({partPos.x}, {partPos.y})
              </div>
              {solved && <div className="status-msg success">✅ ¡J1 llegó a la salida!</div>}
            </>
          )}
        </div>
      </div>

      {/* Panel derecho: mapa completo con posición del jugador */}
      <div className="level-panel j2-panel active-panel">
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 2 · Panel de Guía</div>
          <div className="level-panel-title">Mapa Completo del Laberinto</div>
        </div>
        <div className="level-panel-body scroll-y" style={{ alignItems: 'center' }}>
          <div className="label">Guía a J1 hasta la ★ — ¡evita las ✕!</div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: '100%' }}>
            <div className="panel-card" style={{ flex: 1, minWidth: 110 }}>
              <div style={{ color: 'var(--success)', fontWeight: 'bold', marginBottom: '0.2rem' }}>★ Salida</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Esquina inferior derecha</div>
            </div>
            <div className="panel-card" style={{ flex: 1, minWidth: 110 }}>
              <div style={{ color: 'var(--danger)', fontWeight: 'bold', marginBottom: '0.2rem' }}>✕ Trampas</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>3 zonas en rojo</div>
            </div>
          </div>
          <canvas
            ref={minimapRef}
            className="maze-minimap"
            style={{ width: '100%', maxWidth: 300, height: 'auto' }}
            width={COLS * MINI}
            height={ROWS * MINI}
          />
          {solved && <div className="status-msg success">✅ ¡J1 ha llegado a la salida!</div>}
        </div>
      </div>
    </>
  )
}
