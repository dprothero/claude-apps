import { useMemo, useState } from 'react'
import { solve, normalizeWords } from './solver.js'
import Board from './components/Board.jsx'
import { PLAYER_STYLES } from './components/Tile.jsx'

// A small coloured square used in the legend and the inventory table.
function Swatch({ player }) {
  const style = PLAYER_STYLES[player] ?? PLAYER_STYLES[0]
  return (
    <span
      className="inline-block h-3.5 w-3.5 rounded-sm border align-middle"
      style={{ backgroundColor: style.bg, borderColor: style.border }}
    />
  )
}

// Tally every tile on the board by player colour and letter.
function buildInventory(layout) {
  if (!layout || !layout.grid) return []
  const counts = new Map()
  for (const row of layout.grid) {
    for (const cell of row) {
      if (!cell) continue
      const key = `${cell.player}|${cell.letter}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([key, count]) => {
      const [player, letter] = key.split('|')
      return { player: Number(player), letter, count }
    })
    .sort((a, b) => a.player - b.player || a.letter.localeCompare(b.letter))
}

const EXAMPLE = 'scrabble\nword\nboard\ntile\nplay\ngame\nletter\nbonus'

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-emerald-950/40 px-3 py-2 ring-1 ring-emerald-300/15">
      <div className="text-xl font-bold text-amber-200">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-emerald-200/70">{label}</div>
    </div>
  )
}

export default function App() {
  const [text, setText] = useState(EXAMPLE)
  const [layout, setLayout] = useState(null)
  const [solving, setSolving] = useState(false)

  const preview = normalizeWords(text)
  const inventory = useMemo(() => buildInventory(layout), [layout])

  function handleSolve() {
    setSolving(true)
    // Defer so the button shows feedback before the (synchronous) solve runs.
    setTimeout(() => {
      setLayout(solve(text))
      setSolving(false)
    }, 10)
  }

  return (
    <div className="min-h-full text-emerald-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-amber-200">Scrabble</span> Solver
          </h1>
          <p className="mt-2 max-w-2xl text-emerald-100/80">
            Enter a list of words. The solver packs them into the most compact legal
            crossword &mdash; every word interlocks with the board like a real sequence of
            Scrabble moves.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Input panel */}
          <div className="space-y-4">
            <label htmlFor="words" className="block text-sm font-semibold text-emerald-100">
              Words (one per line, or comma / space separated)
            </label>
            <textarea
              id="words"
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              rows={10}
              className="w-full resize-y rounded-lg bg-emerald-950/50 p-3 font-mono text-sm text-emerald-50 ring-1 ring-emerald-300/20 outline-none placeholder:text-emerald-300/40 focus:ring-2 focus:ring-amber-300/60"
              placeholder="cat&#10;tan&#10;net"
            />

            <div className="flex items-center justify-between text-xs text-emerald-200/70">
              <span>
                {preview.length} unique word{preview.length === 1 ? '' : 's'} detected
              </span>
              <button
                type="button"
                onClick={() => setText(EXAMPLE)}
                className="underline decoration-dotted underline-offset-2 hover:text-amber-200"
              >
                Load example
              </button>
            </div>

            <button
              type="button"
              onClick={handleSolve}
              disabled={solving || preview.length === 0}
              className="w-full rounded-lg bg-amber-300 px-4 py-3 text-lg font-bold text-emerald-950 shadow transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {solving ? 'Solving…' : 'Solve'}
            </button>

            <div className="flex flex-wrap gap-4 pt-2 text-xs text-emerald-200/70">
              <span className="flex items-center gap-1.5">
                <Swatch player={0} /> Player 1 tiles
              </span>
              <span className="flex items-center gap-1.5">
                <Swatch player={1} /> Player 2 tiles
              </span>
              <span className="basis-full text-emerald-200/50">
                Tiles alternate colour by word, as if players took turns.
              </span>
            </div>
          </div>

          {/* Result panel */}
          <div>
            {layout && layout.stats ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Words" value={layout.stats.words} />
                  <Stat label="Board" value={`${layout.rows}×${layout.cols}`} />
                  <Stat label="Crossings" value={layout.stats.crossings} />
                  <Stat label="Tiles used" value={layout.stats.tiles} />
                </div>

                {layout.stats.disconnected > 0 && (
                  <p className="rounded-lg bg-amber-300/10 px-3 py-2 text-sm text-amber-100 ring-1 ring-amber-300/30">
                    {layout.stats.disconnected} word
                    {layout.stats.disconnected === 1 ? '' : 's'} share no letters with the
                    rest and couldn&rsquo;t interlock, so {layout.stats.disconnected === 1 ? 'it is' : 'they are'}{' '}
                    shown separately below the board.
                  </p>
                )}

                <div className="flex justify-end no-print">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-lg bg-emerald-800/70 px-3 py-1.5 text-sm font-semibold text-emerald-50 ring-1 ring-emerald-300/30 transition hover:bg-emerald-700"
                  >
                    Print board
                  </button>
                </div>

                <div className="overflow-auto pb-2">
                  <div className="print-board inline-block">
                    <Board layout={layout} />
                  </div>
                </div>

                <div>
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-100">
                    Tile inventory
                  </h2>
                  <div className="inline-block overflow-hidden rounded-lg ring-1 ring-emerald-300/15">
                    <table className="text-sm">
                      <thead>
                        <tr className="bg-emerald-950/50 text-left text-[11px] uppercase tracking-wide text-emerald-200/70">
                          <th className="px-4 py-2 font-semibold">Color</th>
                          <th className="px-4 py-2 font-semibold">Letter</th>
                          <th className="px-4 py-2 text-right font-semibold">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map(({ player, letter, count }) => (
                          <tr
                            key={`${player}-${letter}`}
                            className="border-t border-emerald-300/10 odd:bg-emerald-950/20"
                          >
                            <td className="px-4 py-1.5">
                              <span className="flex items-center gap-2">
                                <Swatch player={player} />
                                {PLAYER_STYLES[player]?.name} (Player {player + 1})
                              </span>
                            </td>
                            <td className="px-4 py-1.5 font-mono font-semibold">{letter}</td>
                            <td className="px-4 py-1.5 text-right tabular-nums">{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border-2 border-dashed border-emerald-300/20 text-center text-emerald-200/60">
                <p className="max-w-xs px-6">
                  Your compact crossword layout will appear here once you hit{' '}
                  <span className="font-semibold text-amber-200">Solve</span>.
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 text-xs text-emerald-200/50">
          Words interlock at matching letters; the solver searches many orderings and keeps
          the smallest, squarest board.
        </footer>
      </div>
    </div>
  )
}
