import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import "./game.css";

type DrawerObject = {
  id: string;
  label: string;
  kind: "bar" | "disk" | "loop" | "paper" | "key" | "ticket" | "list";
  x: number;
  y: number;
  z: number;
  rotate: number;
};

const layouts: Array<{ target: string; story: string; objects: DrawerObject[] }> = [
  {
    target: "ticket",
    story: "Un biglietto del tram timbrato il giorno in cui pioveva dentro l'ombrello.",
    objects: [
      { id:"ticket",label:"biglietto",kind:"ticket",x:36,y:42,z:1,rotate:-8 },
      { id:"cord",label:"spago",kind:"loop",x:31,y:34,z:8,rotate:18 },
      { id:"pencil",label:"matita",kind:"bar",x:24,y:45,z:10,rotate:-17 },
      { id:"coin",label:"moneta",kind:"disk",x:47,y:39,z:11,rotate:0 },
      { id:"paper",label:"scontrino",kind:"paper",x:40,y:32,z:12,rotate:12 },
      { id:"battery",label:"batteria",kind:"bar",x:55,y:50,z:13,rotate:31 },
      { id:"band",label:"elastico",kind:"loop",x:35,y:51,z:14,rotate:-21 },
      { id:"button",label:"bottone",kind:"disk",x:62,y:31,z:15,rotate:0 },
    ],
  },
  {
    target: "list",
    story: "Latte, limoni, lampadina. La lampadina è rimasta qui; il resto è storia.",
    objects: [
      { id:"list",label:"lista",kind:"list",x:42,y:38,z:1,rotate:5 },
      { id:"key-a",label:"chiave corta",kind:"key",x:36,y:45,z:9,rotate:-20 },
      { id:"paper-a",label:"cartolina",kind:"paper",x:32,y:31,z:10,rotate:9 },
      { id:"pencil-a",label:"matita",kind:"bar",x:48,y:49,z:11,rotate:-34 },
      { id:"coin-a",label:"gettone",kind:"disk",x:54,y:35,z:12,rotate:0 },
      { id:"cord-a",label:"spago",kind:"loop",x:42,y:29,z:13,rotate:17 },
      { id:"battery-a",label:"batteria",kind:"bar",x:63,y:49,z:14,rotate:14 },
      { id:"button-a",label:"bottone",kind:"disk",x:25,y:52,z:15,rotate:0 },
    ],
  },
  {
    target: "key",
    story: "Nessuno ricorda la serratura. Tutti ricordano di non aver voluto buttarla.",
    objects: [
      { id:"key",label:"chiave",kind:"key",x:40,y:43,z:1,rotate:16 },
      { id:"ticket-b",label:"francobollo",kind:"ticket",x:35,y:36,z:8,rotate:-11 },
      { id:"paper-b",label:"fotografia",kind:"paper",x:44,y:31,z:9,rotate:18 },
      { id:"bar-b",label:"metro",kind:"bar",x:26,y:47,z:10,rotate:-28 },
      { id:"disk-b",label:"moneta",kind:"disk",x:49,y:47,z:11,rotate:0 },
      { id:"loop-b",label:"elastico",kind:"loop",x:38,y:50,z:12,rotate:6 },
      { id:"bar-c",label:"batteria",kind:"bar",x:58,y:35,z:13,rotate:34 },
      { id:"disk-c",label:"tappo",kind:"disk",x:59,y:51,z:14,rotate:0 },
    ],
  },
];

type Position = { x: number; y: number; z: number };

export default function JunkDrawer({ onProgress, onComplete }: GameProps) {
  const layout = useMemo(() => layouts[new Date().getDate() % layouts.length], []);
  const [positions, setPositions] = useState<Record<string, Position>>(() => Object.fromEntries(layout.objects.map((item) => [item.id, { x:item.x, y:item.y, z:item.z }])));
  const positionsRef = useRef(positions);
  const dragRef = useRef<{ id:string; pointerId:number; startX:number; startY:number; originX:number; originY:number; moved:number } | null>(null);
  const zRef = useRef(30);
  const [movedCount, setMovedCount] = useState(0);
  const [done, setDone] = useState(false);
  const seconds = useActiveTimer(!done);

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
      setMovedCount((value) => value + 1);
      onProgress({ mossi: movedCount + 1 });
    }
    if (item.id === layout.target && drag.moved < 9) {
      setDone(true);
      onComplete({ secondi: seconds, mossi: movedCount, reperto: item.label });
      navigator.vibrate?.(25);
    }
  };

  const reset = () => {
    const original = Object.fromEntries(layout.objects.map((item) => [item.id, { x:item.x, y:item.y, z:item.z }]));
    positionsRef.current = original;
    setPositions(original);
    setMovedCount(0);
    setDone(false);
  };

  return (
    <div className="game-panel drawer-game">
      <div className="game-status">
        <span>CERCA: {layout.objects.find((item) => item.id === layout.target)!.label.toUpperCase()}</span>
        <span>{seconds}s · {movedCount} spostamenti</span>
        <button onClick={reset}>RIPROVA</button>
      </div>
      <p className="compact-instruction">Trascina liberamente le forme. Il reperto può essere scelto appena emerge dalla sovrapposizione.</p>
      <div className="drawer">
        {layout.objects.map((item) => {
          const position = positions[item.id];
          return (
            <button
              key={item.id}
              className={`drawer-object shape-${item.kind}`}
              style={{ left:`${position.x}%`, top:`${position.y}%`, zIndex:position.z, rotate:`${item.rotate}deg` }}
              aria-label={item.label}
              onPointerDown={(event) => start(event, item)}
              onPointerMove={setLivePosition}
              onPointerUp={(event) => end(event, item)}
              onPointerCancel={(event) => end(event, item)}
              onLostPointerCapture={() => { dragRef.current = null; }}
              onKeyDown={(event) => {
                if (item.id === layout.target && (event.key === "Enter" || event.key === " ")) {
                  setDone(true);
                  onComplete({ secondi: seconds, mossi: movedCount, reperto: item.label });
                }
              }}
            ><span aria-hidden="true" /></button>
          );
        })}
      </div>
      {done && <div className="result-panel"><h2>Reperto trovato</h2><p>{layout.story}</p></div>}
    </div>
  );
}
