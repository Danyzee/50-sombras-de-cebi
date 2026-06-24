import { useEffect } from 'react'
import { useGameStore } from './store/useGameStore'
import LobbyScreen from './screens/LobbyScreen'
import GameScreen from './screens/GameScreen'
import VictoryScreen from './screens/VictoryScreen'
import FloorTransition from './components/ui/FloorTransition'
import DebugOverlay from './components/ui/DebugOverlay'

export default function App() {
  const { screen } = useGameStore()

  return (
    <div className="app-root">
      {screen === 'lobby' && <LobbyScreen />}
      {(screen === 'game' || screen === 'transition') && <GameScreen />}
      {screen === 'transition' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <FloorTransition />
        </div>
      )}
      {screen === 'victory' && <VictoryScreen />}
      <DebugOverlay />
    </div>
  )
}
