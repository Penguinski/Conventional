import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import GamePageShell from "../../components/GamePageShell";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import "./game.css";

type Difference = {
  id:string;
  label:string;
  note:string;
  before:[number,number];
  after:[number,number];
};

export const differences: Difference[] = [
  { id:"tazza",label:"tazza spostata",note:"Un alone circolare dice dove la tazza ha aspettato.",before:[330,265],after:[390,278] },
  { id:"cuscino",label:"cuscino schiacciato",note:"La stoffa conserva una pressione per qualche minuto.",before:[180,278],after:[205,292] },
  { id:"sedia",label:"sedia spostata",note:"Quaranta centimetri bastano a registrare un passaggio.",before:[500,285],after:[455,305] },
  { id:"cassetto",label:"cassetto aperto",note:"Aperto di poco: abbastanza per diventare indizio.",before:[120,150],after:[148,150] },
  { id:"briciole",label:"briciole",note:"Una costellazione domestica, subito destinata alla spugna.",before:[300,355],after:[300,355] },
  { id:"chiavi",label:"chiavi",note:"Un oggetto abbandonato trasforma un piano in punto d'atterraggio.",before:[430,245],after:[430,245] },
  { id:"vetro",label:"segno sul vetro",note:"Il vapore scrive in fretta e cancella da solo.",before:[510,115],after:[510,115] },
];

type Side = "before" | "after";
type Miss = { x:number; y:number; side:Side };

