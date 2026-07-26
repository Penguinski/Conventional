import { useCallback, useRef, useState } from "react";
import type { GameProps } from "../types";
import GamePageShell from "../../components/GamePageShell";
import { prepareLogicalContext, usePointerStroke, useResponsiveCanvas, type CanvasPoint } from "../../lib/pointer-stroke";
import { analyzePath, FINISH, START, WALLS, type PathKind } from "./logic";
import "./game.css";

const WIDTH = 360;
const HEIGHT = 440;

const crossingPoint = (stroke: CanvasPoint[], wall: (typeof WALLS)[number]) => {
  const vertical = wall.x1 === wall.x2;
  return stroke.find((point) => vertical
    ? Math.abs(point.x - wall.x1) < 10 && point.y >= Math.min(wall.y1, wall.y2) && point.y <= Math.max(wall.y1, wall.y2)
    : Math.abs(point.y - wall.y1) < 10 && point.x >= Math.min(wall.x1, wall.x2) && point.x <= Math.max(wall.x1, wall.x2));
};

export default function DesirePathGame({ onProgress, onComplete }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visibleStrokeRef = useRef<CanvasPoint[]>([]);
  const [kind, setKind] = useState<PathKind | null>(null);
  const [message, setMessage] = useState("Segui il percorso. Oppure inventane uno.");

  const render = useCallback((stroke = visibleStrokeRef.current) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = prepareLogicalContext(canvas, WIDTH, HEIGHT);
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "#f7f3ea";
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.strokeStyle = "#b7aacb";
    context.lineWidth = 12;
    context.lineCap = "square";
    context.lineJoin = "miter";
    WALLS.forEach((wall) => {
      context.beginPath();
      context.moveTo(wall.x1, wall.y1);
      context.lineTo(wall.x2, wall.y2);
      context.stroke();
    });

    const analysis = stroke.length > 1 ? analyzePath(stroke) : null;
    analysis?.crossings.forEach((wallIndex) => {
      const wall = WALLS[wallIndex];
      const crossing = crossingPoint(stroke, wall);
      if (!crossing) return;
      context.fillStyle = "#f7f3ea";
      context.beginPath();
      context.arc(crossing.x, crossing.y, 17, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "#c96243";
      context.lineWidth = 2;
      context.stroke();
    });

    context.strokeStyle = "#263627";
    context.lineWidth = 4;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(5, START.y);
    context.lineTo(39, START.y);
    context.moveTo(30, START.y - 9);
    context.lineTo(39, START.y);
    context.lineTo(30, START.y + 9);
    context.stroke();

    context.beginPath();
    context.moveTo(FINISH.x - 8, FINISH.y - 8);
    context.lineTo(FINISH.x + 8, FINISH.y + 8);
    context.moveTo(FINISH.x + 8, FINISH.y - 8);
    context.lineTo(FINISH.x - 8, FINISH.y + 8);
    context.stroke();

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
    setMessage("Segui il percorso. Oppure inventane uno.");
    render([]);
  };

  const goHome = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("gioco");
    window.history.replaceState({ scroll: 0 }, "", url);
    window.dispatchEvent(new PopStateEvent("popstate", { state: { scroll: 0 } }));
  };

  const pointer = usePointerStroke({
    logicalWidth: WIDTH,
    logicalHeight: HEIGHT,
    onStart: () => {
      visibleStrokeRef.current = [];
      setKind(null);
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
    <GamePageShell
      title="Labirinto matto"
      subtitle="Trova l’uscita. O almeno prova a farlo."
      onBack={goHome}
      info={(
        <>
          <span className="maze-legend-swatch" aria-hidden="true" />
          <div className={kind ? "maze-legend-copy game-tools result-panel" : "maze-legend-copy"}>
            {kind && <span className="maze-complete-state">COMPLETATO</span>}
            <p role="status">{kind ? `Percorso ${kind} registrato. Puoi ricominciare oppure tornare ai giochi.` : message}</p>
          </div>
        </>
      )}
      secondaryAction={(
        <button className="game-page-action game-page-action-secondary" type="button" onClick={reset}>
          <span aria-hidden="true">↻</span>
          <strong>Ricomincia</strong>
        </button>
      )}
      primaryAction={(
        <button className="game-page-action game-page-action-primary" type="button" onClick={goHome}>
          <strong>Fatto</strong>
        </button>
      )}
    >
      <div className="desire-game">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          aria-label="Labirinto tattile dalla freccia alla X"
          data-testid="maze-canvas"
          {...pointer}
        />
      </div>
    </GamePageShell>
  );
}
