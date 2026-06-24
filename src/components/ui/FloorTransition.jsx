import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore, LEVEL_META } from '../../store/useGameStore'

export default function FloorTransition() {
  const { floor, beginFloor } = useGameStore()
  const meta = LEVEL_META[floor - 1]

  useEffect(() => {
    const t = setTimeout(() => beginFloor(), 3000)
    return () => clearTimeout(t)
  }, [floor]) // eslint-disable-line

  return (
    <motion.div
      className="floor-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Radial glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        className="transition-label"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Piso
      </motion.div>

      <motion.div
        className="transition-floor-num"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
      >
        {String(floor).padStart(2, '0')}
      </motion.div>

      <motion.div
        className="transition-name"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {meta?.icon} {meta?.name}
      </motion.div>

      <motion.div
        className="transition-bar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="transition-bar-fill" />
      </motion.div>
    </motion.div>
  )
}
