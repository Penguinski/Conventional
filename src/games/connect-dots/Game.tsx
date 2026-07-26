import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import GamePageShell from "../../components/GamePageShell";
import type { GameProps } from "../types";
import { dots } from "./logic";
import "./game.css";

type Point = { x:number; y:number };

const clamp = (value:number) => Math.max(0, Math.min(100, value));

export default function ConnectDots({ onProgress, onComplete }: GameProps) {
  const lineRef = useRef<SVGPolylineElement>(null);
  const pathRef = useRef<Point[]>([]);
  const pointerRef = useRef<number | null>(null);
  const nextRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const [next, setNext] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState("");

  const draw = () => {
    frameRef.current = null;
    lineRef.current?.setAttribute("points", pathRef.current.map((point) => `${point.x},${point.y}`).join(" "));
  };

  const schedule = () => {
    if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(draw);
  };

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  const point = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) * 100 / Math.max(rect.width, 1)),
      y: clamp((event.clientY - rect.top) * 100 / Math.max(rect.height, 1)),
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
    setFeedback("");
    onProgress({ punti: index + 1 });
    navigator.vibrate?.(12);
  };

  const releasePointer = (element: HTMLDivElement, pointerId:number) => {
    pointerRef.current = null;
    if (!element.hasPointerCapture(pointerId)) return;
    try {
      element.releasePointerCapture(pointerId);
    } catch {
      // The browser may already have released an interrupted pointer.
    }
  };

  const start = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== null || done || nextRef.current >= dots.length) return;
    event.preventDefault();
    const current = point(event);
    if (nextRef.current === 0 && Math.hypot(current.x - dots[0][0], current.y - dots[0][1]) > 13) {
      setFeedback("Inizia dal punto 1.");
      return;
    }

    pointerRef.current = event.pointerId;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointers can still complete through the normal React lifecycle.
    }
    pathRef.current.push(current);
    snap(current);
    schedule();
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== event.pointerId || done || nextRef.current >= dots.length) return;
    event.preventDefault();
    const current = point(event);
    pathRef.current.push(current);
    snap(current);
    schedule();
  };

  const stop = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== event.pointerId) return;
    if (nextRef.current < dots.length) {
      const current = point(event);
      pathRef.current.push(current);
      snap(current);
    }
    releasePointer(event.currentTarget, event.pointerId);
    schedule();
  };

  const cancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== event.pointerId) return;
    releasePointer(event.currentTarget, event.pointerId);
    setFeedback(`Gesto interrotto. Riprendi dal punto ${nextRef.current + 1}.`);
  };

  const choose = (index:number) => {
    if (done || index < nextRef.current) return;
    if (index !== nextRef.current) {
      setFeedback(`Segui l’ordine: ora devi collegare il punto ${nextRef.current + 1}.`);
      return;
    }
    const [x, y] = dots[index];
    pathRef.current.push({ x, y });
    snap({ x, y });
    draw();
  };

  const reset = () => {
    pathRef.current = [];
    nextRef.current = 0;
    pointerRef.current = null;
    setNext(0);
    setDone(false);
    setFeedback("");
    draw();
  };

  const complete = () => {
    if (done || nextRef.current !== dots.length) return;
    setDone(true);
    setFeedback("La linea personale è completa.");
    onComplete({ punti: dots.length, forma: "impronta", gestoContinuo: true });
    navigator.vibrate?.(25);
  };

  const goHome = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("gioco");
    window.history.replaceState({ scroll: 0 }, "", url);
    window.dispatchEvent(new PopStateEvent("popstate", { state: { scroll: 0 } }));
  };

  const ready = next === dots.length;

  return (
    <GamePageShell
      title="Collega i punti"
      subtitle="Unisci i punti in ordine numerico e scopri cosa si nasconde."
      onBack={goHome}
      info={(
        <div className="dots-info-grid">
          <div className="dots-info-cell">
            <span>PROGRESSO</span>
            <strong><em>{next}</em>/{dots.length}</strong>
          </div>
          <div className="dots-info-cell dots-objective">
            <span>OBIETTIVO</span>
            <strong>Collega tutti i punti</strong>
          </div>
        </div>
      )}
      secondaryAction={(
        <button className="game-page-action game-page-action-secondary" type="button" onClick={reset}>
          <span className="dots-eraser" aria-hidden="true" />
          <strong>Cancella</strong>
        </button>
      )}
      primaryAction={(
        <button className="game-page-action dots-complete-action" type="button" onClick={complete} disabled={!ready || done}>
          <span aria-hidden="true">✓</span>
          <strong>Completa</strong>
        </button>
      )}
    >
      <div className="dots-game">
        <div
          className="dots-board"
          aria-label="Collega i punti in ordine"
          onPointerDownCapture={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerCancel={cancel}
          onLostPointerCapture={(event) => {
            if (pointerRef.current !== event.pointerId) return;
            pointerRef.current = null;
            setFeedback(`Gesto interrotto. Riprendi dal punto ${nextRef.current + 1}.`);
          }}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline ref={lineRef} className="personal-line" />
            {done && [1, 2].map((offset) => (
              <polyline
                className="echo"
                key={offset}
                transform={`translate(${offset * .55} ${offset * -.35})`}
                points={dots.map(([x, y]) => `${x},${y}`).join(" ")}
              />
            ))}
          </svg>
          {dots.map(([x, y], index) => (
            <button
              key={index}
              type="button"
              style={{ left:`${x}%`, top:`${y}%` }}
              className={index < next ? "connected" : index === next ? "current" : ""}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                choose(index);
              }}
              aria-label={`Punto ${index + 1}`}
              aria-pressed={index < next}
            >
              <span aria-hidden="true">{index + 1}</span>
            </button>
          ))}
        </div>

        {feedback && (
          <div className={`dots-feedback ${done ? "game-tools result-panel" : ""}`} aria-live="polite">
            {done && <span className="dots-complete-state">COMPLETATO</span>}
            <p>{feedback}</p>
          </div>
        )}
      </div>
    </GamePageShell>
  );
}
