import { useCallback, useEffect, useRef, useState } from "react";
import type { GameProps } from "../types";
import { downloadCanvas } from "../../lib/game-utils";
import { normalizeStrokes } from "../../lib/scoring";
import "./game.css";

type Stroke = Array<{ x: number; y: number }>;

export default function DustCanvas({ onProgress, onComplete }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [brush, setBrush] = useState(28);
  const [done, setDone] = useState(false);

  const render = useCallback((all: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#334037";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#a49b7c";
    ctx.globalAlpha = .84;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brush;
    all.forEach((stroke) => {
      if (!stroke.length) return;
      ctx.beginPath();
      stroke.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
      ctx.stroke();
    });
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }, [brush]);
  useEffect(() => { render(current ? [...strokes, current] : strokes); }, [strokes, current, render]);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 720 / rect.width, y: (event.clientY - rect.top) * 520 / rect.height };
  };
  const finish = () => {
    if (!current) return;
    const next = [...strokes, current];
    setStrokes(next);
    setCurrent(null);
    onProgress({ tratti: next.length });
  };
  const complete = () => {
    setDone(true);
    const vectors = strokes.flatMap((stroke) => normalizeStrokes(stroke, 720, 520));
    onComplete({ tratti: strokes.length, punti: vectors.length, pubblicazione: "solo locale" });
  };
  return (
    <div className="game-panel dust-game">
      <div className="dust-controls game-status">
        <label>PENNELLO <input type="range" min="12" max="72" value={brush} onChange={(event) => setBrush(Number(event.target.value))} /></label>
        <button onClick={() => setStrokes((value) => value.slice(0, -1))}>ANNULLA</button>
        <button onClick={() => { setStrokes([]); setDone(false); }}>RICOMINCIA</button>
      </div>
      <canvas ref={canvasRef} width={720} height={520} aria-label="Superficie coperta di polvere da pulire con il dito"
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setCurrent([point(event)]); }}
        onPointerMove={(event) => { if (current) setCurrent((value) => value ? [...value, point(event)] : value); }}
        onPointerUp={finish} onPointerCancel={finish} />
      {strokes.length >= 2 && !done && <p className="editorial-beat">Ogni passata toglie materiale e contemporaneamente produce una figura.</p>}
      <div className="dust-actions">
        <button className="control-button primary" onClick={complete}>FINITO</button>
        <button className="control-button" onClick={() => canvasRef.current && downloadCanvas(canvasRef.current, "conventional-segno.png")}>ESPORTA PNG</button>
      </div>
      {done && <div className="result-panel"><h2>Segno conservato</h2><p>Le pennellate restano in questo browser. La galleria pubblica richiede moderazione ed è disattivata in modalità locale.</p></div>}
    </div>
  );
}
