import { letterValue } from '../solver.js'

// Two tile colours, alternating per word, as if each word were laid by a
// different player. PLAYER_STYLES[cell.player] selects the scheme.
export const PLAYER_STYLES = [
  { name: 'Cream', bg: '#f4e4bc', border: '#d8c293', text: '#292524' },
  { name: 'Blue', bg: '#a8cdec', border: '#5f97c6', text: '#0f172a' },
]

// A single Scrabble tile, coloured by the player who placed it.
export default function Tile({ letter, player = 0, size }) {
  const style = PLAYER_STYLES[player] ?? PLAYER_STYLES[0]
  return (
    <div
      className="relative flex items-center justify-center rounded-[3px] border font-tile font-bold shadow-[0_1px_1px_rgba(0,0,0,0.45)] select-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
        backgroundColor: style.bg,
        borderColor: style.border,
        color: style.text,
      }}
    >
      {letter}
      <span
        className="absolute font-sans font-semibold leading-none"
        style={{
          right: size * 0.08,
          bottom: size * 0.06,
          fontSize: Math.round(size * 0.22),
          color: 'rgba(41,37,36,0.7)',
        }}
      >
        {letterValue(letter)}
      </span>
    </div>
  )
}
