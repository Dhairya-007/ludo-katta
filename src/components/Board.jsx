import { RING, SEATS, SAFE, COLORS, cellFor, LAST, GRID } from '../data/board.js'
import { legalMoves } from '../game/engine.js'

const pct = (v) => (v / GRID) * 100

function Star({ x, y, fill }) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.34 : 0.15
    const a = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${x + 0.5 + r * Math.cos(a)},${y + 0.5 + r * Math.sin(a)}`)
  }
  return <polygon points={pts.join(' ')} fill={fill} opacity="0.55" />
}

function Arrow({ cell, color, dir }) {
  const [x, y] = cell
  const cx = x + 0.5
  const cy = y + 0.5
  const rot = { right: 0, down: 90, left: 180, up: 270 }[dir]
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      <path d="M-0.2 -0.18 L0.18 0 L-0.2 0.18 Z" fill={color} opacity="0.9" />
    </g>
  )
}

export default function Board({ state, dispatch }) {
  const current = state.players[state.turn]
  const moves = state.phase === 'pick' ? legalMoves(state, current.id, state.dice) : []
  const movable = new Set(moves.map((m) => m.token))

  // where every token sits, in grid units
  const placed = []
  state.players.forEach((p) => {
    p.tokens.forEach((pos, t) => {
      let point
      if (pos === -1) {
        const sp = SEATS[p.seat].spots[t]
        point = { x: sp[0], y: sp[1] }
      } else {
        const [cx, cy] = cellFor(p.seat, pos)
        point = { x: cx + 0.5, y: cy + 0.5 }
      }
      placed.push({ p, t, pos, point })
    })
  })
  const bucket = {}
  placed.forEach((o) => {
    const key = `${o.point.x.toFixed(2)}:${o.point.y.toFixed(2)}`
    bucket[key] = bucket[key] || []
    bucket[key].push(o)
  })

  return (
    <div className="board-wrap">
      <div className="board">
        <svg viewBox="0 0 15 15" className="board-svg">
          <defs>
            <filter id="drop" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0.06" stdDeviation="0.07" floodColor="#1b0d05" floodOpacity="0.35" />
            </filter>
          </defs>

          <rect x="0" y="0" width="15" height="15" rx="0.5" className="board-bg" />

          {SEATS.map((seat, i) => {
            const c = COLORS[i]
            const [yx, yy] = seat.yard
            return (
              <g key={'yard' + i}>
                <rect x={yx} y={yy} width="6" height="6" rx="0.6" fill={c.hex} />
                <rect x={yx + 0.75} y={yy + 0.75} width="4.5" height="4.5" rx="0.45"
                  fill="#fffaf0" stroke={c.deep} strokeWidth="0.06" />
                {seat.spots.map((sp, k) => (
                  <circle key={k} cx={sp[0]} cy={sp[1]} r="0.52"
                    fill={c.soft} stroke={c.deep} strokeWidth="0.07" />
                ))}
              </g>
            )
          })}

          {RING.map((cell, i) => {
            const seat = SEATS.findIndex((s) => s.start === i)
            const c = seat >= 0 ? COLORS[seat] : null
            return (
              <rect key={'r' + i} x={cell[0]} y={cell[1]} width="1" height="1"
                className="cell" fill={c ? c.soft : '#fffaf0'} />
            )
          })}

          {SEATS.map((seat, i) =>
            seat.lane.map((cell, k) => (
              <rect key={`l${i}-${k}`} x={cell[0]} y={cell[1]} width="1" height="1"
                className="cell" fill={COLORS[i].hex} opacity={0.82} />
            ))
          )}

          {[...SAFE].map((i) => {
            const seat = SEATS.findIndex((s) => s.start === i)
            return <Star key={'st' + i} x={RING[i][0]} y={RING[i][1]}
              fill={seat >= 0 ? COLORS[seat].deep : '#8a8f98'} />
          })}

          {SEATS.map((seat, i) => (
            <Arrow key={'a' + i} cell={RING[seat.start]} color={COLORS[i].deep}
              dir={['right', 'down', 'left', 'up'][i]} />
          ))}

          {SEATS.map((seat, i) => (
            <polygon key={'c' + i} points={seat.centre.map((p) => p.join(',')).join(' ')}
              fill={COLORS[i].hex} stroke="#fffaf0" strokeWidth="0.06" />
          ))}
          <circle cx="7.5" cy="7.5" r="0.46" fill="#fffaf0" stroke="#d6cab5" strokeWidth="0.06" />
          <text x="7.5" y="7.5" className="centre-text">🏠</text>
        </svg>

        <div className="token-layer">
          {placed.map(({ p, t, pos, point }) => {
            const c = COLORS[p.seat]
            const key = `${point.x.toFixed(2)}:${point.y.toFixed(2)}`
            const peers = bucket[key]
            const slot = peers.findIndex((o) => o.p.id === p.id && o.t === t)
            const spread = peers.length > 1 && pos !== -1
            const dx = spread ? (slot - (peers.length - 1) / 2) * 8 : 0
            const dy = spread ? (slot % 2) * -4 : 0
            const canMove = p.id === current.id && state.phase === 'pick' && movable.has(t)
            return (
              <button
                type="button"
                key={`${p.id}-${t}`}
                className={'token' + (canMove ? ' token-live' : '') + (pos === LAST ? ' token-home' : '')}
                style={{
                  left: `${pct(point.x)}%`,
                  top: `${pct(point.y)}%`,
                  transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
                  background: `radial-gradient(circle at 34% 26%, #fff9, transparent 60%), linear-gradient(165deg, ${c.hex}, ${c.deep})`,
                  zIndex: canMove ? 12 : 8 + slot,
                }}
                disabled={!canMove || p.ai}
                onClick={() => dispatch({ type: 'PICK', token: t })}
                title={`${p.name} · ghodo ${t + 1}`}
              >
                <span>{t + 1}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
