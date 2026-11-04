import { RING_LEN, LAST, SAFE, SEATS, ringIndex, COLORS } from '../data/board.js'

const d6 = () => 1 + Math.floor(Math.random() * 6)

export function createGame(setup, tokensEach = 4) {
  return {
    players: setup.map((p, i) => ({
      id: i, seat: p.seat, name: p.name, ai: p.ai,
      tokens: Array.from({ length: tokensEach }, () => -1), // -1 = still in the yard
      home: 0, cuts: 0, lost: 0, sixes: 0, rolls: 0,
    })),
    tokensEach,
    turn: 0,
    dice: null,
    phase: 'roll',       // roll | pick | walk | end | over
    moving: null,        // { player, token, remaining, target }
    bonus: false,        // another turn earned
    winner: null,
    toast: null,
    log: [{ id: 0, text: 'Board open. Chha padse toh ghodo bahar!', tone: 'plain' }],
    logId: 1,
  }
}

const say = (s, text, tone = 'plain') => {
  s.log = [{ id: s.logId++, text, tone }, ...s.log].slice(0, 50)
}

export function legalMoves(state, playerId, dice) {
  const p = state.players[playerId]
  const moves = []
  p.tokens.forEach((pos, t) => {
    if (pos === LAST) return
    if (pos === -1) {
      if (dice === 6) moves.push({ token: t, from: -1, to: 0 })
      return
    }
    const to = pos + dice
    if (to <= LAST) moves.push({ token: t, from: pos, to })
  })
  return moves
}

// who is standing on the ring square this move ends on
function occupantsAt(state, seat, progress) {
  const idx = ringIndex(seat, progress)
  if (idx < 0) return []
  const list = []
  state.players.forEach((p) => {
    p.tokens.forEach((pos, t) => {
      if (pos < 0 || pos >= RING_LEN) return
      if (ringIndex(p.seat, pos) === idx) list.push({ player: p.id, token: t })
    })
  })
  return list
}

function finishMove(s) {
  const mv = s.moving
  const p = s.players[mv.player]
  const landed = p.tokens[mv.token]
  s.moving = null
  s.bonus = s.dice === 6

  if (landed === LAST) {
    p.home += 1
    s.bonus = true
    say(s, `${p.name} got a ghodo home — ${p.home}/${s.tokensEach}`, 'good')
    s.toast = { kind: 'home', text: `${p.name} sent one home!` }
    if (p.home === s.tokensEach) {
      s.winner = p.id
      s.phase = 'over'
      say(s, `${p.name} brought every ghodo home. Jeet!`, 'good')
      return
    }
  } else {
    const idx = ringIndex(p.seat, landed)
    if (idx >= 0 && !SAFE.has(idx)) {
      const victims = occupantsAt(s, p.seat, landed).filter((o) => o.player !== p.id)
      victims.forEach((v) => {
        s.players[v.player].tokens[v.token] = -1
        s.players[v.player].lost += 1
        p.cuts += 1
        say(s, `${p.name} cut ${s.players[v.player].name}'s ghodo at square ${idx + 1}`, 'bad')
        s.toast = { kind: 'cut', text: `${p.name} cut ${s.players[v.player].name}!` }
        s.bonus = true
      })
    }
  }
  s.phase = 'end'
}

