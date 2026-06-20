// Scrabble Solver core.
//
// Given a list of words, find a compact way to lay them all out on a board as a
// legal, interlocking crossword (the way successive Scrabble moves must connect
// to tiles already on the board).
//
// Legality rules enforced here (structural Scrabble rules, no dictionary check):
//   1. Every word is placed horizontally or vertically.
//   2. Where two words share a cell, the letters must match (a crossing).
//   3. Every word after the first must cross at least one existing tile.
//   4. A word may not be a strict extension of another (the cells immediately
//      before its first letter and after its last letter must be empty).
//   5. A newly placed (non-crossing) tile may not sit directly beside another
//      tile perpendicular to its word, which would create an unintended word.
//
// "Most compact" = smallest bounding box, preferring square-ish layouts and
// more crossings (which pack tiles tighter).

export const LETTER_VALUES = {
  A: 1, E: 1, I: 1, O: 1, U: 1, L: 1, N: 1, S: 1, T: 1, R: 1,
  D: 2, G: 2,
  B: 3, C: 3, M: 3, P: 3,
  F: 4, H: 4, V: 4, W: 4, Y: 4,
  K: 5,
  J: 8, X: 8,
  Q: 10, Z: 10,
}

export function letterValue(letter) {
  return LETTER_VALUES[letter?.toUpperCase()] ?? 0
}

// --- input parsing -------------------------------------------------------

// Turn arbitrary user text into a clean, de-duplicated list of A-Z words.
export function normalizeWords(input) {
  const raw = Array.isArray(input) ? input : String(input).split(/[\s,]+/)
  const seen = new Set()
  const words = []
  for (const item of raw) {
    const word = String(item).toUpperCase().replace(/[^A-Z]/g, '')
    if (!word) continue
    if (seen.has(word)) continue
    seen.add(word)
    words.push(word)
  }
  return words
}

// --- low level board helpers --------------------------------------------

const key = (r, c) => `${r},${c}`

// Can `placement` legally be added to `board` (a Map of "r,c" -> letter)?
// Returns { ok, overlaps } where overlaps is the number of crossing tiles.
function canPlace(board, { word, row, col, dir }) {
  const len = word.length
  let overlaps = 0

  // Rule 4: no tile immediately before the start or after the end.
  const beforeKey = dir === 'H' ? key(row, col - 1) : key(row - 1, col)
  const afterKey = dir === 'H' ? key(row, col + len) : key(row + len, col)
  if (board.has(beforeKey) || board.has(afterKey)) return { ok: false }

  for (let i = 0; i < len; i++) {
    const r = dir === 'H' ? row : row + i
    const c = dir === 'H' ? col + i : col
    const existing = board.get(key(r, c))
    if (existing !== undefined) {
      // Rule 2: crossing letters must match.
      if (existing !== word[i]) return { ok: false }
      overlaps++
    } else {
      // Rule 5: a fresh tile must not touch tiles perpendicular to the word.
      const n1 = dir === 'H' ? key(r - 1, c) : key(r, c - 1)
      const n2 = dir === 'H' ? key(r + 1, c) : key(r, c + 1)
      if (board.has(n1) || board.has(n2)) return { ok: false }
    }
  }
  return { ok: true, overlaps }
}

// Produce a new state with `placement` added.
function applyPlacement(state, placement, overlaps) {
  const board = new Map(state.board)
  const { word, row, col, dir } = placement
  for (let i = 0; i < word.length; i++) {
    const r = dir === 'H' ? row : row + i
    const c = dir === 'H' ? col + i : col
    board.set(key(r, c), word[i])
  }
  const len = word.length
  const endR = dir === 'H' ? row : row + len - 1
  const endC = dir === 'H' ? col + len - 1 : col
  return {
    board,
    placements: [...state.placements, placement],
    minR: Math.min(state.minR, row),
    maxR: Math.max(state.maxR, endR),
    minC: Math.min(state.minC, col),
    maxC: Math.max(state.maxC, endC),
    overlaps: state.overlaps + overlaps,
  }
}

// All legal placements of `word` that cross at least one existing tile.
function generatePlacements(board, word) {
  const result = []
  const seen = new Set()
  for (const [k, letter] of board) {
    const [r, c] = k.split(',').map(Number)
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== letter) continue
      const candidates = [
        { word, row: r, col: c - i, dir: 'H' },
        { word, row: r - i, col: c, dir: 'V' },
      ]
      for (const p of candidates) {
        const id = `${p.row},${p.col},${p.dir}`
        if (seen.has(id)) continue
        seen.add(id)
        const chk = canPlace(board, p)
        if (chk.ok && chk.overlaps >= 1) result.push({ placement: p, overlaps: chk.overlaps })
      }
    }
  }
  return result
}

// Lower is more compact: bounding-box area dominates, then squareness, then
// reward crossings (they mean tiles are shared rather than spread out).
function stateScore(state) {
  const w = state.maxC - state.minC + 1
  const h = state.maxR - state.minR + 1
  return w * h * 100 + Math.abs(w - h) * 10 - state.overlaps
}

