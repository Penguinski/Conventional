import { useCallback, useRef, useState } from "react";
import type { GameProps } from "../types";
import { downloadCanvas } from "../../lib/game-utils";
import { normalizeStrokes } from "../../lib/scoring";
import { prepareLogicalContext, usePointerStroke, useResponsiveCanvas, type CanvasPoint } from "../../lib/pointer-stroke";
import "./game.css";

type Stroke = { points: CanvasPoint[]; width: number };
const WIDTH = 720;
const HEIGHT = 520;

function glassPath(context: CanvasRenderingContext2D) {
  context.beginPath();
  context.moveTo(115, 92);
  context.lineTo(605, 92);
  context.lineTo(665, 438);
  context.lineTo(55, 438);
  context.closePath();
}

function paintScene(
  context: CanvasRenderingContext2D,
  strokes: Stroke[],
  active: Stroke | null,
  cleared: boolean,
) {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = "#bf684d";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = "#263627";
  context.fillRect(0, 360, WIDTH, 160);
  context.fillStyle = "#e7d8c6";
  context.beginPath();
  context.ellipse(360, 470, 320, 70, 0, 0, Math.PI * 2);
  context.fill();

  context.save();
  glassPath(context);
  context.clip();
  context.fillStyle = "#60756d";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = "rgba(197, 185, 143, .92)";
  if (!cleared) context.fillRect(0, 0, WIDTH, HEIGHT);
  context.globalCompositeOperation = "destination-out";
  for (const stroke of [...strokes, ...(active ? [active] : [])]) {
    if (!stroke.points.length) continue;
    context.lineWidth = stroke.width;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    stroke.points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
    if (stroke.points.length === 1) {
      context.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
      context.fill();
    } else {
      context.stroke();
    }
  }
  context.restore();

  context.strokeStyle = "#f7f3ea";
  context.lineWidth = 8;
  glassPath(context);
  context.stroke();
  context.fillStyle = "rgba(255,255,255,.16)";
  context.beginPath();
  context.moveTo(140, 115);
  context.lineTo(300, 115);
  context.lineTo(250, 420);
  context.lineTo(95, 420);
  context.closePath();
  context.fill();
}

export default function DustCanvas({ onProgress, onComplete }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const activeRef = useRef<Stroke | null>(null);
  const clearedRef = useRef(false);
  const brushRef = useRef(34);
  const [brush, setBrush] = useState(34);
  const [strokeCount, setStrokeCount] = useState(0);
  const [done, setDone] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [message, setMessage] = useState("Disegna o pulisci il vetro con un gesto continuo.");

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = prepareLogicalContext(canvas, WIDTH, HEIGHT);
    paintScene(context, strokesRef.current, activeRef.current, clearedRef.current);
  }, []);

  useResponsiveCanvas(canvasRef, WIDTH, HEIGHT, render);

  const pointer = usePointerStroke({
    logicalWidth: WIDTH,
    logicalHeight: HEIGHT,
    onStart: (point) => {
      setDone(false);
      activeRef.current = { points: [point], width: brushRef.current };
      setMessage("Tratto in corso.");
    },
    onFrame: (points) => {
      activeRef.current = { points, width: brushRef.current };
      render();
    },
    onEnd: (points) => {
      if (!points.length) return;
      const stroke = { points, width: brushRef.current };
      strokesRef.current = [...strokesRef.current, stroke];
      activeRef.current = null;
      clearedRef.current = false;
      setCleared(false);
      setStrokeCount(strokesRef.current.length);
      setMessage("Tratto aggiunto.");
      render();
      onProgress({ tratti: strokesRef.current.length });
    },
    onCancel: () => {
      activeRef.current = null;
      setMessage("Tratto annullato: il disegno precedente è rimasto intatto.");
      render();
    },
  });

  const undo = () => {
    if (clearedRef.current) clearedRef.current = false;
    else strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    setDone(false);
    setCleared(clearedRef.current);
    setMessage("Ultima azione annullata.");
    render();
  };

  const restart = () => {
    strokesRef.current = [];
    activeRef.current = null;
    clearedRef.current = false;
    setCleared(false);
    setStrokeCount(0);
    setDone(false);
    setMessage("Polvere ripristinata.");
    render();
  };

  const cleanAll = () => {
    strokesRef.current = [];
    activeRef.current = null;
    clearedRef.current = true;
    setCleared(true);
    setStrokeCount(0);
    setDone(false);
    setMessage("Tutta la polvere è stata rimossa.");
    render();
    onProgress({ superficiePulita: true });
  };

  const complete = () => {
    setDone(true);
    const vectors = strokesRef.current.flatMap((stroke) => normalizeStrokes(stroke.points, WIDTH, HEIGHT));
    onComplete({ tratti: strokesRef.current.length, punti: vectors.length, superficiePulita: clearedRef.current });
  };

  const exportImage = () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = WIDTH;
    exportCanvas.height = HEIGHT;
    const context = exportCanvas.getContext("2d");
    if (!context) return;
    paintScene(context, strokesRef.current, null, clearedRef.current);
    downloadCanvas(exportCanvas, "conventional-segno.png");
  };

  return (
    <div className="game-panel dust-game">
      <div className="dust-controls game-status">
        <label>PENNELLO <input type="range" min="18" max="86" value={brush} onChange={(event) => { const value = Number(event.target.value); brushRef.current = value; setBrush(value); }} /></label>
        <span>{strokeCount} tratti</span>
        <button onClick={undo}>ANNULLA</button>
        <button onClick={restart}>RICOMINCIA</button>
      </div>
      <p className="compact-instruction" role="status">{message}</p>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        aria-label="Parabrezza coperto di polvere da pulire con il dito"
        data-testid="dust-canvas"
        {...pointer}
      />
      <div className="dust-actions">
        <button className="control-button" onClick={cleanAll}>PULISCI TUTTO</button>
        <button className="control-button primary" onClick={complete}>FINITO</button>
        <button className="control-button" onClick={exportImage}>ESPORTA PNG</button>
      </div>
      {done && <div className="result-panel"><h2>Segno conservato</h2><p>{cleared ? "Hai scelto una superficie completamente pulita." : "Il disegno e la polvere rimasta compongono lo stesso risultato esportabile."}</p></div>}
    </div>
  );
}