function RoomScene({
  after,
  found,
  selected,
  miss,
  onSelect,
  onMiss,
}:{
  after:boolean;
  found:number[];
  selected:number | null;
  miss:Miss | null;
  onSelect:(index:number)=>void;
  onMiss:(event:ReactPointerEvent<SVGSVGElement>,side:Side)=>void;
}) {
  const side: Side = after ? "after" : "before";
  const handlePointerDown = (event:ReactPointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) * 620 / Math.max(rect.width, 1);
    const y = (event.clientY - rect.top) * 420 / Math.max(rect.height, 1);
    const nearest = differences.reduce(
      (best, difference, index) => {
        const [targetX, targetY] = after ? difference.after : difference.before;
        const distance = Math.hypot(x - targetX, y - targetY);
        return distance < best.distance ? { index, distance } : best;
      },
      { index:-1, distance:Number.POSITIVE_INFINITY },
    );
    if (nearest.distance <= 46) onSelect(nearest.index);
    else onMiss(event, side);
  };

  return (
    <svg
      className="room-scene"
      viewBox="0 0 620 420"
      onPointerDown={handlePointerDown}
      aria-label={`Stanza ${after ? "dopo" : "prima"}`}
    >
      <rect width="620" height="250" fill="#90b5dd" />
      <rect y="250" width="620" height="170" fill="#d5aa71" />
      <rect x="55" y="250" width="250" height="105" rx="8" fill="#b7aacb" stroke="#263627" strokeWidth="5" />
      <ellipse cx={after ? 205 : 180} cy={after ? 292 : 278} rx="65" ry={after ? 18 : 30} fill="#f7f3ea" stroke="#263627" strokeWidth="4" />
      <g transform={`translate(${after ? 420 : 468} ${after ? 250 : 230}) rotate(${after ? -6 : 0})`}>
        <rect width="92" height="92" fill="none" stroke="#263627" strokeWidth="6" />
        <line x1="10" y1="92" x2="2" y2="152" stroke="#263627" strokeWidth="6" />
        <line x1="82" y1="92" x2="90" y2="152" stroke="#263627" strokeWidth="6" />
      </g>
      <rect x="270" y="275" width="180" height="24" fill="#263627" />
      <line x1="290" y1="299" x2="280" y2="385" stroke="#263627" strokeWidth="7" />
      <line x1="430" y1="299" x2="442" y2="385" stroke="#263627" strokeWidth="7" />
      <g transform={`translate(${after ? 380 : 320} ${after ? 258 : 245})`}>
        <circle r="18" fill="#f7f3ea" stroke="#263627" strokeWidth="4" />
        <path d="M18 -6 q22 0 16 19 q-6 13 -20 3" fill="none" stroke="#263627" strokeWidth="4" />
      </g>
      <rect x="58" y="96" width="150" height="90" fill="#c96243" stroke="#263627" strokeWidth="5" />
      <rect x={after ? 88 : 63} y="121" width="140" height="38" fill="#f7f3ea" stroke="#263627" strokeWidth="4" />
      <rect x="475" y="55" width="105" height="125" fill="rgba(247,243,234,.4)" stroke="#263627" strokeWidth="5" />
      {after && (
        <>
          {[0,1,2,3,4].map((index) => <circle key={index} cx={270 + index * 17} cy={350 + (index % 2) * 11} r="5" fill="#263627" />)}
          <path d="M412 236 l25 -10 l18 15 l-11 9 z" fill="#9f9720" stroke="#263627" strokeWidth="3" />
          <path d="M493 90 q35 -18 60 8 M505 117 q22 -11 38 5" fill="none" stroke="#f7f3ea" strokeWidth="7" strokeLinecap="round" />
        </>
      )}

      {differences.map((difference, index) => {
        const [x, y] = after ? difference.after : difference.before;
        return (
          <circle
            key={difference.id}
            className="difference-target"
            cx={x}
            cy={y}
            r="46"
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelect(index);
            }}
            aria-label={`Differenza: ${difference.label}`}
            aria-pressed={found.includes(index) || selected === index}
          />
        );
      })}

      {found.map((index) => {
        const [x, y] = after ? differences[index].after : differences[index].before;
        return (
          <g key={`found-${index}`} className="difference-found" aria-hidden="true">
            <circle cx={x} cy={y} r="32" />
            <path d={`M${x-12} ${y} l8 9 l17 -20`} />
          </g>
        );
      })}

      {selected !== null && !found.includes(selected) && (() => {
        const [x, y] = after ? differences[selected].after : differences[selected].before;
        return (
          <g className="difference-selected" aria-hidden="true">
            <circle cx={x} cy={y} r="34" />
            <path d={`M${x-11} ${y} l7 8 l16 -19`} />
          </g>
        );
      })()}

      {miss?.side === side && (
        <g className="wrong-mark" aria-hidden="true">
          <line x1={miss.x-13} y1={miss.y-13} x2={miss.x+13} y2={miss.y+13} />
          <line x1={miss.x+13} y1={miss.y-13} x2={miss.x-13} y2={miss.y+13} />
        </g>
      )}
    </svg>
  );
}

