import { lazy, useCallback, useEffect, useRef, useState } from "react";
import CardArt from "./components/CardArt";
import CornerTab from "./components/CornerTab";
import { ErrorBoundary } from "./components/ErrorBoundaries";
import GameShell from "./components/GameShell";
import { editorialCards, games } from "./content/manifest";
import type { EditorialCard, GameProgress } from "./games/types";
import { loadState, saveState, type PersistedState } from "./lib/persistence";

const lazyGames = Object.fromEntries(games.map((game) => [game.id, lazy(game.component)]));

function routeId(): string | null {
  return new URLSearchParams(window.location.search).get("gioco");
}

function EditorialModal({ card, onClose }: { card: EditorialCard; onClose: () => void }) {
  const archive = ["alone di tazza", "gradino consumato", "sedia spostata", "piega nel libro", "tasto lucido"];
  const [index, setIndex] = useState(0);
  return (
    <div className="game-overlay">
      <article className={`game-sheet editorial-sheet editorial-${card.type}`} role="dialog" aria-modal="true">
        <header className="game-header">
          <button className="back-button" onClick={onClose}>← INDIETRO</button>
          <span className="game-kicker">{card.type.toUpperCase()}</span>
          <h1>{card.title}</h1>
          <p>{card.body}</p>
        </header>
        <div className="editorial-visual" aria-hidden="true"><i /><i /><span /></div>
        {card.type === "archivio" && (
          <div className="archive-browser">
            <span>{String(index + 1).padStart(2, "0")} / {String(archive.length).padStart(2, "0")}</span>
            <strong>{archive[index]}</strong>
            <button onClick={() => setIndex((index + 1) % archive.length)}>PROSSIMA TRACCIA →</button>
          </div>
        )}
        {card.type === "bacheca" && <p className="notice">Qui ritrovi i giochi completati e quelli ancora aperti. Il riepilogo resta sul dispositivo e non crea classifiche.</p>}
      </article>
    </div>
  );
}

