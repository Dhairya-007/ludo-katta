import { useState } from 'react'
import { COLORS } from '../data/board.js'

const SEATS_FOR = { 2: [0, 2], 3: [0, 1, 2], 4: [0, 1, 2, 3] }

export default function Setup({ onStart }) {
  const [count, setCount] = useState(4)
  const [tokens, setTokens] = useState(4)
  const [names, setNames] = useState(COLORS.map((c) => c.name))
  const [humans, setHumans] = useState([true, false, false, false])
  const seats = SEATS_FOR[count]

  return (
    <div className="setup">
      <div className="setup-card">
        <div className="setup-dots">
          {COLORS.map((c) => <span key={c.key} style={{ background: c.hex }} />)}
        </div>
        <h1>Ludo <span>Katta</span></h1>
        <p className="setup-sub">
          Chha padse toh ghodo bahar. Stars are safe, everything else is fair game,
          and the computer will absolutely cut you on the last square.
        </p>

        <div className="setup-field">
          <label>Players</label>
          <div className="seg">
            {[2, 3, 4].map((n) => <button key={n} className={count === n ? 'on' : ''} onClick={() => setCount(n)}>{n}</button>)}
          </div>
        </div>

        <div className="setup-field">
          <label>Ghoda each</label>
          <div className="seg">
            {[2, 4].map((n) => <button key={n} className={tokens === n ? 'on' : ''} onClick={() => setTokens(n)}>{n}</button>)}
          </div>
        </div>

        <div className="setup-list">
          {seats.map((seat, i) => (
            <div key={seat} className="setup-row" style={{ '--c': COLORS[seat].hex }}>
              <span className="seat-swatch" style={{ background: COLORS[seat].hex }} />
              <input value={names[i]} maxLength={12}
                onChange={(e) => setNames(names.map((n, k) => (k === i ? e.target.value : n)))} />
              <button className={'who' + (humans[i] ? ' human' : '')}
                onClick={() => setHumans(humans.map((h, k) => (k === i ? !h : h)))}>
                {humans[i] ? 'Human' : 'Computer'}
              </button>
            </div>
          ))}
        </div>

        <ul className="setup-rules">
          <li>A six opens a ghodo and earns another roll. Three sixes and the turn is gone.</li>
          <li>Cutting an opponent or getting one home earns a bonus roll.</li>
          <li>Exact count to finish — overshoot and that ghodo waits.</li>
        </ul>

        <button className="btn primary big" onClick={() => onStart(
          seats.map((seat, i) => ({ seat, name: (names[i] || COLORS[seat].name).trim() || COLORS[seat].name, ai: !humans[i] })),
          tokens,
        )}>Chaal shuru</button>
      </div>
    </div>
  )
}
