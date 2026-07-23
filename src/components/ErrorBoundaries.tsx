import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  scope: "app" | "game";
  onBack?: () => void;
  resetKey?: string | number;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(`[Conventional:${this.props.scope}]`, error, info);
  }

  componentDidUpdate(previous: Props) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  private retry = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className={`error-fallback error-${this.props.scope}`} role="alert">
        <span>CONVENTIONAL / RECUPERO</span>
        <h1>{this.props.scope === "game" ? "Il gioco si è fermato." : "La rivista ha incontrato un errore."}</h1>
        <p>Il resto del volume è al sicuro. Puoi riprovare senza perdere il progresso già salvato.</p>
        <div>
          <button className="control-button primary" onClick={this.retry}>RIPROVA</button>
          {this.props.onBack && <button className="control-button" onClick={this.props.onBack}>TORNA ALLA RIVISTA</button>}
        </div>
        {import.meta.env.DEV && <pre>{this.state.error.message}</pre>}
      </section>
    );
  }
}
