import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'

export default function DebugOverlay() {
  const { roomCode, role, screen, floor, partnerConnected, channel } = useGameStore()
  const [logs, setLogs] = useState([])

  useEffect(() => {
    if (!channel) return

    const handleAnyBroadcast = (message) => {
      setLogs(prev => {
        const newLogs = [...prev, `[RX] ${message.event}: ${JSON.stringify(message.payload)}`]
        return newLogs.slice(-5)
      })
    }

    // intercept raw channel directly for debugging
    const raw = channel._channel
    if (raw) {
      raw.on('broadcast', { event: '*' }, handleAnyBroadcast)
    }
  }, [channel])

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, 
      background: 'rgba(0,0,0,0.8)', color: '#0f0', 
      fontFamily: 'monospace', fontSize: '10px', 
      padding: '4px', zIndex: 9999, pointerEvents: 'none',
      textAlign: 'left'
    }}>
      <div>STATE: {roomCode} | role: {role} | screen: {screen} | floor: {floor} | partner: {partnerConnected ? 'YES' : 'NO'} | ch: {channel ? 'OK' : 'NULL'}</div>
      <div>
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
