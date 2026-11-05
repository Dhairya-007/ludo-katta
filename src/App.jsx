import { useEffect, useReducer } from 'react'
import Board from './components/Board.jsx'
import Panel from './components/Panel.jsx'
import Setup from './components/Setup.jsx'
import Trophy3D from './components/Trophy3D.jsx'
import { createGame, reducer, aiAction } from './game/engine.js'
import { COLORS } from './data/board.js'

function Bokeh() {
  const colors = [COLORS[0].hex, COLORS[1].hex, COLORS[2].hex, COLORS[3].hex]
  const dots = Array.from({ length: 14 }).map((_, i) => ({
    c: colors[i % 4],
    left: (i * 37) % 100,
    top: (i * 53) % 100,
    size: 10 + (i % 5) * 6,
    delay: (i % 7) * 0.6,
    dur: 6 + (i % 5) * 1.4,
  }))
  return (
    <div className="bokeh" aria-hidden="true">
      {dots.map((d, i) => (
        <i key={i} style={{
          '--c': d.c, left: `${d.left}%`, top: `${d.top}%`,
          width: d.size, height: d.size,
          animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`,
        }} />
      ))}
    </div>
  )
}

export default function App() {
  const [game, dispatch] = useReducer(reducer, null)

  useEffect(() => {
    if (!game || game.winner !== null) return
    if (game.phase === 'walk') {
      const t = setTimeout(() => dispatch({ type: 'STEP' }), 155)
      return () => clearTimeout(t)
    }
    const ai = aiAction(game)
    if (ai) {
      const t = setTimeout(() => dispatch(ai), ai.type === 'PICK' ? 520 : 640)
      return () => clearTimeout(t)
    }
  }, [game])

  useEffect(() => {
    if (!game || !game.toast) return
    const t = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2300)
    return () => clearTimeout(t)
  }, [game && game.toast])

  if (!game) return <Setup onStart={(seats, tokens) => dispatch({ type: 'INIT', state: createGame(seats, tokens) })} />

  const winner = game.winner !== null ? game.players[game.winner] : null

  return (
    <div className="app">
      <Bokeh />
      <header className="topbar">
        <div className="brand">
          <span className="brand-dots">
            {COLORS.map((c) => <i key={c.key} style={{ background: c.hex }} />)}
          </span>
          <h2>Ludo Katta</h2>
          <small>chha padse toh ghodo bahar</small>
        </div>
        <button className="btn ghost small" onClick={() => dispatch({ type: 'INIT', state: null })}>New game</button>
      </header>

      <main className="layout">
        <Board state={game} dispatch={dispatch} />
        <Panel state={game} dispatch={dispatch} />
      </main>

      {game.toast && (
        <div className={'toast ' + game.toast.kind}>
          <span>{game.toast.kind === 'cut' ? '⚔️' : '🏠'}</span>
          <p>{game.toast.text}</p>
        </div>
      )}

      {winner && (
        <div className="modal-wrap">
          <div className="winner" style={{ '--c': COLORS[winner.seat].hex }}>
            <Trophy3D winnerSeat={winner.seat} />
            <h2>{winner.name} jeet gaya!</h2>
            <p>{winner.rolls} rolls, {winner.cuts} cuts made, {winner.lost} ghoda lost on the way.</p>
            <button className="btn primary" onClick={() => dispatch({ type: 'INIT', state: null })}>Ek vaar fari</button>
          </div>
        </div>
      )}
    </div>
  )
}