export default function SpotDifference({ saved, onProgress, onComplete }: GameProps) {
  const initiallyComplete = saved?.state === "completed";
  const [found, setFound] = useState<number[]>(() => initiallyComplete ? differences.map((_, index) => index) : []);
  const [selected, setSelected] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);
  const [view, setView] = useState<Side>("before");
  const [miss, setMiss] = useState<Miss | null>(null);
  const [feedback, setFeedback] = useState(initiallyComplete ? "Hai trovato tutte e sette le differenze." : "");
  const [done, setDone] = useState(initiallyComplete);
  const [ignoreSavedCompletion, setIgnoreSavedCompletion] = useState(false);
  const missTimerRef = useRef<number | null>(null);
  const persistedComplete = saved?.state === "completed" && !ignoreSavedCompletion;
  const isComplete = done || persistedComplete;
  const visibleFound = persistedComplete ? differences.map((_, index) => index) : found;
  const visibleFeedback = persistedComplete ? "Hai trovato tutte e sette le differenze." : feedback;
  const seconds = useActiveTimer(!isComplete);

  useEffect(() => () => {
    if (missTimerRef.current !== null) window.clearTimeout(missTimerRef.current);
  }, []);

  const select = (index:number) => {
    if (isComplete || found.includes(index)) return;
    setSelected(index);
    setMiss(null);
    setFeedback("");
  };

  const wrong = (event:ReactPointerEvent<SVGSVGElement>, side:Side) => {
    if (isComplete) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const marker = {
      x:(event.clientX - rect.left) * 620 / Math.max(rect.width, 1),
      y:(event.clientY - rect.top) * 420 / Math.max(rect.height, 1),
      side,
    };
    const nextErrors = errors + 1;
    setErrors(nextErrors);
    setMiss(marker);
    setFeedback("Qui non c’è una differenza. Prova ancora.");
    onProgress({ trovate:found.length, errori:nextErrors });
    if (missTimerRef.current !== null) window.clearTimeout(missTimerRef.current);
    missTimerRef.current = window.setTimeout(() => setMiss((current) => current === marker ? null : current), 500);
    navigator.vibrate?.(18);
  };

  const confirm = () => {
    if (isComplete || selected === null || found.includes(selected)) return;
    const next = [...found, selected];
    const selectedDifference = differences[selected];
    setFound(next);
    setSelected(null);
    setFeedback(`Trovata: ${selectedDifference.label}.`);
    onProgress({ trovate:next.length, errori:errors });
    navigator.vibrate?.(15);
    if (next.length !== differences.length) return;
    setDone(true);
    setIgnoreSavedCompletion(false);
    setFeedback("Hai trovato tutte e sette le differenze.");
    onComplete({ secondi:seconds, errori:errors, aiuti:0 });
  };

  const reset = () => {
    setFound([]);
    setSelected(null);
    setErrors(0);
    setMiss(null);
    setFeedback("");
    setDone(false);
    setIgnoreSavedCompletion(true);
    setView("before");
    if (missTimerRef.current !== null) {
      window.clearTimeout(missTimerRef.current);
      missTimerRef.current = null;
    }
  };

  const goHome = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("gioco");
    window.history.replaceState({ scroll:0 }, "", url);
    window.dispatchEvent(new PopStateEvent("popstate", { state:{ scroll:0 } }));
  };

  return (
    <GamePageShell
      title="Prima / Dopo"
      subtitle="Trova le sette differenze tra le due scene."
      onBack={goHome}
      info={(
        <div className="difference-info-grid">
          <div className="difference-info-cell">
            <span>TROVATE</span>
            <strong><em>{visibleFound.length}</em>/{differences.length}</strong>
          </div>
          <div className="difference-info-cell">
            <span>TEMPO</span>
            <strong>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</strong>
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
        <button className="game-page-action difference-complete-action" type="button" onClick={confirm} disabled={selected === null || isComplete}>
          <span aria-hidden="true">✓</span>
          <strong>Completa</strong>
        </button>
      )}
    >
      <div className="difference-game">
        <div className="difference-view-switch" aria-label="Scegli la scena da osservare">
          <button type="button" className={view === "before" ? "active" : ""} onClick={() => setView("before")}>Prima</button>
          <button type="button" className={view === "after" ? "active" : ""} onClick={() => setView("after")}>Dopo</button>
        </div>

        <div className={`room-comparison view-${view}`}>
          <div className="room-wrap room-before">
            <span>PRIMA</span>
            <RoomScene after={false} found={visibleFound} selected={selected} miss={miss} onSelect={select} onMiss={wrong} />
          </div>
          <div className="room-wrap room-after">
            <span>DOPO</span>
            <RoomScene after found={visibleFound} selected={selected} miss={miss} onSelect={select} onMiss={wrong} />
          </div>
        </div>

        {visibleFeedback && (
          <div className={`difference-feedback ${isComplete ? "game-tools result-panel" : ""}`} aria-live="polite">
            {isComplete && <span className="difference-complete-state">COMPLETATO</span>}
            <p>{visibleFeedback}</p>
          </div>
        )}
      </div>
    </GamePageShell>
  );
}
