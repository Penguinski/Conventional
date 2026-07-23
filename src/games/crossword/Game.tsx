import { useState } from "react";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import { entries, solutionCells, validateCrossword } from "./logic";
import "./game.css";

const solution = solutionCells();

export default function Crossword({ onProgress, onComplete }: GameProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);
  const seconds = useActiveTimer(!done);
  const update = (key: string, value: string) => {
    const next = { ...values, [key]: value.slice(-1).toUpperCase() };
    setValues(next); setChecked(false); onProgress({ lettere: Object.values(next).filter(Boolean).length, rivelate: revealed });
    if (validateCrossword(next)) { setDone(true); onComplete({ secondi: seconds, rivelate: revealed }); }
  };
  const reveal = () => {
    if (!active || !solution.has(active)) return;
    const next = { ...values, [active]: solution.get(active)! };
    setValues(next); setRevealed((value) => value + 1);
    if (validateCrossword(next)) { setDone(true); onComplete({ secondi: seconds, rivelate: revealed + 1 }); }
  };
  const numbers = new Map<string, number>();
  entries.forEach((entry) => numbers.set(`${entry.row}-${entry.col}`, entry.number));
  return (
    <div className="game-panel crossword-game">
      <div className="game-status"><span>{seconds}s · {revealed} rivelate</span><div><button onClick={() => setChecked(true)}>CONTROLLA</button><button onClick={reveal}>RIVELA LETTERA</button><button onClick={() => { setValues({}); setDone(false); }}>RIPRISTINA</button></div></div>
      <div className="crossword-layout">
        <div className="crossword-grid" aria-label="Cruciverba 9 per 9">
          {Array.from({ length: 81 }, (_, index) => {
            const row = Math.floor(index / 9), col = index % 9, key = `${row}-${col}`, letter = solution.get(key);
            if (!letter) return <i className="block" key={key} />;
            const wrong = checked && values[key] && values[key] !== letter;
            return <label key={key} className={wrong ? "wrong" : ""}>{numbers.has(key) && <small>{numbers.get(key)}</small>}<input aria-label={`Casella ${row + 1}, ${col + 1}`} maxLength={1} value={values[key] ?? ""} onFocus={() => setActive(key)} onChange={(event) => update(key, event.target.value)} /></label>;
          })}
        </div>
        <ol className="clues">{entries.map((entry) => <li key={entry.number}><b>{entry.number}.</b> {entry.clue}</li>)}</ol>
      </div>
      {Object.keys(values).length >= 8 && !done && <p className="editorial-beat">Le parole si sostengono a vicenda: una lettera corretta restringe più di una definizione.</p>}
      {done && <div className="result-panel"><h2>Griglia completa</h2><p>Otto parole, sette incroci e qualche residuo d’inchiostro.</p></div>}
    </div>
  );
}
