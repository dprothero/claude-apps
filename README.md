# Scrabble Solver

A web app that takes a list of words and packs them into the **most compact
legal Scrabble crossword** — every word interlocks with tiles already on the
board, the way a real sequence of Scrabble moves must connect.

Built with **React**, **Vite**, and **Tailwind CSS**.

## Usage

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build to dist/
npm test         # run the solver unit tests
```

Type or paste a list of words (one per line, or comma/space separated), click
**Solve**, and the laid-out board renders as graphical Scrabble tiles.

## How it works

The solver lives in [`src/solver.js`](src/solver.js) and is pure, UI-free logic.

1. **Parse** the input into clean, de-duplicated A–Z words.
2. **Pack** with a beam search: place the first word, then repeatedly add each
   remaining word at a position where it crosses an existing tile, keeping the
   most compact partial layouts at each step.
3. **Try many orderings** (longest-first, original, shortest-first, and several
   deterministic shuffles) and keep the smallest, squarest result.
4. **Render** the winning layout as a grid of tiles, highlighting crossings.

### Legality rules enforced

No dictionary is used, but every layout obeys Scrabble's *structural* rules:

- Words run only horizontally or vertically.
- Overlapping cells must hold the same letter (a valid crossing).
- Every word after the first crosses at least one existing tile.
- A word can't be a strict extension of another (no tile butting up against its
  ends).
- A freshly placed tile can't sit alongside another tile perpendicular to its
  word, which would form an unintended word.

Words that share no letters with the rest can't interlock; they're placed
separately below the board and clearly flagged.

### "Most compact"

Layouts are ranked by bounding-box area first, then by squareness, then by
number of crossings (more crossings means tiles are shared rather than spread
out). The lowest-scoring layout across all attempted orderings wins.
