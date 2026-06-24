/**
 * LEVEL 03 — Cables Cruzados
 *
 * J1: 5 colored cables, 5 numbered ports. Click cable → click port to connect.
 * J2: Technical manual with correct cable→port mapping.
 *
 * Answer:
 *   AZUL   → Puerto 1
 *   MORADO → Puerto 2
 *   ROJO   → Puerto 3
 *   AMARILLO → Puerto 4
 *   VERDE  → Puerto 5
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { broadcast } from '../lib/sync'

const CABLES = [
  { id: 'rojo',     label: 'ROJO',     color: '#ff2244', target: 3 },
  { id: 'azul',     label: 'AZUL',     color: '#00aaff', target: 1 },
  { id: 'verde',    label: 'VERDE',    color: '#00cc66', target: 5 },
  { id: 'amarillo', label: 'AMARILLO', color: '#ffd700', target: 4 },
  { id: 'morado',   label: 'MORADO',   color: '#a855f7', target: 2 },
]

const PORTS = [1, 2, 3, 4, 5]

const MANUAL_ROWS = [
  { cable: 'AZUL',     port: 1, note: 'Canal de datos principal — baja latencia' },
  { cable: 'MORADO',   port: 2, note: 'Señal de control secundaria' },
  { cable: 'ROJO',     port: 3, note: 'Alimentación de emergencia' },
  { cable: 'AMARILLO', port: 4, note: 'Bus de diagnóstico' },
  { cable: 'VERDE',    port: 5, note: 'Tierra / masa del sistema' },
]

export default function Level03({ role, channel, onSolve }) {
  const [selected,   setSelected]   = useState(null)  // cable id
  const [connections, setConnections] = useState({})   // {portNum: cableId}
  const [status,     setStatus]     = useState('')
  const [partnerConn, setPartnerConn] = useState({})

  useEffect(() => {
    if (!channel) return
    channel.on('broadcast', { event: 'l03_conn' }, ({ payload }) => setPartnerConn(payload.conn))
  }, [channel])

  function getCableForPort(port) {
    return CABLES.find(c => connections[port] === c.id)
  }

  function handleCableClick(id) {
    if (role !== 'j1') return
    setSelected(prev => prev === id ? null : id)
  }

  function handlePortClick(port) {
    if (role !== 'j1' || !selected) return
    const newConn = { ...connections }
    // Remove cable from its old port if already connected
    Object.keys(newConn).forEach(p => { if (newConn[p] === selected) delete newConn[p] })
    // If port occupied, free it
    if (newConn[port]) delete newConn[port]
    newConn[port] = selected
    setSelected(null)
    setConnections(newConn)
    broadcast(channel, 'l03_conn', { conn: newConn })
  }

  function handleDisconnect(port) {
    if (role !== 'j1') return
    const newConn = { ...connections }
    delete newConn[port]
    setConnections(newConn)
    broadcast(channel, 'l03_conn', { conn: newConn })
  }

  function handleSubmit() {
    const correct = CABLES.every(c => {
      const portEntry = Object.entries(connections).find(([, cid]) => cid === c.id)
      return portEntry && parseInt(portEntry[0]) === c.target
    })
    if (correct) {
      setStatus('solved')
      setTimeout(onSolve, 1200)
    } else {
      setStatus('wrong')
      setTimeout(() => setStatus(''), 1800)
    }
  }

  const allConnected = Object.keys(connections).length === 5
  const conn = role === 'j1' ? connections : partnerConn

  function PanelJ1() {
    return (
      <div className="level-panel j1-panel active-panel">
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 1 · Panel de Control</div>
          <div className="level-panel-title">Panel de Cables</div>
        </div>
        <div className="level-panel-body">
          <div className="label">Haz clic en un cable para seleccionarlo, luego en un puerto</div>

          {/* Cables */}
          <div className="panel-card">
            <div className="label" style={{ marginBottom: '0.75rem' }}>Cables disponibles</div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {CABLES.map(c => {
                const connected = Object.values(connections).includes(c.id)
                return (
                  <motion.div
                    key={c.id}
                    className="cable-head"
                    onClick={() => !connected && handleCableClick(c.id)}
                    style={{ opacity: connected ? 0.4 : 1 }}
                    whileHover={{ scale: connected ? 1 : 1.1 }}
                    whileTap={{ scale: connected ? 1 : 0.95 }}
                  >
                    <div
                      className={`cable-dot ${selected === c.id ? 'selected' : ''}`}
                      style={{ background: c.color, color: c.color }}
                    />
                    <div className="cable-label">{c.label}</div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Ports */}
          <div className="panel-card">
            <div className="label" style={{ marginBottom: '0.75rem' }}>Puertos de conexión</div>
            <div className="ports-row">
              {PORTS.map(p => {
                const cable = getCableForPort(p)
                return (
                  <div key={p} className="port-slot">
                    <motion.div
                      className={`port-socket ${cable ? 'connected' : ''}`}
                      style={cable ? { borderColor: cable.color, background: cable.color + '22' } : {}}
                      onClick={() => cable ? handleDisconnect(p) : handlePortClick(p)}
                      whileHover={{ scale: 1.1 }}
                      title={cable ? `Clic para desconectar ${cable.label}` : `Puerto ${p} libre`}
                    >
                      {cable
                        ? <span style={{ color: cable.color, fontWeight: 'bold', fontSize: '0.7rem' }}>{cable.label[0]}</span>
                        : <span style={{ color: 'var(--border)' }}>○</span>
                      }
                    </motion.div>
                    <div className="port-num">P{p}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <AnimatePresence>
            {status === 'wrong' && (
              <motion.div className="status-msg error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                ❌ Conexión incorrecta. Pide el manual técnico a tu compañero.
              </motion.div>
            )}
            {status === 'solved' && (
              <motion.div className="status-msg success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                ✅ ¡Cables conectados correctamente! Sistema activado.
              </motion.div>
            )}
          </AnimatePresence>

          {selected && (
            <div className="status-msg info">
              Cable seleccionado: <strong style={{ color: CABLES.find(c=>c.id===selected)?.color }}>{selected.toUpperCase()}</strong>
              — haz clic en un puerto para conectar
            </div>
          )}

          <button className="btn btn-primary" onClick={handleSubmit} disabled={!allConnected || status === 'solved'}>
            ⚡ Activar Sistema
          </button>
        </div>
      </div>
    )
  }

  function PanelJ2() {
    return (
      <div className="level-panel j2-panel active-panel">
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 2 · Panel de Pistas</div>
          <div className="level-panel-title">Manual Técnico v2.3</div>
        </div>
        <div className="level-panel-body scroll-y">
          <div className="label">Especificaciones de conexión — dicta a J1 qué cable va en qué puerto</div>

          <div className="panel-card">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.2em' }}>
              MANUAL TÉCNICO — SISTEMA DE CABLEADO V2.3 — CONFIDENCIAL
            </div>
            <table className="manual-table">
              <thead>
                <tr>
                  <th>CABLE</th>
                  <th>PUERTO</th>
                  <th>FUNCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {MANUAL_ROWS.map(row => (
                  <tr key={row.cable}>
                    <td>
                      <span style={{ color: CABLES.find(c=>c.label===row.cable)?.color, fontWeight: 'bold' }}>
                        ● {row.cable}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gold)', fontWeight: 'bold' }}>P{row.port}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="label">Estado actual de J1</div>
          <div className="ports-row" style={{ padding: '0.5rem 0' }}>
            {PORTS.map(p => {
              const cableId = conn[p]
              const cable   = CABLES.find(c => c.id === cableId)
              const correct = cable && cable.target === p
              return (
                <div key={p} className="port-slot">
                  <div
                    className={`port-socket ${cable ? 'connected' : ''}`}
                    style={cable ? {
                      borderColor: correct ? 'var(--success)' : 'var(--danger)',
                      background:  (correct ? 'var(--success)' : 'var(--danger)') + '22',
                    } : {}}
                  >
                    {cable
                      ? <span style={{ color: correct ? 'var(--success)' : 'var(--danger)', fontSize: '0.65rem', fontWeight: 'bold' }}>
                          {cable.label[0]}
                        </span>
                      : <span style={{ color: 'var(--border)' }}>○</span>
                    }
                  </div>
                  <div className="port-num">P{p}</div>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            🟢 Verde = correcto · 🔴 Rojo = incorrecto
          </p>
        </div>
      </div>
    )
  }

  if (role === 'j1') {
    return (
      <>
        <PanelJ1 />
        <div className="level-panel j2-panel">
          <div className="level-panel-header">
            <div className="level-panel-role">Jugador 2 · Manual Técnico (vista)</div>
            <div className="level-panel-title">Instrucciones de conexión</div>
          </div>
          <div className="level-panel-body">
            <div className="panel-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>📋</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Tu compañero tiene el manual técnico. Escucha qué cable va en qué puerto y conéctalo.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="level-panel j1-panel">
        <div className="level-panel-header">
          <div className="level-panel-role">Jugador 1 · Cables (vista)</div>
          <div className="level-panel-title">Estado de conexiones</div>
        </div>
        <div className="level-panel-body">
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Dicta a J1 exactamente qué cable debe conectar a cada puerto.
          </p>
          <div className="ports-row">
            {PORTS.map(p => {
              const cableId = conn[p]
              const cable   = CABLES.find(c => c.id === cableId)
              return (
                <div key={p} className="port-slot">
                  <div className={`port-socket ${cable ? 'connected' : ''}`}
                    style={cable ? { borderColor: cable.color, background: cable.color + '22' } : {}}>
                    {cable ? <span style={{ color: cable.color, fontWeight: 'bold', fontSize: '0.7rem' }}>{cable.label[0]}</span>
                           : <span style={{ color: 'var(--border)' }}>○</span>}
                  </div>
                  <div className="port-num">P{p}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <PanelJ2 />
    </>
  )
}
