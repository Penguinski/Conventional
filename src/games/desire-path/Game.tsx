import { useCallback, useRef, useState } from "react";
import type { GameProps } from "../types";
import { prepareLogicalContext, usePointerStroke, useResponsiveCanvas, type CanvasPoint } from "../../lib/pointer-stroke";
import { analyzePath, FINISH, START, WALLS, type PathKind } from "./logic";
import "./game.css";

const WIDTH = 360;
const HEIGHT = 440;

export default function DesirePathGame({ onProgress, onComplete }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visibleStrokeRef = useRef<CanvasPoint[]>([]);
  const [kind, setKind] = useState<PathKind | null>(null);
  const [message, setMessage] = useState("Parti da A e raggiungi ×. I muri si possono attraversare.");
  const [metrics, setMetrics] = useState<{ crossings: number; efficiency: number; length: number } | null>(null);

  const render = useCallback((stroke = visibleStrokeRef.current) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = prepareLogicalContext(canvas, WIDTH, HEIGHT);
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "#f7f3ea";
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.strokeStyle = "#b7aacb";
    context.lineWidth = 18;
    context.lineCap = "square";
    WALLS.forEach((wall) => {
      context.beginPath();
      context.moveTo(wall.x1, wall.y1);
      context.lineTo(wall.x2, wall.y2);
      context.stroke();
    });

    const analysis = stroke.length > 1 ? analyzePath(stroke) : null;
    analysis?.crossings.forEach((wallIndex) => {
      const wall = WALLS[wallIndex];
      const crossing = stroke.find((point) => Math.abs(point.x - wall.x1) < 18 && point.y >= Math.min(wall.y1, wall.y2) && point.y <= Math.max(wall.y1, wall.y2));
      if (!crossing) return;
      context.fillStyle = "#f7f3ea";
      context.beginPath();
      context.arc(crossing.x, crossing.y, 17, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "#c96243";
      context.lineWidth = 2;
      context.stroke();
    });

    context.fillStyle = "#263627";
    context.font = "700 22px 'DM Mono'";
    context.fillText("A", START.x - 9, START.y + 8);
    context.fillText("×", FINISH.x - 8, FINISH.y + 8);
    context.strokeStyle = "#263627";
    context.lineWidth = 2;
    context.setLineDash([4, 6]);
    context.beginPath();
    context.arc(START.x, START.y, 20, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(FINISH.x, FINISH.y, 22, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);

    if (stroke.length) {
      context.strokeStyle = "#c96243";
      context.lineWidth = 8;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.globalAlpha = .85;
      context.beginPath();
      stroke.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
      context.stroke();
      context.globalAlpha = 1;
    }
  }, []);

  useResponsiveCanvas(canvasRef, WIDTH, HEIGHT, render);

  const reset = () => {
    visibleStrokeRef.current = [];
    setKind(null);
    setMetrics(null);
    setMessage("Parti da A e raggiungi ×. I muri si possono attraversare.");
    render([]);
  };

  const pointer = usePointerStroke({
    logicalWidth: WIDTH,
    logicalHeight: HEIGHT,
    onStart: () => {
      visibleStrokeRef.current = [];
      setKind(null);
      setMetrics(null);
      onProgress({ gesto: "iniziato" });
    },
    onFrame: (stroke) => {
      visibleStrokeRef.current = stroke;
      render(stroke);
    },
    onEnd: (stroke) => {
      visibleStrokeRef.current = stroke;
      const analysis = analyzePath(stroke);
      if (!analysis.startValid) {
        setMessage("Il tratto deve partire dentro il cerchio di A.");
        return;
      }
      if (!analysis.endValid) {
        setMessage("Raggiungi il cerchio di × per concludere.");
        return;
      }
      setKind(analysis.kind);
      setMetrics({ crossings: analysis.crossings.length, efficiency: analysis.efficiency, length: analysis.length });
      setMessage("Percorso registrato.");
      onComplete({
        percorso: analysis.kind,
        muri: analysis.crossings.length,
        efficienza: Number(analysis.efficiency.toFixed(2)),
        lunghezza: Math.round(analysis.length),
      });
      navigator.vibrate?.(30);
    },
    onCancel: (stroke) => {
      visibleStrokeRef.current = stroke;
      setMessage("Tratto interrotto. Puoi ripartire da A.");
      render(stroke);
    },
  });

  return (
    <div className="game-panel desire-game">
      <div className="game-status">
        <span>PARTENZA: A · ARRIVO: ×</span>
        <button onClick={reset}>RIPROVA</button>
      </div>
      <p className="compact-instruction" role="status">{message}</p>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        aria-label="Labirinto tattile da A a X"
        data-testid="maze-canvas"
        {...pointer}
      />
      {kind && metrics && (
        <div className="result-panel">
          <h2>Percorso {kind}</h2>
          <p>{metrics.crossings} muri attraversati · efficienza {Math.round(metrics.efficiency * 100)}% · {Math.round(metrics.length)} unità.</p>
          <p>{kind === "ufficiale" ? "Hai seguito i varchi previsti." : kind === "scorciatoia" ? "Hai trasformato i muri in materiale attraversabile." : "Hai alternato regola e deviazione."}</p>
        </div>
      )}
    </div>
  );
}
