import { useState } from "react";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import { dishClues, dishSuspects, evaluateAccusation } from "./logic";
import "./game.css";

export default function DishMystery({ onProgress, onComplete }: GameProps) {
  const [seen,setSeen]=useState<string[]>([]);
  const [activeClue,setActiveClue]=useState<string|null>(null);
  const [attempts,setAttempts]=useState(0);
  const [message,setMessage]=useState("");
  const [done,setDone]=useState(false);
  const seconds=useActiveTimer(!done);

  const inspect=(id:string)=>{
    const next=seen.includes(id)?seen:[...seen,id];
    setSeen(next);
    setActiveClue(id);
    onProgress({indizi:next.length});
  };

  const accuse=(suspect:string)=>{
    if(done)return;
    const result=evaluateAccusation(suspect,seen);
    const nextAttempts=attempts+1;
    setAttempts(nextAttempts);
    setMessage(result.message);
    if(result.solved){
      setDone(true);
      onComplete({primoTentativo:nextAttempts===1,secondi:seconds,indizi:seen.length});
    }
  };

  const reset=()=>{setSeen([]);setActiveClue(null);setAttempts(0);setMessage("");setDone(false);};
  const clue=dishClues.find((item)=>item.id===activeClue);

  return (
    <div className="game-panel mystery-game">
      <div className="game-status"><span>{seen.length}/5 INDIZI · {seconds}s · {attempts} accuse</span><button onClick={reset}>RIPROVA</button></div>
      <p className="compact-instruction">Domanda: chi ha cucinato la salsa e ha lasciato la padella? Ispeziona la mappa o accusa subito.</p>
      <div className="kitchen-map" aria-label="Mappa geometrica della cucina">
        <svg viewBox="0 0 100 80" aria-hidden="true">
          <rect x="4" y="4" width="92" height="72" fill="#90b5dd" stroke="#263627" />
          <rect x="36" y="14" width="42" height="26" fill="#c96243" stroke="#263627" />
          <circle cx="45" cy="28" r="7" fill="#263627" /><circle cx="64" cy="28" r="7" fill="#263627" />
          <rect x="62" y="52" width="29" height="18" fill="#f7f3ea" stroke="#263627" />
          <rect x="10" y="55" width="24" height="14" fill="#9f9720" stroke="#263627" />
          <circle cx="31" cy="42" r="8" fill="#b7aacb" stroke="#263627" />
        </svg>
        {dishClues.map((item)=><button key={item.id} className={seen.includes(item.id)?"seen":""} style={{left:`${item.x}%`,top:`${item.y}%`}} onClick={()=>inspect(item.id)} aria-label={`Ispeziona ${item.title}`}><span>{seen.includes(item.id)?"✓":"+"}</span></button>)}
      </div>
      {clue&&<section className="clue-detail" aria-live="polite"><span>INDIZIO</span><h2>{clue.title}</h2><p>{clue.body}</p></section>}
      <div className="suspects">{dishSuspects.map((suspect)=><article key={suspect.id}><strong>{suspect.name}</strong><p>«{suspect.statement}»</p><button disabled={done} onClick={()=>accuse(suspect.id)}>ACCUSA {suspect.name.toUpperCase()}</button></article>)}</div>
      {message&&<div className={done?"result-panel":"notice-inline"}><h2>{done?"Caso chiuso":"Contraddizione ancora aperta"}</h2><p>{message}</p></div>}
    </div>
  );
}
