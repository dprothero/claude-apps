import { test } from 'node:test'
import assert from 'node:assert/strict'
import { solve, normalizeWords, letterValue } from './solver.js'

// Render a layout to text so failures are easy to read.
function render(layout) {
  return layout.grid
    .map((row) => row.map((cell) => (cell ? cell.letter : '.')).join(''))
    .join('\n')
}

// Verify every placed word actually reads correctly on the grid.
function assertWordsReadable(layout) {
  for (const p of layout.placements) {
    let read = ''
    for (let i = 0; i < p.word.length; i++) {
      const r = p.dir === 'H' ? p.row : p.row + i
      const c = p.dir === 'H' ? p.col + i : p.col
      const cell = layout.grid[r][c]
      assert.ok(cell, `missing tile for ${p.word} at ${r},${c}`)
      read += cell.letter
    }
    assert.equal(read, p.word, `word ${p.word} not readable on grid`)
  }
}

test('normalizeWords cleans, uppercases and de-dupes', () => {
  assert.deepEqual(normalizeWords('cat, Dog  cat 12dog!'), ['CAT', 'DOG'])
  assert.deepEqual(normalizeWords(['Hi', 'hi', 'a b']), ['HI', 'AB'])
})

test('letterValue uses Scrabble tile scores', () => {
  assert.equal(letterValue('A'), 1)
  assert.equal(letterValue('q'), 10)
  assert.equal(letterValue('z'), 10)
})

test('single word lays out horizontally', () => {
  const layout = solve('hello')
  assert.equal(layout.rows, 1)
  assert.equal(layout.cols, 5)
  assert.equal(render(layout), 'HELLO')
})

test('two crossing words share their common letter', () => {
  const layout = solve('cat car')
  assertWordsReadable(layout)
  // They share at least one letter -> should be connected (no disconnected ones).
  assert.equal(layout.stats.disconnected, 0)
  assert.ok(layout.stats.crossings >= 1)
})

test('a connectable word set forms one connected crossword', () => {
  const layout = solve(['cat', 'tan', 'net', 'ten'])
  assertWordsReadable(layout)
  assert.equal(layout.stats.disconnected, 0)
  assert.ok(layout.stats.crossings >= 1)
})

test('crossings never conflict (overlapping letters match)', () => {
  const layout = solve(['scrabble', 'board', 'tile', 'word', 'play', 'game'])
  assertWordsReadable(layout)
  // Every multi-use cell holds exactly one agreed-upon letter (guaranteed by
  // assertWordsReadable: all words read correctly off the same grid).
  assert.equal(layout.stats.words, 6)
})

test('a word with no shared letters is placed disconnected, not dropped', () => {
  const layout = solve(['cat', 'xyz'])
  assert.equal(layout.stats.words, 2)
  assertWordsReadable(layout)
  assert.equal(layout.stats.disconnected, 1)
})

test('compact layout beats the naive one-per-line stack', () => {
  const words = ['cat', 'tan', 'net', 'ten', 'ant', 'eat']
  const layout = solve(words)
  const naiveArea = words.length * (words.length * 2) // generous stacked bound
  assert.ok(layout.stats.area < naiveArea, 'expected interlocked layout to be compact')
})

test('each tile is coloured by the player who placed it first', () => {
  const layout = solve(['scrabble', 'board', 'tile', 'play', 'game'])
  for (const row of layout.grid) {
    for (const cell of row) {
      if (!cell) continue
      // Two alternating player colours only.
      assert.ok(cell.player === 0 || cell.player === 1, 'player must be 0 or 1')
      // The colour matches the earliest word to occupy the cell.
      assert.equal(cell.player, cell.words[0] % 2)
    }
  }
})

test('empty input yields an empty layout', () => {
  const layout = solve('   , ,  ')
  assert.equal(layout.rows, 0)
  assert.equal(layout.words.length, 0)
})
