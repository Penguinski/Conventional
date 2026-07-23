import { useState } from "react";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import "./game.css";

const figures = [
  ["ombrellone", "sabbia"], ["palla", "sabbia"], ["libro", "pagina"], ["crema", "impronta"],
  ["paletta", "cumulo"], ["telo", "piega"], ["secchiello", "gocce"], ["corsa", "orme"],
  ["riposo", "conca"], ["bibita", "alone"], ["racchetta", "solco"], ["tuffo", "gocce"],
  ["scarpe pulite", "orme bagnate"], ["conchiglia", "foro"], ["cappello", "ombra"], ["castello", "mura"],
  ["gelato", "gocce"], ["asciugamano", "piega"], ["borsa", "solco"], ["rivista", "pagina"],
];

export default function OddOneOut({ onProgress, onComplete }: GameProps) {
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);
  const [zoom, setZoom] = useState(1);
  const seconds = useActiveTimer(!done);
  const pick = (index: number) => {
    onProgress({ errori: errors });
    if (index === 12) {
      setDone(true);
      onComplete({ errori: errors, secondi: seconds, punteggio: seconds + errors * 8 });
    } else {
      setErrors((value) => value + 1);
    }
  };
  return (
    <div className="game-panel odd-game">
      <div className="game-status"><label>ZOOM <input type="range" min="1" max="1.8" step=".1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label><span>{seconds}s · {errors} errori</span></div>
      <div className="odd-viewport">
        <div className="odd-scene" style={{ transform: `scale(${zoom})` }}>
          {figures.map(([action, trace], index) => (
            <button key={`${action}-${index}`} className={index === 12 && done ? "found" : ""} onClick={() => pick(index)} aria-label={`Personaggio: ${action}; traccia: ${trace}`}>
              <i /><span>{action}</span><small>{trace}</small>
            </button>
          ))}
        </div>
      </div>
      {errors >= 2 && !done && <p className="editorial-beat">Guarda la relazione, non il dettaglio raro: ogni gesto deve poter spiegare la traccia vicina.</p>}
      {done && <div className="result-panel"><h2>Scarpe pulite, orme bagnate.</h2><p>Il personaggio dichiara di non essere entrato in acqua, ma la sequenza di impronte lo contraddice.</p></div>}
    </div>
  );
}
