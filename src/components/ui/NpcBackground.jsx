import { useEffect, useState } from 'react'

const EMOJIS = ['🚶', '🧑‍💻', '👷', '🧑‍🔬', '🤖', '👩‍💼', '🧙', '👾', '🦾', '🧑‍🚀']

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

export default function NpcBackground() {
  const [npcs, setNpcs] = useState([])
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const list = Array.from({ length: 6 }, (_, i) => ({
      id:       i,
      emoji:    EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      bottom:   randomBetween(2, 18),
      duration: randomBetween(18, 40),
      delay:    randomBetween(0, 20),
      scale:    randomBetween(0.6, 1.2),
    }))
    setNpcs(list)

    const ptcls = Array.from({ length: 24 }, (_, i) => ({
      id:       i,
      left:     randomBetween(0, 100),
      top:      randomBetween(10, 90),
      duration: randomBetween(6, 18),
      delay:    randomBetween(0, 12),
      color:    ['var(--cyan)', 'var(--orange)', 'var(--gold)', 'var(--purple)'][i % 4],
      size:     randomBetween(1, 3),
    }))
    setParticles(ptcls)
  }, [])

  return (
    <div className="npc-layer">
      {npcs.map(npc => (
        <div
          key={npc.id}
          className="npc-sprite"
          style={{
            bottom:           `${npc.bottom}%`,
            animationDuration:`${npc.duration}s`,
            animationDelay:   `${npc.delay}s`,
            transform:        `scale(${npc.scale})`,
          }}
        >
          {npc.emoji}
        </div>
      ))}
      {particles.map(p => (
        <div
          key={p.id}
          className="floating-particle"
          style={{
            left:             `${p.left}%`,
            top:              `${p.top}%`,
            width:            `${p.size}px`,
            height:           `${p.size}px`,
            background:       p.color,
            animationDuration:`${p.duration}s`,
            animationDelay:   `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
