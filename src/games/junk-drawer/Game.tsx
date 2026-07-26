import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import GamePageShell from "../../components/GamePageShell";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import "./game.css";

type DrawerKind = "bar" | "disk" | "loop" | "paper" | "key" | "ticket" | "list" | "clip" | "notebook" | "scissors";

type DrawerObject = {
  id: string;
  label: string;
  kind: DrawerKind;
  x: number;
  y: number;
  z: number;
  rotate: number;
};

const TARGET = "clip";
const TARGET_POSITIONS = [
  { x: 43, y: 43, rotate: -12 },
  { x: 58, y: 34, rotate: 24 },
  { x: 31, y: 57, rotate: -28 },
];

const CLUTTER: DrawerObject[] = [
  { id:"clip", label:"fermaglio", kind:"clip", x:43, y:43, z:1, rotate:-12 },
  { id:"notebook", label:"taccuino", kind:"notebook", x:5, y:5, z:8, rotate:-8 },
  { id:"keys", label:"mazzo di chiavi", kind:"key", x:21, y:7, z:9, rotate:28 },
  { id:"pencil", label:"matita", kind:"bar", x:37, y:10, z:10, rotate:-25 },
  { id:"glue", label:"tubetto di colla", kind:"bar", x:59, y:8, z:11, rotate:49 },
  { id:"blue-coin", label:"gettone blu", kind:"disk", x:76, y:13, z:12, rotate:0 },
  { id:"ticket", label:"biglietto del cinema", kind:"ticket", x:53, y:27, z:13, rotate:7 },
  { id:"binder", label:"molletta nera", kind:"paper", x:76, y:29, z:14, rotate:4 },
  { id:"scissors", label:"forbici", kind:"scissors", x:31, y:42, z:15, rotate:18 },
  { id:"cord", label:"spago", kind:"loop", x:3, y:37, z:16, rotate:-18 },
  { id:"receipt", label:"vecchio scontrino", kind:"list", x:18, y:27, z:17, rotate:11 },
  { id:"ruler", label:"righello", kind:"bar", x:49, y:58, z:18, rotate:9 },
  { id:"brass-key", label:"chiave lunga", kind:"key", x:69, y:54, z:19, rotate:-28 },
  { id:"eraser", label:"gomma", kind:"paper", x:39, y:69, z:20, rotate:15 },
  { id:"button", label:"bottone", kind:"disk", x:78, y:70, z:21, rotate:0 },
  { id:"stamp", label:"francobollo", kind:"ticket", x:4, y:68, z:22, rotate:-6 },
  { id:"battery", label:"batteria", kind:"bar", x:20, y:72, z:23, rotate:79 },
  { id:"rubber-band", label:"elastico", kind:"loop", x:61, y:69, z:24, rotate:12 },
];

type Position = { x: number; y: number; z: number };

