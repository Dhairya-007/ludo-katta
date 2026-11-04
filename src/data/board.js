// Ludo Katta board geometry. The board is a 15x15 grid of cells; every
// coordinate below is a cell index (0..14) with x to the right, y down.

export const GRID = 15

// The 52-cell ring, clockwise, starting at the left arm's upper lane.
export const RING = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  [7, 0],
  [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  [14, 7],
  [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  [7, 14],
  [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 7],
  [0, 6],
]

export const RING_LEN = RING.length // 52
export const HOME_RUN = 5           // coloured lane before the centre
export const LAST = RING_LEN - 1 + HOME_RUN + 1 // progress value meaning "home" = 56

export const COLORS = [
  { key: 'lal',   name: 'Lal',   hex: '#e23030', deep: '#8c1414', soft: '#ffd7d7' },
  { key: 'peelo', name: 'Peelo', hex: '#f0b40c', deep: '#9a7000', soft: '#fff3c4' },
  { key: 'lilo',  name: 'Lilo',  hex: '#1f9d55', deep: '#0d5c30', soft: '#ccf2dc' },
  { key: 'vadli', name: 'Vadli', hex: '#2b6cd9', deep: '#143c82', soft: '#d3e4ff' },
]

// start index on the ring, home lane cells, and the four parking spots
export const SEATS = [
  {
    start: 0,
    lane: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
    yard: [0, 0],
    spots: [[1.6, 1.6], [3.6, 1.6], [1.6, 3.6], [3.6, 3.6]],
    centre: [[6, 6], [6, 9], [7.5, 7.5]],
  },
  {
    start: 13,
    lane: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
    yard: [9, 0],
    spots: [[10.6, 1.6], [12.6, 1.6], [10.6, 3.6], [12.6, 3.6]],
    centre: [[6, 6], [9, 6], [7.5, 7.5]],
  },
  {
    start: 26,
    lane: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
    yard: [9, 9],
    spots: [[10.6, 10.6], [12.6, 10.6], [10.6, 12.6], [12.6, 12.6]],
    centre: [[9, 6], [9, 9], [7.5, 7.5]],
  },
  {
    start: 39,
    lane: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
    yard: [0, 9],
    spots: [[1.6, 10.6], [3.6, 10.6], [1.6, 12.6], [3.6, 12.6]],
    centre: [[6, 9], [9, 9], [7.5, 7.5]],
  },
]

// starts plus the four starred squares: nobody can be cut while standing here
export const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47])

// progress (0..56) -> grid cell for a given seat
export function cellFor(seat, progress) {
  const s = SEATS[seat]
  if (progress < RING_LEN) return RING[(s.start + progress) % RING_LEN]
  if (progress < RING_LEN + HOME_RUN) return s.lane[progress - RING_LEN]
  return [7, 7]
}

export const ringIndex = (seat, progress) =>
  progress < RING_LEN ? (SEATS[seat].start + progress) % RING_LEN : -1
