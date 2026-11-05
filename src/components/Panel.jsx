import { COLORS, LAST } from '../data/board.js'
import { legalMoves } from '../game/engine.js'
import Dice3D from './Dice3D.jsx'

export default function Panel({ state, dispatch }) {
  const p = state.players[state.turn]
  const c = COLORS[p.seat]
  const human = !p.ai
  const busy = state.phase === 'walk'
  const moves = state.phase === 'pick' ? legalMoves(state, p.id, state.dice) : []

  return (
    <aside className="panel">
      <div className="turnbox" style={{ '--c': c.hex, '--cd': c.deep }}>
        <div className="turnbox-head">
          <span className="seat-dot" />
          <div>
            <strong>{p.name}</strong>
            <small>{human ? 'your chaal' : 'computer is playing'}</small>
          </div>
          <span className="home-chip">{p.home} home</span>
        </div>

        <div className="dice-row">
          <Dice3D value={state.dice} rolling={busy} color={c.hex} />
          <div className="dice-side">
            {state.phase === 'roll' && (
              <button className="btn primary" onClick={() => dispatch({ type: 'ROLL' })} disabled={!human}>
                {human ? 'Roll' : 'Rolling…'}
              </button>
            )}
            {state.phase === 'pick' && (
              <p className="hint">
                {human ? `Pick a ghodo — ${moves.length} can move` : 'Computer is choosing…'}
              </p>
            )}
            {state.phase === 'end' && (
              <button className="btn primary" onClick={() => dispatch({ type: 'END_TURN' })} disabled={!human}>
                {state.bonus ? 'Bonus roll' : 'Next player'}
              </button>
            )}
            {busy && <p className="hint">Moving…</p>}
          </div>
        </div>
      </div>

      <div className="players">
        {state.players.map((q) => {
          const qc = COLORS[q.seat]
          return (
            <div key={q.id} className={'prow' + (q.id === state.turn ? ' prow-turn' : '')} style={{ '--c': qc.hex }}>
              <span className="pdot" />
              <div className="pbody">
                <div className="pline"><strong>{q.name}</strong><span>{q.ai ? 'computer' : 'human'}</span></div>
                <div className="ghodas">
                  {q.tokens.map((pos, i) => (
                    <i key={i} className={pos === LAST ? 'g home' : pos === -1 ? 'g yard' : 'g out'}
                      title={pos === LAST ? 'home' : pos === -1 ? 'in the yard' : `${pos} steps`} />
                  ))}
                </div>
                <div className="pstats"><span>🏠 {q.home}</span><span>⚔️ {q.cuts}</span><span>💀 {q.lost}</span></div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="log">
        <h3>Khabar</h3>
        <ul>{state.log.map((l) => <li key={l.id} className={'tone-' + l.tone}>{l.text}</li>)}</ul>
      </div>
    </aside>
  )
}
