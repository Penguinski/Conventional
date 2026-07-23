import { useState, type PointerEvent as ReactPointerEvent } from "react";
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

function RoomScene({
  after,
  found,
  miss,
  onCorrect,
  onMiss,
}:{
  after:boolean;
  found:number[];
  miss:{x:number;y:number;side:"before"|"after"}|null;
  onCorrect:(index:number)=>void;
  onMiss:(event:ReactPointerEvent<SVGSVGElement>,side:"before"|"after")=>void;
}) {
  const side = after ? "after" : "before";
  return (
    <svg className="room-scene" viewBox="0 0 620 420" onPointerDown={(event) => onMiss(event, side)} aria-label={`Stanza ${after ? "dopo" : "prima"}`}>
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
      {after && <>
        {[0,1,2,3,4].map((index) => <circle key={index} cx={270 + index * 17} cy={350 + (index % 2) * 11} r="5" fill="#263627" />)}
        <path d="M412 236 l25 -10 l18 15 l-11 9 z" fill="#9f9720" stroke="#263627" strokeWidth="3" />
        <path d="M493 90 q35 -18 60 8 M505 117 q22 -11 38 5" fill="none" stroke="#f7f3ea" strokeWidth="7" strokeLinecap="round" />
      </>}
      {differences.map((difference,index) => {
        const [x,y] = after ? difference.after : difference.before;
        return <circle key={difference.id} className="difference-target" cx={x} cy={y} r="28" onPointerDown={(event) => { event.stopPropagation(); onCorrect(index); }} aria-label={`Differenza: ${difference.label}`} />;
      })}
      {found.map((index) => {
        const [x,y] = after ? differences[index].after : differences[index].before;
        return <circle key={`mark-${index}`} className="difference-found" cx={x} cy={y} r="24" />;
      })}
      {miss?.side === side && <g className="wrong-mark"><line x1={miss.x-13} y1={miss.y-13} x2={miss.x+13} y2={miss.y+13}/><line x1={miss.x+13} y1={miss.y-13} x2={miss.x-13} y2={miss.y+13}/></g>}
    </svg>
  );
}

export default function SpotDifference({ onProgress, onComplete }: GameProps) {
  const [found, setFound] = useState<number[]>([]);
  const [errors, setErrors] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<"both"|"before"|"after">("both");
  const [miss, setMiss] = useState<{x:number;y:number;side:"before"|"after"}|null>(null);
  const [lastNote, setLastNote] = useState("");
  const seconds = useActiveTimer(found.length < differences.length);

  const choose = (index:number) => {
    if (found.includes(index)) return;
    const next = [...found,index];
    setFound(next);
    setLastNote(differences[index].note);
    onProgress({ trovate:next.length,errori:errors });
    navigator.vibrate?.(15);
    if (next.length === differences.length) onComplete({ secondi:seconds,errori:errors,aiuti:0 });
  };

  const wrong = (event:ReactPointerEvent<SVGSVGElement>,side:"before"|"after") => {
    const rect=event.currentTarget.getBoundingClientRect();
    const marker={x:(event.clientX-rect.left)*620/rect.width,y:(event.clientY-rect.top)*420/rect.height,side};
    setErrors((value)=>value+1);
    setMiss(marker);
    window.setTimeout(()=>setMiss((current)=>current===marker?null:current),500);
  };

  const reset=()=>{setFound([]);setErrors(0);setMiss(null);setLastNote("");setZoom(1);setView("both");};

  return (
    <div className="game-panel difference-game">
      <div className="game-status">
        <label>ZOOM <input type="range" min="1" max="1.65" step=".05" value={zoom} onChange={(event)=>setZoom(Number(event.target.value))}/></label>
        <span>{found.length}/7 · {seconds}s · {errors} errori</span>
        <button onClick={reset}>RIPROVA</button>
      </div>
      <div className="view-switch"><button onClick={()=>setView("before")}>PRIMA</button><button onClick={()=>setView("both")}>AFFIANCATE</button><button onClick={()=>setView("after")}>DOPO</button></div>
      <p className="compact-instruction">Tocca una differenza in una delle due scene; il segno comparirà su entrambe.</p>
      <div className={`room-comparison view-${view}`}>
        {view!=="after"&&<div className="room-wrap"><span>PRIMA</span><div className="room-zoom" style={{width:`${620*zoom}px`,height:`${420*zoom}px`}}><div style={{transform:`scale(${zoom})`}}><RoomScene after={false} found={found} miss={miss} onCorrect={choose} onMiss={wrong}/></div></div></div>}
        {view!=="before"&&<div className="room-wrap"><span>DOPO</span><div className="room-zoom" style={{width:`${620*zoom}px`,height:`${420*zoom}px`}}><div style={{transform:`scale(${zoom})`}}><RoomScene after found={found} miss={miss} onCorrect={choose} onMiss={wrong}/></div></div></div>}
      </div>
      {lastNote&&<p className="editorial-beat">{lastNote}</p>}
      {found.length===differences.length&&<div className="result-panel"><h2>Passaggio ricostruito</h2><p>Sette differenze, tutte prodotte da un'azione interrotta o appena conclusa.</p></div>}
    </div>
  );
}
