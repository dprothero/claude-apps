import { letterValue } from '../solver.js'

// A single Scrabble tile. `crossing` tiles (shared by two words) get a subtle
// accent so the interlocking structure is easy to read.
export default function Tile({ letter, crossing, disconnected, size }) {
  return (
    <div
      className={[
        'relative flex items-center justify-center rounded-[3px] font-tile font-bold select-none',
        'shadow-[0_1px_1px_rgba(0,0,0,0.45)] border',
        disconnected
          ? 'bg-amber-100 border-amber-300 text-amber-900'
          : crossing
            ? 'bg-yellow-200 border-yellow-400 text-emerald-900'
            : 'bg-[#f4e4bc] border-[#d8c293] text-stone-800',
      ].join(' ')}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
    >
      {letter}
      <span
        className="absolute font-sans font-semibold leading-none text-stone-600"
        style={{ right: size * 0.08, bottom: size * 0.06, fontSize: Math.round(size * 0.22) }}
      >
        {letterValue(letter)}
      </span>
    </div>
  )
}
