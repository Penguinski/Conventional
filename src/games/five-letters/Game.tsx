import { useEffect, useState } from "react";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import { dailyWord, evaluateGuess, words } from "./logic";
import "./game.css";

const keyboard = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export default function FiveLetters({ onProgress, onComplete }: GameProps) {
  const answer = dailyWord();
  const [draft, setDraft] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const won = guesses.includes(answer);
  const over = won || guesses.length >= 6;
  const seconds = useActiveTimer(!over);
  const enter = () => {
    if (draft.length !== 5) { setMessage("Servono cinque lettere."); return; }
    if (!words.includes(draft)) { setMessage("Parola fuori dal dizionario del volume."); return; }
    const next = [...guesses, draft]; setGuesses(next); setDraft(""); setMessage(""); onProgress({ tentativi: next.length });
    if (draft === answer) onComplete({ tentativi: next.length, secondi: seconds, versione: 1 });
  };
  const key = (value: string) => {
    if (over) return;
    if (value === "⌫") setDraft((text) => text.slice(0, -1));
    else if (value === "INVIO") enter();
    else if (/^[A-Z]$/.test(value) && draft.length < 5) setDraft((text) => text + value);
  };
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Enter") key("INVIO");
      else if (event.key === "Backspace") key("⌫");
      else key(event.key.toUpperCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  return (
    <div className="game-panel word-game">
      <div className="game-status"><span>DIZIONARIO V. 1</span><span>{guesses.length}/6 · {seconds}s</span></div>
      <div className="word-board" aria-label="Griglia dei tentativi">
        {Array.from({ length: 6 }, (_, row) => {
          const value = guesses[row] ?? (row === guesses.length ? draft : "");
          const marks = guesses[row] ? evaluateGuess(guesses[row], answer) : [];
          return Array.from({ length: 5 }, (_, col) => <i key={`${row}-${col}`} className={marks[col] ?? ""} data-state={marks[col] ?? "vuota"}>{value[col] ?? ""}</i>);
        })}
      </div>
      {guesses.length >= 2 && !over && <p className="editorial-beat">Una lettera può esserci senza essere al suo posto: presenza e posizione raccontano cose diverse.</p>}
      <div className="keyboard">{keyboard.map((row) => <div key={row}>{row.split("").map((letter) => <button key={letter} onClick={() => key(letter)}>{letter}</button>)}</div>)}<div><button className="wide" onClick={() => key("INVIO")}>INVIO</button><button className="wide" onClick={() => key("⌫")}>⌫</button></div></div>
      {message && <p className="word-message" role="status">{message}</p>}
      {over && <div className="result-panel"><h2>{won ? answer : `Era ${answer}`}</h2><p>{won ? `Risolta in ${guesses.length} tentativi.` : "La traccia di oggi si è chiusa."} Ogni parola del dizionario ha una nota editoriale specifica da ampliare.</p></div>}
    </div>
  );
}