function firstWordState(word) {
  const board = new Map()
  for (let i = 0; i < word.length; i++) board.set(key(0, i), word[i])
  return {
    board,
    placements: [{ word, row: 0, col: 0, dir: 'H' }],
    minR: 0,
    maxR: 0,
    minC: 0,
    maxC: word.length - 1,
    overlaps: 0,
  }
}

// Beam search: greedily interlock words while keeping the most compact partial
// layouts. Words that can't connect anywhere are returned as `unplaced`.
function packConnected(order, beamWidth) {
  let beam = [firstWordState(order[0])]
  const unplaced = []
  for (let wi = 1; wi < order.length; wi++) {
    const word = order[wi]
    const next = []
    for (const state of beam) {
      for (const { placement, overlaps } of generatePlacements(state.board, word)) {
        next.push(applyPlacement(state, placement, overlaps))
      }
    }
    if (next.length === 0) {
      // Nothing this word can cross yet; defer it for disconnected placement.
      unplaced.push(word)
      continue
    }
    next.sort((a, b) => stateScore(a) - stateScore(b))
    beam = next.slice(0, beamWidth)
  }
  return { state: beam[0], unplaced }
}

// Stack any unconnectable words below the main layout so every word still shows.
function appendDisconnected(state, unplaced) {
  const placements = state.placements.map((p) => ({ ...p }))
  let rowCursor = state.maxR + 2
  for (const word of unplaced) {
    placements.push({ word, row: rowCursor, col: state.minC, dir: 'H', disconnected: true })
    rowCursor += 2
  }
  return placements
}

// Deterministic shuffle so results are reproducible for a given input.
function seededShuffle(arr, seed) {
  const a = [...arr]
  let s = seed
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function candidateOrderings(words) {
  const byLenDesc = [...words].sort((a, b) => b.length - a.length || a.localeCompare(b))
  const byLenAsc = [...words].sort((a, b) => a.length - b.length || a.localeCompare(b))
  const orderings = [byLenDesc, words, byLenAsc]
  for (let i = 1; i <= 4; i++) orderings.push(seededShuffle(words, i * 7919))
  // De-duplicate identical orderings.
  const seen = new Set()
  const unique = []
  for (const o of orderings) {
    const sig = o.join('|')
    if (seen.has(sig)) continue
    seen.add(sig)
    unique.push(o)
  }
  return unique
}

// Build the final grid + metadata from a flat list of placements.
function finalizeLayout(placements) {
  let minR = Infinity
  let minC = Infinity
  let maxR = -Infinity
  let maxC = -Infinity
  for (const { word, row, col, dir } of placements) {
    const endR = dir === 'H' ? row : row + word.length - 1
    const endC = dir === 'H' ? col + word.length - 1 : col
    minR = Math.min(minR, row)
    minC = Math.min(minC, col)
    maxR = Math.max(maxR, endR)
    maxC = Math.max(maxC, endC)
  }

  const rows = maxR - minR + 1
  const cols = maxC - minC + 1
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null))

  const normalized = placements.map((p, index) => ({
    ...p,
    index,
    row: p.row - minR,
    col: p.col - minC,
  }))

  for (const { word, row, col, dir, index } of normalized) {
    for (let i = 0; i < word.length; i++) {
      const r = dir === 'H' ? row : row + i
      const c = dir === 'H' ? col + i : col
      const cell = grid[r][c]
      const disconnected = !!normalized[index].disconnected
      if (cell) {
        cell.count += 1
        cell.words.push(index)
        // A shared cell only counts as disconnected if every word on it is.
        cell.disconnected = cell.disconnected && disconnected
      } else {
        grid[r][c] = { letter: word[i], count: 1, words: [index], disconnected }
      }
    }
  }

  let tiles = 0
  let crossings = 0
  for (const rowCells of grid) {
    for (const cell of rowCells) {
      if (!cell) continue
      tiles += 1
      if (cell.count > 1) crossings += 1
    }
  }

  return {
    grid,
    placements: normalized,
    rows,
    cols,
    stats: {
      words: placements.length,
      tiles,
      crossings,
      area: rows * cols,
      disconnected: placements.filter((p) => p.disconnected).length,
    },
  }
}

// Compare two finished layouts; lower is better.
function layoutScore(layout) {
  const { rows, cols, stats } = layout
  return (
    stats.disconnected * 1_000_000 +
    rows * cols * 100 +
    Math.abs(rows - cols) * 10 -
    stats.crossings
  )
}

// --- public entry point --------------------------------------------------

export function solve(input, options = {}) {
  const beamWidth = options.beamWidth ?? 40
  const words = normalizeWords(input)
  if (words.length === 0) {
    return { grid: [], placements: [], rows: 0, cols: 0, stats: null, words: [] }
  }
  if (words.length === 1) {
    return { ...finalizeLayout([{ word: words[0], row: 0, col: 0, dir: 'H' }]), words }
  }

  let best = null
  for (const order of candidateOrderings(words)) {
    const { state, unplaced } = packConnected(order, beamWidth)
    const layout = finalizeLayout(appendDisconnected(state, unplaced))
    const score = layoutScore(layout)
    if (!best || score < best.score) best = { layout, score }
  }
  return { ...best.layout, words }
}
