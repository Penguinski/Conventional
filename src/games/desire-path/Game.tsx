import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../types";
import { classifyPath, type PathKind } from "./logic";
import "./game.css";

type Point = { x: number; y: number };

export default function DesirePathGame({ onProgress, onComplete }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [kind, setKind] = useState<PathKind | null>(null);

  const draw = (list: Point[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f7f3ea";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#b7aacb";
    ctx.lineWidth = 17;
    ctx.lineCap = "square";
    const walls = [
      [35, 45, 230, 45], [35, 45, 35, 190], [105, 45, 105, 250], [105, 250, 255, 250],
      [180, 45, 180, 175], [180, 175, 295, 175], [295, 70, 295, 300], [35, 320, 210, 320],
      [210, 250, 210, 370], [65, 320, 65, 405], [65, 405, 320, 405],
    ];
    walls.forEach(([x1, y1, x2, y2]) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); });
    ctx.fillStyle = "#263627";
    ctx.font = "700 23px DM Mono";
    ctx.fillText("A", 12, 28);
    ctx.fillText("×", width - 27, height - 16);
    if (list.length > 1) {
      ctx.strokeStyle = "#c96243";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = .78;
      ctx.beginPath();
      list.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  useEffect(() => { draw(points); }, [points]);
  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 360 / rect.width, y: (event.clientY - rect.top) * 440 / rect.height };
  };
  const finish = (next: Point[]) => {
    setDrawing(false);
    if (!next.length || Math.hypot(next.at(-1)!.x - 340, next.at(-1)!.y - 420) > 80) return;
    const result = classifyPath(next);
    setKind(result);
    onComplete({ percorso: result, punti: next.length });
    if (navigator.vibrate) navigator.vibrate(30);
  };

  return (
    <div className="game-panel desire-game">
      <div className="game-status"><span>PARTENZA: A</span><span>ARRIVO: ×</span><button onClick={() => { setPoints([]); setKind(null); }}>RIPROVA</button></div>
      <canvas
        ref={canvasRef}
        width={360}
        height={440}
        aria-label="Labirinto tattile da A a X"
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); const next = [pointFromEvent(event)]; setPoints(next); setDrawing(true); onProgress(); }}
        onPointerMove={(event) => { if (!drawing) return; setPoints((current) => [...current, pointFromEvent(event)]); }}
        onPointerUp={() => finish(points)}
        onPointerCancel={() => setDrawing(false)}
      />
      {points.length > 18 && !kind && <p className="editorial-beat">Il retweet fu prima una convenzione manuale degli utenti; la piattaforma lo trasformò poi in funzione.</p>}
      {points.length > 45 && !kind && <p className="editorial-beat">Anche l’hashtag nacque da una proposta d’uso prima di diventare infrastruttura cliccabile.</p>}
      {kind && <div className="result-panel"><h2>Percorso {kind}</h2><p>La tua linea resta sopra al sistema. Le tracce chiare mostrano passaggi dimostrativi precedenti.</p></div>}
    </div>
  );
}
