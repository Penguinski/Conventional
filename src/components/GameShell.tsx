import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import type { GameDefinition, GameProgress } from "../games/types";

interface Props {
  game: GameDefinition;
  progress?: GameProgress;
  onClose: () => void;
  children: ReactNode;
}

export default function GameShell({ game, progress, onClose, children }: Props) {
  const sheetRef = useRef<HTMLElement>(null);
  const [instructions, setInstructions] = useState(false);
  const [sources, setSources] = useState(false);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add("overlay-open");
    sheetRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>("button, a, input, [tabindex]:not([tabindex='-1'])")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("overlay-open");
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="game-overlay" role="presentation">
      <article className={`game-sheet category-${game.category}`} ref={sheetRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="game-title">
        <header className="game-header">
          <button className="back-button" onClick={onClose} aria-label="Torna alla rivista">← INDIETRO</button>
          <span className="game-kicker">N. {String(game.number).padStart(2, "0")} / {game.category.toUpperCase()}</span>
          <h1 id="game-title">{game.title}</h1>
          <p>{game.intro}</p>
          <div className="game-tools">
            <button onClick={() => setInstructions((value) => !value)} aria-expanded={instructions}>ISTRUZIONI</button>
            <span aria-live="polite">{progress?.state === "completed" ? "COMPLETATO" : progress?.state === "in-progress" ? "IN CORSO" : "NUOVO"}</span>
          </div>
          {instructions && <p className="instruction-note">Agisci direttamente sull’area di gioco. Puoi chiudere e tornare: il progresso viene conservato in questo browser.</p>}
        </header>
        <Suspense fallback={<div className="loading-game">Apro il gioco…</div>}>
          <div className="game-stage">{children}</div>
        </Suspense>
        {progress?.state === "completed" && (
          <section className="game-ending" aria-live="polite">
            <span>CODA EDITORIALE</span>
            <p>{game.conclusion}</p>
          </section>
        )}
        <footer className="game-footer">
          {game.sources?.length ? (
            <>
              <button onClick={() => setSources((value) => !value)} aria-expanded={sources}>FONTI</button>
              {sources && <ul>{game.sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul>}
            </>
          ) : <span>CONVENTIONAL / VOL. 1</span>}
        </footer>
      </article>
    </div>
  );
}
