import { useGameStore, LEVEL_META } from '../../store/useGameStore'

export default function TowerHeader() {
  const { floor, role, partnerConnected } = useGameStore()
  const meta = LEVEL_META[floor - 1]
  const progress = ((floor - 1) / 10) * 100

  return (
    <div className="tower-header">
      {/* Floor info */}
      <div className="header-floor">
        <div className="header-floor-num">{String(floor).padStart(2, '0')}</div>
        <div className="header-floor-label">
          <div className="header-floor-name">{meta?.icon} {meta?.name}</div>
          <div className="header-floor-sub">Piso {floor} de 10</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="header-progress">
        <div className="header-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Right: role + partner status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="header-partner-status">
          <div
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: partnerConnected ? 'var(--success)' : 'var(--text-dim)',
              boxShadow: partnerConnected ? '0 0 6px var(--success)' : 'none',
            }}
          />
          {partnerConnected ? 'Compañero online' : 'Sin compañero'}
        </div>
        <div className={`header-role ${role}`}>
          {role === 'j1' ? '🔵 J1' : '🟠 J2'}
        </div>
      </div>
    </div>
  )
}