export default function App() {
  const [store, setStore] = useState<PersistedState | null>(null);
  const [activeId, setActiveId] = useState<string | null>(() => routeId());
  const [editorial, setEditorial] = useState<EditorialCard | null>(null);
  const scrollRef = useRef(0);

  useEffect(() => { loadState().then(setStore); }, []);
  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const onPop = (event: PopStateEvent) => {
      const id = routeId();
      if (!id && typeof event.state?.scroll === "number") scrollRef.current = event.state.scroll;
      setActiveId(id);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener("popstate", onPop);
    };
  }, []);
  useEffect(() => {
    if (activeId) return;
    const frame = window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.scrollTo({ top: scrollRef.current })));
    return () => window.cancelAnimationFrame(frame);
  }, [activeId]);

  const completed = Object.values(store?.games ?? {}).filter((entry) => entry.state === "completed").length;
  const activeGame = games.find((game) => game.id === activeId) ?? null;
  const ActiveComponent = activeGame ? lazyGames[activeGame.id] : null;

  const updateGame = useCallback((id: string, state: GameProgress["state"], result?: GameProgress["result"]) => {
    setStore((current) => {
      if (!current) return current;
      if (current.games[id]?.state === "completed" && state !== "completed") return current;
      const next = {
        ...current,
        games: { ...current.games, [id]: { state, result, updatedAt: Date.now() } },
      };
      void saveState(next);
      return next;
    });
  }, []);

  const openGame = (id: string) => {
    scrollRef.current = window.scrollY;
    window.history.replaceState({ ...window.history.state, scroll: scrollRef.current }, "", window.location.href);
    const url = new URL(window.location.href);
    url.searchParams.set("gioco", id);
    window.history.pushState({ game: id }, "", url);
    setActiveId(id);
  };

  const closeGame = useCallback(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("gioco")) window.history.back();
    else setActiveId(null);
  }, []);

  const gridItems = games.flatMap((game, index) => {
    const item: Array<{ kind: "game"; game: typeof game } | { kind: "editorial"; card: EditorialCard }> = [{ kind: "game", game }];
    const editorialIndex = [1, 3, 5, 8, 10].indexOf(index);
    if (editorialIndex >= 0) item.push({ kind: "editorial", card: editorialCards[editorialIndex] });
    return item;
  });

  if ((activeGame?.id === "fuori-traccia" || activeGame?.id === "intruso" || activeGame?.id === "cassetto" || activeGame?.id === "collega-punti" || activeGame?.id === "prima-dopo") && ActiveComponent && store) {
    return (
      <ErrorBoundary scope="game" onBack={closeGame} resetKey={activeGame.id}>
        <ActiveComponent
          saved={store.games[activeGame.id]}
          onProgress={(result) => updateGame(activeGame.id, "in-progress", result)}
          onComplete={(result) => updateGame(activeGame.id, "completed", result)}
        />
      </ErrorBoundary>
    );
  }

  return (
    <div className="magazine">
      <header className="masthead">
        <a className="wordmark" href="./" aria-label="Conventional, home">Conventional <i>/</i> <span>VOL. 1</span></a>
      </header>

      <main>
        <section className="issue-intro" aria-labelledby="issue-title">
          <div>
            <span className="eyebrow">CONVENTIONAL / NUMERO UNO</span>
            <h1 id="issue-title">Lost and Found</h1>
            <p>Piccoli giochi per grandi menti.<br />Il lonfo ponfo mangia pongo.</p>
          </div>
          <div className="issue-counter" aria-label={`${completed} giochi completati su 12`}>{String(completed).padStart(2, "0")}/12</div>
        </section>

        <section className="card-grid" id="giochi" aria-label="Giochi e contenuti del volume">
          {gridItems.map((item, gridIndex) => {
            const inward = gridIndex % 2 === 0 ? "right" : "left";
            if (item.kind === "game") {
              const progress = store?.games[item.game.id]?.state ?? "new";
              return (
                <button className={`issue-card category-${item.game.category}`} key={item.game.id} onClick={() => openGame(item.game.id)}>
                  <CornerTab side={inward} label={`N. ${String(item.game.number).padStart(2, "0")}`} />
                  <CardArt number={item.game.number} category={item.game.category} />
                  <span className="card-copy">
                    <strong>{item.game.title}</strong>
                    <small>{progress === "completed" ? "COMPLETATO" : progress === "in-progress" ? "IN CORSO" : "NUOVO"}</small>
                    <span className="card-action">{item.game.action}<b>→</b></span>
                  </span>
                </button>
              );
            }
            return (
              <button className={`issue-card editorial-card editorial-${item.card.type}`} key={item.card.id} onClick={() => setEditorial(item.card)}>
                <CornerTab side={inward} label={item.card.type.toUpperCase()} compact />
                <div className="editorial-card-art" aria-hidden="true"><i /><i /><span /></div>
                <span className="card-copy"><strong>{item.card.title}</strong><small>{item.card.body}</small><span className="card-action">{item.card.action}<b>→</b></span></span>
              </button>
            );
          })}
        </section>
      </main>

      <footer className="colophon">
        <p>CONVENTIONAL / VOL. 1 / 2026</p>
      </footer>

      {activeGame && ActiveComponent && store && (
        <GameShell
          game={activeGame}
          progress={store.games[activeGame.id]}
          onClose={closeGame}
        >
          <ErrorBoundary scope="game" onBack={closeGame} resetKey={activeGame.id}>
            <ActiveComponent
              saved={store.games[activeGame.id]}
              onProgress={(result) => updateGame(activeGame.id, "in-progress", result)}
              onComplete={(result) => updateGame(activeGame.id, "completed", result)}
            />
          </ErrorBoundary>
        </GameShell>
      )}
      {editorial && <EditorialModal card={editorial} onClose={() => setEditorial(null)} />}
    </div>
  );
}
