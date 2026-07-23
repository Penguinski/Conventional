import { useState } from "react";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import "./game.css";

const differences = [
  ["tazza", "Un alone circolare dice dove la tazza ha aspettato."],
  ["cuscino", "La stoffa conserva una pressione per qualche minuto."],
  ["sedia", "Quaranta centimetri bastano a registrare un passaggio."],
  ["cassetto", "Aperto di poco: abbastanza per diventare indizio."],
  ["briciole", "Una costellazione domestica, subito destinata alla spugna."],
  ["chiavi", "Un oggetto abbandonato trasforma un piano in punto d’atterraggio."],
  ["vetro", "Il vapore scrive in fretta e cancella da solo."],
];

export default function SpotDifference({ onProgress, onComplete }: GameProps) {
  const [found, setFound] = useState<number[]>([]);
  const [errors, setErrors] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<"both" | "before" | "after">("both");
  const seconds = useActiveTimer(found.length < differences.length);
  const choose = (index: number) => {
    if (found.includes(index)) return;
    const next = [...found, index];
    setFound(next);
    onProgress({ trovate: next.length, errori: errors });
    if (next.length === differences.length) onComplete({ secondi: seconds, errori: errors, aiuti: 0 });
  };
  const panel = (after: boolean) => (
    <div className={`room-panel ${after ? "after" : "before"}`} style={{ transform: `scale(${zoom})` }}>
      <i className="sofa" /><i className="chair" /><i className="table" /><i className="cup" /><i className="drawer-mark" /><i className="window" />
      {after && differences.map(([label], index) => <button key={label} className={`diff diff-${index} ${found.includes(index) ? "found" : ""}`} onClick={() => choose(index)} aria-label={`Differenza: ${label}`} />)}
    </div>
  );
  return (
    <div className="game-panel difference-game">
      <div className="game-status">
        <label>ZOOM <input type="range" min="1" max="1.5" step=".1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
        <span>{found.length}/7 · {seconds}s · {errors} errori</span>
      </div>
      <div className="view-switch">
        <button onClick={() => setView("before")}>PRIMA</button><button onClick={() => setView("both")}>AFFIANCATE</button><button onClick={() => setView("after")}>DOPO</button>
      </div>
      <div className={`room-comparison view-${view}`} onClick={(event) => { if (event.target === event.currentTarget) setErrors((value) => value + 1); }}>
        {view !== "after" && <div className="room-wrap"><span>PRIMA</span>{panel(false)}</div>}
        {view !== "before" && <div className="room-wrap"><span>DOPO</span>{panel(true)}</div>}
      </div>
      {found.length > 0 && <p className="editorial-beat">{differences[found.at(-1)!][1]}</p>}
      {found.length === differences.length && <div className="result-panel"><h2>Passaggio ricostruito</h2><p>Sette differenze, tutte prodotte da un’azione interrotta o appena conclusa.</p></div>}
    </div>
  );
}
