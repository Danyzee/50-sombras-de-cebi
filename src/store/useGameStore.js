import { create } from 'zustand'

// Level metadata — used in TowerHeader, FloorTransition, etc.
export const LEVEL_META = [
  { id: 1,  name: 'La Contraseña Oculta',  icon: '🔤' },
  { id: 2,  name: 'El Día D',               icon: '📅' },
  { id: 3,  name: 'Cables Cruzados',        icon: '🔌' },
  { id: 4,  name: 'El Código Matemático',   icon: '🔢' },
  { id: 5,  name: 'Laberinto a Ciegas',     icon: '🌫️' },
  { id: 6,  name: 'Tres en Raya',           icon: '⭕' },
  { id: 7,  name: 'El Mensaje Escondido',    icon: '🔍' },
  { id: 8,  name: 'Memoria Visual',         icon: '💡' },
  { id: 9,  name: 'Sincronización',         icon: '⏱️' },
  { id: 10, name: 'El Cofre Final',         icon: '🗝️' },
]

export const useGameStore = create((set, get) => ({
  // --- Connection & identity ---
  roomCode: '',
  role: null,           // 'j1' | 'j2'
  screen: 'lobby',      // 'lobby' | 'transition' | 'game' | 'victory'
  partnerConnected: false,
  syncMode: 'local',    // 'local' | 'supabase'
  isAdmin: false,       // Admin/test mode — sees both panels + skip buttons

  // --- Game progress ---
  floor: 1,
  transitioning: false,

  // --- Per-level shared state (broadcast between players) ---
  // Each level component manages its own local state and broadcasts
  // via the sync channel. This store holds only global game state.

  // --- Actions ---
  setRoomCode: (code) => set({ roomCode: code.toUpperCase().slice(0, 6) }),
  setRole: (role) => set({ role }),
  setAdmin: (v) => set({ isAdmin: v }),
  setSyncMode: (mode) => set({ syncMode: mode }),
  setPartnerConnected: (v) => set({ partnerConnected: v }),

  startGame: () => set({ screen: 'transition', floor: 1 }),

  beginFloor: () => set({ screen: 'game' }),

  advanceFloor: () => {
    const { floor } = get()
    if (floor >= 10) {
      set({ screen: 'victory' })
    } else {
      set({ floor: floor + 1, screen: 'transition' })
    }
  },

  goToVictory: () => set({ screen: 'victory' }),

  reset: () => set({
    roomCode: '',
    role: null,
    screen: 'lobby',
    floor: 1,
    partnerConnected: false,
    isAdmin: false,
  }),
}))
