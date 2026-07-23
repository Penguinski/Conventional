export interface Entry {
  number: number;
  answer: string;
  clue: string;
  row: number;
  col: number;
  direction: "across" | "down";
}

export const entries: Entry[] = [
  { number: 1, answer: "TRACCIA", clue: "Quello che resta dopo un passaggio.", row: 4, col: 1, direction: "across" },
  { number: 2, answer: "RESTO", clue: "Avanzo, ma anche ciò che rimane.", row: 1, col: 1, direction: "down" },
  { number: 3, answer: "ORMA", clue: "Firma involontaria di una scarpa.", row: 3, col: 2, direction: "down" },
  { number: 4, answer: "CALCO", clue: "Forma ottenuta da un’impronta.", row: 3, col: 3, direction: "down" },
  { number: 5, answer: "CREPA", clue: "Una linea che il muro non aveva previsto.", row: 4, col: 4, direction: "down" },
  { number: 6, answer: "MACCHIA", clue: "Segno che spesso si prova a togliere.", row: 1, col: 5, direction: "down" },
  { number: 7, answer: "SCIA", clue: "Traccia mobile nell’acqua o nell’aria.", row: 2, col: 6, direction: "down" },
  { number: 8, answer: "FANGO", clue: "Terra bagnata che viaggia sotto le suole.", row: 3, col: 7, direction: "down" },
];

export function solutionCells() {
  const cells = new Map<string, string>();
  entries.forEach((entry) => [...entry.answer].forEach((letter, index) => {
    const row = entry.row + (entry.direction === "down" ? index : 0);
    const col = entry.col + (entry.direction === "across" ? index : 0);
    cells.set(`${row}-${col}`, letter);
  }));
  return cells;
}

export function validateCrossword(values: Record<string, string>): boolean {
  return [...solutionCells()].every(([key, letter]) => values[key]?.toUpperCase() === letter);
}
