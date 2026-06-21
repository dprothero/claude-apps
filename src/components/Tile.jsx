import { letterValue } from '../solver.js'

// Procedural maple wood-grain texture (no external image needed). An SVG
// fractal-noise filter paints fine brown grain over a warm maple base; we pan
// it per tile so adjacent tiles don't look identical.
const WOOD_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>
  <filter id='g'>
    <feTurbulence type='fractalNoise' baseFrequency='0.013 0.16' numOctaves='5' seed='9' stitchTiles='stitch' result='n'/>
    <feColorMatrix in='n' type='matrix'
      values='0 0 0 0 0.42  0 0 0 0 0.29  0 0 0 0 0.16  0 0 0 1.1 0' result='c'/>
    <feComponentTransfer in='c' result='grain'>
      <feFuncA type='gamma' amplitude='1' exponent='1.8' offset='0'/>
    </feComponentTransfer>
  </filter>
  <rect width='100%' height='100%' fill='#e9cc9c'/>
  <rect width='100%' height='100%' filter='url(#g)' opacity='0.6'/>
</svg>`

const WOOD_URL = `url("data:image/svg+xml,${encodeURIComponent(WOOD_SVG)}")`

// A single Scrabble tile with a photo-style maple wood-grain face.
export default function Tile({ letter, size, posX = 50, posY = 50 }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-[3px] font-tile font-bold select-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
        color: '#2b2014',
        textShadow: '0 1px 0 rgba(255,255,255,0.3)',
        backgroundColor: '#e9cc9c',
        // Soft sheen on top of the wood grain.
        backgroundImage: `radial-gradient(120% 120% at 30% 18%, rgba(255,255,255,0.35), rgba(255,255,255,0) 48%), ${WOOD_URL}`,
        backgroundSize: 'cover, 220% 220%',
        backgroundPosition: `center, ${posX}% ${posY}%`,
        border: '1px solid #c2a06f',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 3px rgba(76,48,18,0.28), 0 1px 2px rgba(0,0,0,0.45)',
      }}
    >
      {letter}
      <span
        className="absolute font-sans font-semibold leading-none"
        style={{
          right: size * 0.08,
          bottom: size * 0.06,
          fontSize: Math.round(size * 0.22),
          color: 'rgba(43,32,20,0.85)',
        }}
      >
        {letterValue(letter)}
      </span>
    </div>
  )
}
