import { letterValue } from '../solver.js'

// A single Scrabble tile — one classic tile color for every word.
export default function Tile({ letter, size }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-[3px] border font-tile font-bold shadow-[0_1px_1px_rgba(0,0,0,0.45)] select-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
        backgroundColor: '#f4e4bc',
        borderColor: '#d8c293',
        color: '#292524',
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
