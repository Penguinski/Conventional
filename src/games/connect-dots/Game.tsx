import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { GameProps } from "../types";
import { dots } from "./logic";
import "./game.css";

type Point = { x:number; y:number };

export default function ConnectDots({ onProgress, onComplete }: GameProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPolylineElement>(null);
  const pathRef = useRef<Point[]>([]);
  const pointerRef = useRef<number | null>(null);
  const nextRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const [next, setNext] = useState(0);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("Parti dal punto 1 e continua con un solo gesto.");

  const draw = () => {
    frameRef.current = null;
    lineRef.current?.setAttribute("points", pathRef.current.map((point) => `${point.x},${point.y}`).join(" "));
  };
  const schedule = () => {
    if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(draw);
  };
  useEffect(() => () => { if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current); }, []);

  const point = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * 100 / Math.max(rect.width, 1),
      y: (event.clientY - rect.top) * 100 / Math.max(rect.height, 1),
    };
  };

  const snap = (current: Point) => {
    const index = nextRef.current;
    if (index >= dots.length) return;
    const [x, y] = dots[index];
    if (Math.hypot(current.x - x, current.y - y) > 11) return;
    pathRef.current.push({ x, y });
    nextRef.current = index + 1;
    setNext(index + 1);
    setMessage(index + 1 === dots.length ? "Impronta completata." : `Punto ${index + 1} agganciato.`);
    onProgress({ punti: index + 1 });
    navigator.vibrate?.(12);
    if (index + 1 === dots.length) {
      setDone(true);
      onComplete({ punti: dots.length, forma: "impronta", gestoContinuo: true });
    }
  };

  const start = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== null || done) return;
    event.preventDefault();
    const current = point(event);
    if (nextRef.current === 0 && Math.hypot(current.x - dots[0][0], current.y - dots[0][1]) > 13) {
      setMessage("Inizia vicino al punto 1.");
      return;
    }
    pointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    pathRef.current.push(current);
    snap(current);
    schedule();
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== event.pointerId || done) return;
    event.preventDefault();
    const current = point(event);
    pathRef.current.push(current);
    snap(current);
    schedule();
  };

  const stop = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== event.pointerId) return;
    const current = point(event);
    pathRef.current.push(current);
    snap(current);
    pointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    schedule();
    if (!done && nextRef.current < dots.length) setMessage(`Continua dal punto ${nextRef.current + 1}.`);
  };

  const cancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    setMessage(`Gesto interrotto. Riprendi dal punto ${nextRef.current + 1}.`);
  };

  const choose = (index:number) => {
    if (index !== nextRef.current || done) return;
    const [x,y] = dots[index];
    pathRef.current.push({x,y});
    snap({x,y});
    draw();
  };

  const reset = () => {
    pathRef.current = [];
    nextRef.current = 0;
    setNext(0);
    setDone(false);
    setMessage("Parti dal punto 1 e continua con un solo gesto.");
    draw();
  };

  return (
    <div className="game-panel dots-game">
      <div className="game-status"><span>PROSSIMO: {Math.min(next + 1, dots.length)}</span><button onClick={reset}>RIPROVA</button></div>
      <p className="compact-instruction" role="status">{message}</p>
      <div
        className="dots-board"
        ref={boardRef}
        aria-label="Collega i punti in ordine con un gesto continuo"
        onPointerDownCapture={start}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={cancel}
        onLostPointerCapture={(event) => { if (pointerRef.current === event.pointerId) { pointerRef.current = null; setMessage(`Riprendi dal punto ${nextRef.current + 1}.`); } }}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <polyline ref={lineRef} className="personal-line" />
          {done && [1, 2, 3].map((offset) => <polyline className="echo" key={offset} transform={`translate(${offset * .7} ${offset * -.4})`} points={dots.map(([x, y]) => `${x},${y}`).join(" ")} />)}
        </svg>
        {dots.map(([x, y], index) => <button key={index} style={{ left:`${x}%`, top:`${y}%` }} className={index < next ? "done" : index === next ? "current" : ""} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); choose(index); }} aria-label={`Punto ${index + 1}`}>{index + 1}</button>)}
      </div>
      {done && <div className="result-panel"><h2>Impronta</h2><p>La linea personale resta visibile; le eco mostrano come un gesto ripetuto diventa forma comune.</p></div>}
    </div>
  );
}
