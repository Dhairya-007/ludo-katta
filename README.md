# 🎲 Ludo Katta

Four colours, sixteen ghoda, one argument. Classic ludo in the browser with
computer opponents that actually hunt you — they count the squares behind
them before stepping into your range.

Frontend only. React + Vite, no backend, no assets to download.

![stack](https://img.shields.io/badge/React-18-61dafb) ![stack](https://img.shields.io/badge/Vite-5-646cff) ![stack](https://img.shields.io/badge/board-pure%20SVG-e23030)

## Play

```bash
npm install
npm run dev
```

2, 3 or 4 players — any mix of humans and computers — with 2 ghoda each for a
quick game or the full 4.

## The rules it actually implements

- **Six to open.** A six brings a ghoda out and earns another roll. Three sixes
  in a row and the turn is gone.
- **Cutting.** Land on an opponent outside a safe square and that ghoda walks
  back to its yard — and you get a bonus roll for it.
- **Safe squares.** The four coloured starts and the four starred squares.
- **Exact finish.** 57 steps: 51 around the ring, 5 up your own coloured lane,
  then the centre. Overshoot and that ghoda simply waits.
- Getting a ghoda home is also worth a bonus roll.

## The computer player

Every legal move is scored: a ghoda reaching home is worth most, then a cut,
then getting out of the yard, then reaching the safety of the coloured lane —
minus a penalty for landing within six squares in front of an enemy ghoda.
It picks the best score, so it will skip an obvious run to cut you instead.

Thirty full four-player games were simulated head-less against the engine to
confirm every one of them finishes with no dead turns.

## How it is built

```
src/
  data/board.js       the 52-cell ring, home lanes, yards, safe squares
  game/engine.js      pure reducer + the move scoring the computer uses
  components/
    Board.jsx         SVG board, yards, stars, centre rosette, token layer
    Panel.jsx         dice, player state, match log
    Setup.jsx         seats, names, ghoda count
```

One function maps a ghoda's progress (0–57) to a grid cell, and the squares,
the tokens and the computer's distance maths all read from it.

## License

MIT
