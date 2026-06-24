/**
 * AdminBar — Floating bottom bar for admin/test mode.
 * Shows the current level's J2 clue summary + a "Skip Level" button.
 * Only rendered when isAdmin = true.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/useGameStore'

const ADMIN_HINTS = [
  { floor: 1,  hint: 'Respuesta: G · R · A · C · I · A · S (código cifrado: 7·18·1·3·9·1·19)' },
  { floor: 2,  hint: 'Fecha: Día 31 · Mes 1 (Enero) · Año 2024  — Fecha de incorporación de Li' },
  { floor: 3,  hint: 'Cables: AZUL→P1 · MORADO→P2 · ROJO→P3 · AMARILLO→P4 · VERDE→P5' },
  { floor: 4,  hint: 'Resultado: 52  (★=12 · △=4 · ◆=7 · ○=3 → 12×4+7−3=52)' },
  { floor: 5,  hint: 'J1 mueve con flechas/WASD. J2 tiene el mapa completo — dicta: arriba/abajo/izq/dcha. J1 NO ve el mapa.' },
  { floor: 6,  hint: 'Tres en raya. Juega cualquier turno. Tras ganar → clic "Necesitamos a Li" → escribe la frase → unicornio.' },
  { floor: 7,  hint: 'J1 hace clic en el número 4 entre los 100 números en movimiento. J2 dicta el número.' },
  { floor: 8,  hint: 'Observa la secuencia de luces en J1, luego pulsa los colores en el panel de J2 ↓' },
  { floor: 9,  hint: '⚠️ Requiere dos personas simultáneas. Usa "Saltar" para testear el flujo.' },
  { floor: 10, hint: '⚠️ J1: NURIA · J2: JOSE · Insertar al mismo tiempo. Usa "Saltar" para testear.' },
]

export default function AdminBar({ onSkip }) {
  const { floor } = useGameStore()
  const [expanded, setExpanded] = useState(true)
  const hint = ADMIN_HINTS.find(h => h.floor === floor)

  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 150,
        background: 'rgba(20, 8, 40, 0.97)',
        borderTop: '2px solid #a855f7',
        boxShadow: '0 -8px 32px rgba(168,85,247,0.25)',
        backdropFilter: 'blur(10px)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1.25rem',
        borderBottom: expanded ? '1px solid rgba(168,85,247,0.2)' : 'none',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem' }}>🔑</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            color: '#a855f7',
            fontWeight: 700,
          }}>
            MODO ADMIN — LIELEMEJOR
          </span>
          <span style={{
            background: 'rgba(168,85,247,0.15)',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: 4,
            padding: '1px 6px',
            fontSize: '0.6rem',
            color: 'var(--text-muted)',
          }}>
            Piso {floor}/10
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Skip button */}
          <button
            onClick={onSkip}
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: 6,
              padding: '0.35rem 0.85rem',
              fontFamily: 'var(--font-display)',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            title="Saltar este nivel directamente al siguiente"
          >
            Saltar nivel →
          </button>

          {/* Toggle expand */}
          <button
            onClick={() => setExpanded(p => !p)}
            style={{
              background: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.25)',
              borderRadius: 6,
              padding: '0.3rem 0.6rem',
              color: '#a855f7',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
            title={expanded ? 'Colapsar' : 'Expandir pistas'}
          >
            {expanded ? '▼' : '▲ Pistas'}
          </button>
        </div>
      </div>

      {/* Hint row */}
      <AnimatePresence>
        {expanded && hint && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ color: 'var(--gold)', fontSize: '0.75rem', flexShrink: 0, marginTop: 1 }}>💡 Pista J2:</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.78rem', lineHeight: 1.5 }}>{hint.hint}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