export default function JunkDrawer({ onProgress, onComplete }: GameProps) {
  const layout = useMemo(() => {
    const placement = TARGET_POSITIONS[new Date().getDate() % TARGET_POSITIONS.length];
    return {
      target: TARGET,
      story: "Il fermaglio era quasi scomparso sotto gli oggetti spostati e accumulati nel tempo.",
      objects: CLUTTER.map((item) => item.id === TARGET ? { ...item, ...placement } : item),
    };
  }, []);
  const [positions, setPositions] = useState<Record<string, Position>>(() => Object.fromEntries(layout.objects.map((item) => [item.id, { x:item.x, y:item.y, z:item.z }])));
  const positionsRef = useRef(positions);
  const dragRef = useRef<{ id:string; pointerId:number; startX:number; startY:number; originX:number; originY:number; moved:number } | null>(null);
  const zRef = useRef(30);
  const [movedCount, setMovedCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [done, setDone] = useState(false);
  const seconds = useActiveTimer(!done);
  const target = layout.objects.find((item) => item.id === layout.target)!;

  const setLivePosition = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const drawer = event.currentTarget.parentElement;
    if (!drag || drag.pointerId !== event.pointerId || !drawer) return null;
    const rect = drawer.getBoundingClientRect();
    const dx = (event.clientX - drag.startX) / Math.max(rect.width, 1) * 100;
    const dy = (event.clientY - drag.startY) / Math.max(rect.height, 1) * 100;
    const next = {
      x: Math.max(2, Math.min(82, drag.originX + dx)),
      y: Math.max(2, Math.min(80, drag.originY + dy)),
      z: zRef.current,
    };
    drag.moved = Math.max(drag.moved, Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY));
    event.currentTarget.style.left = `${next.x}%`;
    event.currentTarget.style.top = `${next.y}%`;
    return next;
  };

  const start = (event: ReactPointerEvent<HTMLButtonElement>, item: DrawerObject) => {
    if (done) return;
    const position = positionsRef.current[item.id];
    zRef.current += 1;
    event.currentTarget.style.zIndex = String(zRef.current);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id:item.id, pointerId:event.pointerId, startX:event.clientX, startY:event.clientY, originX:position.x, originY:position.y, moved:0 };
  };

  const end = (event: ReactPointerEvent<HTMLButtonElement>, item: DrawerObject) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const next = setLivePosition(event) ?? positionsRef.current[item.id];
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    const updated = { ...positionsRef.current, [item.id]: next };
    positionsRef.current = updated;
    setPositions(updated);

    if (drag.moved >= 5) {
      const nextMoved = movedCount + 1;
      setMovedCount(nextMoved);
      onProgress({ mossi: nextMoved });
      return;
    }

    setSelected(item.id);
    setLastWrong(null);
    setFeedback("");
  };

  const confirm = () => {
    if (done) return;
    if (!selected) {
      setFeedback("Seleziona un oggetto prima di confermare.");
      return;
    }
    if (selected === layout.target) {
      setDone(true);
      setFeedback(layout.story);
      onComplete({ secondi: seconds, mossi: movedCount, reperto: target.label });
      navigator.vibrate?.(25);
      return;
    }
    setLastWrong(selected);
    setFeedback("Non è l’oggetto richiesto. Puoi cambiare scelta e provare ancora.");
    onProgress({ mossi: movedCount });
    navigator.vibrate?.(18);
  };

  const reset = () => {
    const original = Object.fromEntries(layout.objects.map((item) => [item.id, { x:item.x, y:item.y, z:item.z }]));
    positionsRef.current = original;
    setPositions(original);
    setMovedCount(0);
    setSelected(null);
    setLastWrong(null);
    setFeedback("");
    setDone(false);
  };

  const goHome = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("gioco");
    window.history.replaceState({ scroll: 0 }, "", url);
    window.dispatchEvent(new PopStateEvent("popstate", { state: { scroll: 0 } }));
  };

  return (
    <GamePageShell
      title="Il cassetto disordinato"
      subtitle="Trova l’oggetto richiesto in questo gran caos."
      onBack={goHome}
      info={(
        <div className="drawer-info-grid">
          <div className="drawer-target">
            <span className="drawer-info-label">OGGETTO DA TROVARE</span>
            <span className="drawer-target-icon" aria-hidden="true" />
            <strong className="drawer-target-name">{target.label}</strong>
          </div>
          <div className="drawer-state">
            <span className="drawer-info-label">STATO</span>
            <strong>{done ? "1/1 trovato" : "0/1 trovato"}</strong>
          </div>
        </div>
      )}
      secondaryAction={(
        <button className="game-page-action game-page-action-secondary" type="button" onClick={reset}>
          <span aria-hidden="true">↻</span>
          <strong>Ricomincia</strong>
        </button>
      )}
      primaryAction={(
        <button className="game-page-action drawer-confirm-action" type="button" onClick={confirm} disabled={!selected || done}>
          <strong>Trovato!</strong>
        </button>
      )}
    >
      <div className="drawer-game">
        <div className="drawer" aria-label="Cassetto pieno di oggetti sovrapposti">
          {layout.objects.map((item) => {
            const position = positions[item.id];
            const selectedObject = selected === item.id;
            const wrongObject = lastWrong === item.id;
            const foundObject = done && item.id === layout.target;
            return (
              <button
                key={item.id}
                className={[
                  "drawer-object",
                  `shape-${item.kind}`,
                  `item-${item.id}`,
                  selectedObject ? "selected" : "",
                  wrongObject ? "wrong" : "",
                  foundObject ? "found" : "",
                ].filter(Boolean).join(" ")}
                style={{ left:`${position.x}%`, top:`${position.y}%`, zIndex:position.z, rotate:`${item.rotate}deg` }}
                aria-label={item.label}
                aria-pressed={selectedObject}
                disabled={done}
                onPointerDown={(event) => start(event, item)}
                onPointerMove={setLivePosition}
                onPointerUp={(event) => end(event, item)}
                onPointerCancel={(event) => end(event, item)}
                onLostPointerCapture={() => { dragRef.current = null; }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  setSelected(item.id);
                  setLastWrong(null);
                  setFeedback("");
                }}
              >
                <span aria-hidden="true" />
              </button>
            );
          })}
        </div>
        {feedback && (
          <div className={`drawer-feedback ${done ? "game-tools result-panel" : ""}`} aria-live="polite">
            {done && <span className="drawer-complete-state">COMPLETATO</span>}
            <p>{feedback}</p>
          </div>
        )}
      </div>
    </GamePageShell>
  );
}
