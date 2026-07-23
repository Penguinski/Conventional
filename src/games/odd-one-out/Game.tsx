import { useRef, useState } from "react";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import "./game.css";

interface Actor {
  id: string;
  x: number;
  y: number;
  color: string;
  traceDirection: "left" | "right";
}

export const actors: Actor[] = Array.from({ length: 16 }, (_, index) => ({
  id: `figura-${index + 1}`,
  x: 90 + (index % 4) * 185 + (index % 2) * 16,
  y: 90 + Math.floor(index / 4) * 128,
  color: ["#c96243", "#9f9720", "#90b5dd", "#b7aacb"][index % 4],
  traceDirection: index === 9 ? "right" : "left",
}));
const TARGET = 9;

export default function OddOneOut({ onProgress, onComplete }: GameProps) {
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [miss, setMiss] = useState<{ x: number; y: number; id: number } | null>(null);
  const missIdRef = useRef(0);
  const seconds = useActiveTimer(!done);

  const pick = (index: number) => {
    if (done) return;
    if (index === TARGET) {
      setDone(true);
      onComplete({ errori: errors, secondi: seconds, punteggio: seconds + errors * 8 });
      navigator.vibrate?.(25);
      return;
    }
    const actor = actors[index];
    missIdRef.current += 1;
    const missId = missIdRef.current;
    setErrors((value) => value + 1);
    setMiss({ x: actor.x, y: actor.y, id: missId });
    window.setTimeout(() => setMiss((current) => current?.id === missId ? null : current), 450);
    onProgress({ errori: errors + 1 });
  };

  const reset = () => {
    setErrors(0);
    setDone(false);
    setMiss(null);
    setZoom(1);
  };

  return (
    <div className="game-panel odd-game">
      <div className="game-status">
        <label>ZOOM <input type="range" min="1" max="1.8" step=".1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
        <span>{seconds}s · {errors} errori</span>
        <button onClick={reset}>RIPROVA</button>
      </div>
      <p className="compact-instruction">Trova la figura la cui traccia indica una direzione diversa dal suo movimento.</p>
      <div className="odd-viewport" aria-label="Scena esplorabile con pan e zoom">
        <div className="odd-scene" style={{ transform: `scale(${zoom})` }}>
          <svg viewBox="0 0 760 520" role="img" aria-label="Sedici figure geometriche e le tracce lasciate">
            <rect width="760" height="520" fill="#90b5dd" />
            {actors.map((actor) => {
              const sign = actor.traceDirection === "left" ? -1 : 1;
              return (
                <g key={actor.id}>
                  <line x1={actor.x + sign * 22} y1={actor.y + 28} x2={actor.x + sign * 67} y2={actor.y + 28} stroke="#263627" strokeWidth="4" strokeDasharray="5 9" />
                  <circle cx={actor.x} cy={actor.y} r="19" fill={actor.color} stroke="#263627" strokeWidth="3" />
                  <path d={`M ${actor.x} ${actor.y + 19} l ${sign * 18} 32 l ${sign * -9} 34 M ${actor.x + sign * 18} ${actor.y + 51} l ${sign * 25} 20`} fill="none" stroke="#263627" strokeWidth="5" strokeLinecap="round" />
                </g>
              );
            })}
            {miss && <circle className="miss-mark" cx={miss.x} cy={miss.y} r="31" fill="none" stroke="#c96243" strokeWidth="5" />}
          </svg>
          {actors.map((actor, index) => (
            <button
              key={actor.id}
              className={done && index === TARGET ? "found" : ""}
              style={{ left: actor.x, top: actor.y }}
              onClick={() => pick(index)}
              aria-label={`Figura ${index + 1}`}
            />
          ))}
        </div>
      </div>
      {done && <div className="result-panel"><h2>Relazione contraddittoria</h2><p>La figura 10 procede verso destra, ma i segni sono davanti al passo anziché dietro: è l'unica traccia che non può provenire dal movimento mostrato.</p></div>}
    </div>
  );
}
