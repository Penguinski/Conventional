import { useState } from "react";
import type { GameProps } from "../types";
import "./game.css";

const dots = [
  [50, 18], [31, 23], [18, 38], [15, 58], [26, 76], [45, 88], [66, 83],
  [82, 69], [87, 48], [76, 30], [62, 35], [65, 53], [55, 66], [40, 60], [38, 44],
];

export default function ConnectDots({ onProgress, onComplete }: GameProps) {
  const [next, setNext] = useState(0);
  const choose = (index: number) => {
    if (index !== next) return;
    const value = next + 1;
    setNext(value);
    onProgress({ punti: value });
    if (value === dots.length) {
      onComplete({ punti: value, forma: "impronta" });
      if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    }
  };
  return (
    <div className="game-panel dots-game">
      <div className="game-status"><span>PROSSIMO: {Math.min(next + 1, dots.length)}</span><button onClick={() => setNext(0)}>RIPRISTINA</button></div>
      <div className="dots-board" aria-label="Collega i punti in ordine">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          {next > 1 && <polyline points={dots.slice(0, next).map(([x, y]) => `${x},${y}`).join(" ")} />}
          {next === dots.length && [1, 2, 3].map((offset) => <polyline className="echo" key={offset} transform={`translate(${offset * .7} ${offset * -.4})`} points={dots.map(([x, y]) => `${x},${y}`).join(" ")} />)}
        </svg>
        {dots.map(([x, y], index) => <button key={index} style={{ left: `${x}%`, top: `${y}%` }} className={index < next ? "done" : index === next ? "current" : ""} onClick={() => choose(index)} aria-label={`Punto ${index + 1}`}>{index + 1}</button>)}
      </div>
      {next >= 6 && next < dots.length && <p className="editorial-beat">La linea non deve essere perfetta. La tolleranza del gesto è parte della figura.</p>}
      {next === dots.length && <div className="result-panel"><h2>Impronta</h2><p>La tua deviazione resta visibile. Le linee più chiare mostrano come il gesto si accumula.</p></div>}
    </div>
  );
}
