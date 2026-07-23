import { useRef, useState } from "react";
import type { GameProps } from "../types";
import { downloadCanvas } from "../../lib/game-utils";
import "./game.css";

const questions: Array<[string, string[]]> = [
  ["La tazza, dopo il caffè:", ["resta esattamente lì", "arriva al lavello", "migra fino a un’altra stanza"]],
  ["Il dentifricio:", ["si spreme dal fondo", "si schiaccia nel mezzo", "diventa una scultura autonoma"]],
  ["Le chiavi:", ["hanno un posto", "hanno tre posti", "si trovano quando smetto di cercarle"]],
  ["La lista della spesa:", ["resta piatta", "si piega in quattro", "diventa una pallina"]],
  ["La sedia, alzandoti:", ["torna sotto il tavolo", "resta inclinata", "si sposta in un’altra geografia"]],
  ["Il libro iniziato:", ["ha un segnalibro", "ha un angolo piegato", "ha una ricevuta preistorica"]],
];
const traceLabels = ["ALONE COSTANTE", "TUBETTO TETTONICO", "PORTO DELLE CHIAVI", "PIEGA DOCUMENTALE", "SEDIA MIGRANTE", "SEGNALIBRO FOSSILE"];

export default function ReceiptQuiz({ onProgress, onComplete }: GameProps) {
  const [answers, setAnswers] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const answer = (index: number) => {
    const next = [...answers, index]; setAnswers(next); onProgress({ risposte: next.length });
    if (next.length === questions.length) onComplete({ profilo: next.reduce((sum, value) => sum + value, 0), classifica: false });
  };
  const exportReceipt = async () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    await document.fonts.ready;
    ctx.fillStyle = "#f7f3ea"; ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = "#263627"; ctx.font = "700 72px 'Source Serif 4'"; ctx.fillText("SCONTRINO UMANO", 80, 130);
    ctx.font = "400 26px 'DM Mono'"; ctx.fillText("CONVENTIONAL / VOL. 1", 80, 188);
    ctx.strokeStyle = "#263627"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(80, 235); ctx.lineTo(1000, 235); ctx.stroke();
    traceLabels.forEach((label, index) => { ctx.font = "400 33px 'DM Mono'"; ctx.fillText(`${String(index + 1).padStart(2, "0")}  ${label}`, 80, 340 + index * 180); ctx.font = "400 40px 'Lisu Bosa'"; ctx.fillText(questions[index][1][answers[index]], 80, 398 + index * 180, 880); });
    ctx.setLineDash([12, 12]); ctx.beginPath(); ctx.moveTo(80, 1510); ctx.lineTo(1000, 1510); ctx.stroke();
    ctx.setLineDash([]); ctx.font = "700 50px 'Source Serif 4'"; ctx.fillText("TOTALE: 6 TRACCE", 80, 1600);
    ctx.font = "400 28px 'DM Mono'"; ctx.fillText("RITRATTO EDITORIALE. NESSUNA DIAGNOSI.", 80, 1690);
    downloadCanvas(canvas, "scontrino-umano-1080x1920.png");
  };
  const complete = answers.length === questions.length;
  return (
    <div className="game-panel receipt-game">
      <div className="game-status"><span>{answers.length}/6 RISPOSTE</span><span>NESSUNA CLASSIFICA</span></div>
      {!complete ? <section className="quiz-question"><span>DOMANDA {answers.length + 1}</span><h2>{questions[answers.length][0]}</h2>{questions[answers.length][1].map((option, index) => <button key={option} onClick={() => answer(index)}>{option}</button>)}</section> :
        <section className="receipt-result"><span>CONVENTIONAL / VOL. 1</span><h2>Scontrino umano</h2>{traceLabels.map((label, index) => <p key={label}><b>{label}</b><span>{questions[index][1][answers[index]]}</span></p>)}<button className="control-button primary" onClick={exportReceipt}>ESPORTA 1080×1920</button></section>}
      {answers.length >= 3 && !complete && <p className="editorial-beat">Il risultato descrive le risposte date. Non misura personalità, ordine o affidabilità.</p>}
      <canvas ref={canvasRef} width={1080} height={1920} hidden />
    </div>
  );
}
