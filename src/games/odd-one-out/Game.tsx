import { useState } from "react";
import GamePageShell from "../../components/GamePageShell";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import "./game.css";

interface Actor {
  id: string;
  traceDirection: "left" | "right";
}

export const actors: Actor[] = Array.from({ length: 16 }, (_, index) => ({
  id: `figura-${index + 1}`,
  traceDirection: index === 9 ? "right" : "left",
}));
const TARGET = 9;

export default function OddOneOut({ onProgress, onComplete }: GameProps) {
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [lastWrong, setLastWrong] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const seconds = useActiveTimer(!done);
  const score = seconds + errors * 8;
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const pick = (index: number) => {
    if (done) return;
    setSelected(index);
    setLastWrong(null);
    setFeedback("");
  };

  const confirm = () => {
    if (done) return;
    if (selected === null) {
      setFeedback("Seleziona una figura prima di confermare.");
      return;
    }
    if (selected === TARGET) {
      setDone(true);
      onComplete({ errori: errors, secondi: seconds, punteggio: seconds + errors * 8 });
      setFeedback("La figura 10 procede verso destra, ma i segni sono davanti al passo anziché dietro: è l’unica traccia che non può provenire dal movimento mostrato.");
      navigator.vibrate?.(25);
      return;
    }
    const nextErrors = errors + 1;
    setErrors(nextErrors);
    setLastWrong(selected);
    setFeedback("Non è questa. Puoi cambiare scelta e confermare di nuovo.");
    onProgress({ errori: nextErrors });
    navigator.vibrate?.(18);
  };

  const reset = () => {
    setErrors(0);
    setDone(false);
    setSelected(null);
    setLastWrong(null);
    setFeedback("");
  };

  const goHome = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("gioco");
    window.history.replaceState({ scroll: 0 }, "", url);
    window.dispatchEvent(new PopStateEvent("popstate", { state: { scroll: 0 } }));
  };

  return (
    <GamePageShell
      title="Trova l’intruso"
      subtitle="Tra tutte queste figure ce n’è una che non appartiene al gruppo. Riesci a trovarla?"
      onBack={goHome}
      info={(
        <div className="odd-metrics" aria-label="Stato della partita">
          <div>
            <span>TROVATI</span>
            <strong>{done ? "1/1" : "0/1"}</strong>
          </div>
          <div>
            <span>PUNTEGGIO</span>
            <strong>{String(score).padStart(4, "0")}</strong>
          </div>
          <div>
            <span>TEMPO</span>
            <strong>{time}</strong>
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
        <button className="game-page-action odd-confirm-action" type="button" onClick={confirm} disabled={selected === null || done}>
          <strong>Conferma</strong>
          <span aria-hidden="true">→</span>
        </button>
      )}
    >
      <div className="odd-game">
        <div className="odd-grid-panel">
          <div className="odd-grid" role="group" aria-label="Sedici figure, scegline una">
            {actors.map((actor, index) => {
              const selectedActor = selected === index;
              const wrongActor = lastWrong === index;
              const foundActor = done && index === TARGET;
              const traceX = actor.traceDirection === "left" ? 13 : 67;
              return (
            <button
              key={actor.id}
                  className={[
                    "odd-figure",
                    selectedActor ? "selected" : "",
                    wrongActor ? "wrong" : "",
                    foundActor ? "found" : "",
                  ].filter(Boolean).join(" ")}
              onClick={() => pick(index)}
              aria-label={`Figura ${index + 1}`}
                  aria-pressed={selectedActor}
                  disabled={done}
                >
                  <svg viewBox="0 0 80 92" aria-hidden="true">
                    <g className="odd-trace">
                      <circle cx={traceX} cy="52" r="2.2" />
                      <circle cx={traceX + (actor.traceDirection === "left" ? 7 : -7)} cy="58" r="1.8" />
                      <circle cx={traceX + (actor.traceDirection === "left" ? 13 : -13)} cy="64" r="1.4" />
                    </g>
                    <path className="odd-body" d="M40 12 C28 12 24 24 26 36 C20 47 20 67 28 77 C34 84 46 84 52 77 C60 67 60 47 54 36 C56 24 52 12 40 12 Z" />
                    <path className="odd-arm" d="M27 42 C22 49 21 58 24 65 M53 42 C58 49 59 58 56 65" />
                    <path className="odd-feet" d="M33 80 V86 H28 M47 80 V86 H52" />
                    <circle className="odd-eye" cx="36" cy="31" r="1.6" />
                    <circle className="odd-eye" cx="45" cy="31" r="1.6" />
                  </svg>
                </button>
              );
            })}
          </div>
          {feedback && (
            <div className={`odd-feedback ${done ? "game-tools result-panel" : ""}`} aria-live="polite">
              {done && <span className="odd-complete-state">COMPLETATO</span>}
              <p>{feedback}</p>
            </div>
          )}
        </div>
      </div>
    </GamePageShell>
  );
}
