import { useMemo, useState } from "react";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import "./game.css";

const names = ["elastico", "batteria", "scontrino", "matita", "graffetta", "candela", "moneta", "metro", "tappo", "vite", "bottone", "spago", "gomma", "chiave USB", "dado", "temperino", "cerotto", "cartolina", "biglietto", "lista", "chiave", "francobollo", "fischietto", "gettone", "fotografia"];
const relics = [
  ["biglietto", "Un biglietto del tram timbrato il giorno in cui pioveva dentro l’ombrello."],
  ["lista", "Latte, limoni, lampadina. La lampadina è rimasta qui; il resto è storia."],
  ["chiave", "Nessuno ricorda la serratura. Tutti ricordano di non aver voluto buttarla."],
];

export default function JunkDrawer({ onProgress, onComplete }: GameProps) {
  const target = relics[new Date().getDate() % relics.length];
  const [moved, setMoved] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const seconds = useActiveTimer(!done);
  const positions = useMemo(() => names.map((_, i) => ({
    left: 4 + (i * 23) % 78,
    top: 4 + (i * 37) % 78,
    rotate: (i * 17) % 42 - 21,
  })), []);
  const move = (index: number) => {
    setMoved((current) => current.includes(index) ? current : [...current, index]);
    onProgress({ mossi: moved.length + 1 });
  };
  const find = (name: string) => {
    if (name !== target[0] || moved.length < 4) return;
    setDone(true);
    onComplete({ secondi: seconds, mossi: moved.length, reperto: name });
  };
  return (
    <div className="game-panel drawer-game">
      <div className="game-status"><span>CERCA: {target[0].toUpperCase()}</span><span>{seconds}s · {moved.length} oggetti spostati</span></div>
      <div className="drawer">
        {names.map((name, index) => {
          const position = positions[index];
          const shifted = moved.includes(index);
          return <button
            key={name}
            className={`drawer-object depth-${Math.floor(index / 9)} ${shifted ? "moved" : ""} ${name === target[0] ? "relic" : ""}`}
            style={{ left: `${position.left}%`, top: `${position.top}%`, transform: `translate(${shifted ? 45 : 0}px, ${shifted ? -35 : 0}px) rotate(${position.rotate}deg)`, zIndex: shifted ? 40 : 30 - index }}
            onPointerDown={() => move(index)}
            onClick={() => find(name)}
          >{name}</button>;
        })}
      </div>
      {moved.length >= 3 && !done && <p className="editorial-beat">Gli oggetti in alto sono ancora in uso. Più scendi, più il cassetto assomiglia a un deposito archeologico senza catalogo.</p>}
      {done && <div className="result-panel"><h2>Reperto trovato</h2><p>{target[1]}</p></div>}
    </div>
  );
}
