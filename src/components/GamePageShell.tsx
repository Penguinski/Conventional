import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: ReactNode;
  info?: ReactNode;
  secondaryAction: ReactNode;
  primaryAction: ReactNode;
}

export default function GamePageShell({
  title,
  subtitle,
  onBack,
  children,
  info,
  secondaryAction,
  primaryAction,
}: Props) {
  return (
    <article className="game-page-shell game-overlay">
      <header className="game-page-masthead">
        <button className="game-page-back" type="button" onClick={onBack} aria-label="Torna alla rivista">
          ←
        </button>
        <div className="game-page-wordmark" aria-label="Conventional, volume 1">
          <strong>Conventional</strong>
          <i>/</i>
          <span>VOL. 1</span>
        </div>
      </header>

      <main className="game-page-main">
        <header className="game-page-intro">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>

        <section className="game-page-stage" aria-label={`Area di gioco: ${title}`}>
          {children}
        </section>

        {info && <aside className="game-page-info">{info}</aside>}

        <footer className="game-page-actions">
          {secondaryAction}
          {primaryAction}
        </footer>
      </main>
    </article>
  );
}
