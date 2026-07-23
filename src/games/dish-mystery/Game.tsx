import { useState } from "react";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import "./game.css";

const clues = [
  ["Padella", "È unta di pomodoro e ha il manico ancora tiepido."],
  ["Lavello", "Due piatti sono sciacquati. La padella no."],
  ["Messaggio", "Nora: «Ho mangiato fuori. Torno tardi.»"],
  ["Scolapiatti", "Il piatto blu usato da Teo è già asciutto."],
  ["Piano cottura", "Una macchia fresca coincide con il fornello della padella."],
];
const suspects = [
  ["Nora", "Ho mangiato fuori."],
  ["Teo", "Ho lavato il mio piatto subito."],
  ["Marta", "Ho cucinato la pasta, ma pensavo lavasse Teo."],
];

export default function DishMystery({ onProgress, onComplete }: GameProps) {
  const [seen, setSeen] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const seconds = useActiveTimer(!done);
  const inspect = (index: number) => {
    const next = seen.includes(index) ? seen : [...seen, index];
    setSeen(next); onProgress({ indizi: next.length });
  };
  const accuse = (name: string) => {
    if (seen.length < 3) { setMessage("Servono almeno tre indizi prima di accusare."); return; }
    const nextAttempts = attempts + 1; setAttempts(nextAttempts);
    if (name === "Marta") {
      setDone(true); setMessage("La padella e il fornello confermano la sua versione: ha cucinato. Il piatto di Teo, però, è già lavato.");
      onComplete({ primoTentativo: nextAttempts === 1, secondi: seconds, indizi: seen.length });
    } else {
      setMessage(name === "Nora" ? "Il messaggio e l’assenza di un suo piatto restano senza contraddizione." : "Il suo piatto blu è nello scolapiatti: questa traccia non è ancora spiegata.");
    }
  };
  return (
    <div className="game-panel mystery-game">
      <div className="game-status"><span>{seen.length}/5 INDIZI · {seconds}s</span><span>{attempts} accuse</span></div>
      <div className="clue-grid">{clues.map(([title, body], index) => <button key={title} className={seen.includes(index) ? "seen" : ""} onClick={() => inspect(index)}><strong>{title}</strong><span>{seen.includes(index) ? body : "ISPEZIONA"}</span></button>)}</div>
      {seen.length >= 2 && <p className="editorial-beat">Una traccia utile deve restringere le possibilità, non soltanto sembrare investigativa.</p>}
      <div className="suspects">{suspects.map(([name, statement]) => <button key={name} disabled={done} onClick={() => accuse(name)}><strong>{name}</strong><span>«{statement}»</span><small>ACCUSA</small></button>)}</div>
      {message && <div className={done ? "result-panel" : "notice-inline"}><h2>{done ? "Caso chiuso" : "Contraddizione irrisolta"}</h2><p>{message}</p></div>}
    </div>
  );
}
