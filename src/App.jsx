import { useEffect } from 'react'
import { useGameStore } from './store/useGameStore'
import LobbyScreen from './screens/LobbyScreen'
import GameScreen from './screens/GameScreen'
import VictoryScreen from './screens/VictoryScreen'
import FloorTransition from './components/ui/FloorTransition'

export default function App() {
  const { screen } = useGameStore()

  return (
    <div className="app-root">
      {screen === 'lobby' && <LobbyScreen />}
      {screen === 'transition' && <FloorTransition />}
      {screen === 'game' && <GameScreen />}
      {screen === 'victory' && <VictoryScreen />}
    </div>
  )
}
