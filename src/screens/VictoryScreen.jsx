import { motion } from 'framer-motion'
import { useGameStore } from '../store/useGameStore'

export default function VictoryScreen() {
  const { reset } = useGameStore()
  return (
    <motion.div
      className="victory-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      <div className="victory-emoji float-anim">🏆</div>
      <div className="victory-title">¡LA TORRE CONQUISTADA!</div>
      <p className="victory-msg">
        Habéis superado los 10 pisos de La Torre Mística.<br />
        Trabajo en equipo, comunicación y mucho talento.<br /><br />
        <strong style={{ color: 'var(--gold)' }}>Gracias por todo, compañeros.</strong>
      </p>
      <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={reset}>
        Volver al inicio
      </button>
    </motion.div>
  )
}