export function reducer(state, action) {
  if (action.type === 'INIT') return action.state
  if (!state) return state
  const s = structuredClone(state)
  const p = s.players[s.turn]

  switch (action.type) {
    case 'ROLL': {
      if (s.phase !== 'roll') return state
      const d = d6()
      s.dice = d
      s.toast = null
      p.rolls += 1
      if (d === 6) {
        p.sixes += 1
        if (p.sixes === 3) {
          say(s, `${p.name} rolled three sixes — turn goes away`, 'bad')
          p.sixes = 0
          s.bonus = false
          s.phase = 'end'
          return s
        }
      } else {
        p.sixes = 0
      }
      const moves = legalMoves(s, p.id, d)
      if (moves.length === 0) {
        say(s, `${p.name} rolled ${d} with nothing to move`, 'plain')
        s.bonus = d === 6
        s.phase = 'end'
        return s
      }
      if (moves.length === 1) {
        s.moving = { player: p.id, token: moves[0].token, remaining: moves[0].to - Math.max(moves[0].from, 0) }
        if (moves[0].from === -1) {
          p.tokens[moves[0].token] = 0
          s.moving.remaining = 0
          say(s, `${p.name} brought a ghodo out`, 'good')
        }
        s.phase = s.moving.remaining === 0 ? 'walk' : 'walk'
        return s
      }
      s.phase = 'pick'
      return s
    }

    case 'PICK': {
      if (s.phase !== 'pick') return state
      const moves = legalMoves(s, p.id, s.dice)
      const mv = moves.find((m) => m.token === action.token)
      if (!mv) return state
      if (mv.from === -1) {
        p.tokens[mv.token] = 0
        s.moving = { player: p.id, token: mv.token, remaining: 0 }
        say(s, `${p.name} brought a ghodo out`, 'good')
      } else {
        s.moving = { player: p.id, token: mv.token, remaining: mv.to - mv.from }
      }
      s.phase = 'walk'
      return s
    }

    case 'STEP': {
      if (s.phase !== 'walk' || !s.moving) return state
      if (s.moving.remaining > 0) {
        s.players[s.moving.player].tokens[s.moving.token] += 1
        s.moving.remaining -= 1
      }
      if (s.moving.remaining <= 0) finishMove(s)
      return s
    }

    case 'END_TURN': {
      if (s.phase !== 'end') return state
      if (s.bonus) {
        s.bonus = false
        s.phase = 'roll'
        return s
      }
      s.turn = (s.turn + 1) % s.players.length
      s.dice = null
      s.phase = 'roll'
      return s
    }

    case 'CLEAR_TOAST':
      s.toast = null
      return s

    default:
      return state
  }
}

// ---- computer player --------------------------------------------------
function scoreMove(state, player, mv) {
  const p = state.players[player]
  let score = mv.to - Math.max(mv.from, 0)
  if (mv.to === LAST) score += 120                       // a ghodo home is worth most
  if (mv.from === -1) score += 55                        // get out of the yard
  if (mv.to >= RING_LEN) score += 25                     // safely inside the lane
  const idx = ringIndex(p.seat, mv.to)
  if (idx >= 0) {
    if (SAFE.has(idx)) score += 14
    const victims = state.players.flatMap((q) =>
      q.id === p.id ? [] : q.tokens
        .map((pos, t) => ({ pos, t, q }))
        .filter((x) => x.pos >= 0 && x.pos < RING_LEN && ringIndex(q.seat, x.pos) === idx)
    )
    if (victims.length && !SAFE.has(idx)) score += 90 + victims.length * 20
    // walking into somebody else's gun sights is not clever
    const danger = state.players.some((q) => q.id !== p.id && q.tokens.some((pos) => {
      if (pos < 0 || pos >= RING_LEN) return false
      const gap = (idx - ringIndex(q.seat, pos) + RING_LEN) % RING_LEN
      return gap >= 1 && gap <= 6
    }))
    if (danger && !SAFE.has(idx)) score -= 35
  }
  return score
}

export function aiAction(state) {
  const p = state.players[state.turn]
  if (!p || !p.ai || state.winner !== null) return null
  if (state.phase === 'roll') return { type: 'ROLL' }
  if (state.phase === 'end') return { type: 'END_TURN' }
  if (state.phase === 'pick') {
    const moves = legalMoves(state, p.id, state.dice)
    if (!moves.length) return { type: 'END_TURN' }
    const best = moves
      .map((m) => ({ m, v: scoreMove(state, p.id, m) }))
      .sort((a, b) => b.v - a.v)[0]
    return { type: 'PICK', token: best.m.token }
  }
  return null
}

export const colorOf = (seat) => COLORS[seat]
export const seatSpots = (seat) => SEATS[seat].spots
