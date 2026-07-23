import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../games/types";
import "./local-image-reader.css";

interface Props extends GameProps {
  kind: "coffee" | "foot";
}

function analyze(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const data = ctx.getImageData(0, 0, width, height).data;
  let darkness = 0, edges = 0, left = 0, right = 0;
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const i = (y * width + x) * 4;
      const lum = (data[i] * .299 + data[i + 1] * .587 + data[i + 2] * .114) / 255;
      darkness += 1 - lum;
      if (x > 0) {
        const p = i - 4;
        const prev = (data[p] + data[p + 1] + data[p + 2]) / (3 * 255);
        if (Math.abs(lum - prev) > .25) edges += 1;
      }
      if (lum < .45) {
        if (x < width / 2) left += 1;
        else right += 1;
      }
    }
  }
  const samples = Math.ceil(width / 4) * Math.ceil(height / 4);
  return { density: darkness / samples, edges, balance: left - right };
}

export default function LocalImageReader({ kind, onProgress, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camera, setCamera] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof analyze> | null>(null);
  const [error, setError] = useState("");
  const stop = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setCamera(false); };
  useEffect(() => stop, []);
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream; if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); } setCamera(true); setError("");
    } catch { setError("Fotocamera non disponibile. Puoi caricare un’immagine o usare la demo."); stop(); }
  };
  const finish = (source: CanvasImageSource) => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 520, 420); ctx.drawImage(source, 0, 0, 520, 420);
    const analysis = analyze(ctx, 520, 420); setResult(analysis); stop(); onProgress({ analisiLocale: true });
    onComplete({ densita: Number(analysis.density.toFixed(3)), bordi: analysis.edges, bilanciamento: analysis.balance, immagineSalvata: false });
  };
  const capture = () => { if (videoRef.current) finish(videoRef.current); };
  const upload = (file?: File) => {
    if (!file) return; const image = new Image(); const url = URL.createObjectURL(file);
    image.onload = () => { finish(image); URL.revokeObjectURL(url); }; image.src = url;
  };
  const demo = () => {
    const temp = document.createElement("canvas"); temp.width = 520; temp.height = 420; const ctx = temp.getContext("2d")!;
    ctx.fillStyle = "#e8dfce"; ctx.fillRect(0, 0, 520, 420); ctx.fillStyle = kind === "coffee" ? "#563522" : "#36433a";
    if (kind === "coffee") { ctx.beginPath(); ctx.arc(260, 210, 155, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle="#b5845e"; ctx.beginPath(); ctx.arc(245,195,105,0,Math.PI*2); ctx.fill(); }
    else { ctx.ellipse(220, 220, 85, 170, -.2, 0, Math.PI * 2); ctx.fill(); for (let i=0;i<8;i++){ctx.fillRect(160+(i%2)*90,70+i*35,55,12);} }
    finish(temp);
  };
  const interpretation = result && (kind === "coffee"
    ? result.density > .45 ? "Fondo compatto: molte zone scure, pochi vuoti. La lettura propone «progetto rimandato, ma non dimenticato»." : "Fondo aperto: residui sparsi e bordi leggeri. La lettura propone «deviazione breve, ritorno probabile»."
    : result.balance > 0 ? "Usura più visibile a sinistra. La lettura culturale propone «passo che cerca il bordo»." : "Usura più visibile a destra. La lettura culturale propone «passo che corregge la rotta».");
  return (
    <div className="game-panel local-reader">
      <div className="privacy-note"><strong>L’immagine resta su questo dispositivo.</strong><span>Nessun fotogramma, hash o risultato visivo viene inviato.</span></div>
      <div className="reader-actions"><button className="control-button" onClick={start}>USA FOTOCAMERA</button><label className="control-button">CARICA IMMAGINE<input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])} /></label><button className="control-button" onClick={demo}>MODALITÀ DEMO</button></div>
      <div className={`reader-frame ${kind}`}><video ref={videoRef} muted playsInline className={camera ? "" : "hidden"} /><canvas ref={canvasRef} width={520} height={420} /><i aria-hidden="true" /></div>
      {camera && <div className="reader-actions"><button className="control-button primary" onClick={capture}>SCATTA</button><button className="control-button" onClick={stop}>ANNULLA</button></div>}
      {error && <p role="alert">{error}</p>}
      {result && <><p className="editorial-beat">Analisi locale: densità {Math.round(result.density * 100)}%, {result.edges} bordi campionati, bilanciamento {result.balance}.</p><div className="result-panel"><h2>{kind === "coffee" ? "Lettura del fondo" : "Lettura della suola"}</h2><p>{interpretation}</p><p>Interpretazione automatica e ludica: non è una previsione, una diagnosi o un profilo personale.</p></div></>}
    </div>
  );
}
