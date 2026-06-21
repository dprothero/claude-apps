import { useMemo } from 'react'
import Tile from './Tile.jsx'

// Graphical representation of the solved layout. Empty cells render as faint
// board squares; filled cells render as Scrabble tiles.
export default function Board({ layout }) {
  const { grid, rows, cols } = layout

  // Scale tiles down as the board grows so it stays on screen; cap for legibility.
  const size = useMemo(() => {
    const longest = Math.max(rows, cols, 1)
    return Math.max(22, Math.min(46, Math.floor(620 / longest)))
  }, [rows, cols])

  const gap = Math.max(2, Math.round(size * 0.08))

  return (
    <div className="board-frame inline-block rounded-lg bg-emerald-950/40 p-3 ring-1 ring-emerald-300/20">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${size}px)`,
          gridTemplateRows: `repeat(${rows}, ${size}px)`,
          gap,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <Tile key={`${r}-${c}`} letter={cell.letter} size={size} />
            ) : (
              <div
                key={`${r}-${c}`}
                className="board-empty rounded-[3px] bg-emerald-900/30 ring-1 ring-inset ring-emerald-300/5"
                style={{ width: size, height: size }}
              />
            ),
          ),
        )}
      </div>
    </div>
  )
}
