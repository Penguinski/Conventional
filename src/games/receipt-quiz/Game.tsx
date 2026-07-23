import { useRef, useState } from "react";
import type { GameProps } from "../types";
import { downloadCanvas } from "../../lib/game-utils";
import "./game.css";

type Option={label:string;line:string};
type Question={prompt:string;trace:string;options:Option[]};

export const questions:Question[]=[
  {prompt:"La tazza, dopo il caffè:",trace:"TRACCIA DELLA TAZZA",options:[
    {label:"resta esattamente lì",line:"ALONE CIRCOLARE / POSIZIONE STABILE"},
    {label:"arriva al lavello",line:"GOCCE IN TRANSITO / DESTINAZIONE LAVELLO"},
    {label:"migra fino a un'altra stanza",line:"DOPPIO ALONE / PERCORSO FRA STANZE"},
  ]},
  {prompt:"Il dentifricio:",trace:"FORMA DEL TUBETTO",options:[
    {label:"si spreme dal fondo",line:"PIEGA PROGRESSIVA / FONDO ARROTOLATO"},
    {label:"si schiaccia nel mezzo",line:"CRATERE CENTRALE / ESTREMITÀ INTEGRE"},
    {label:"diventa una scultura autonoma",line:"TORSIONE LIBERA / TAPPO DISPERSO"},
  ]},
  {prompt:"Le chiavi:",trace:"PORTO DELLE CHIAVI",options:[
    {label:"hanno un posto",line:"UN SOLO PUNTO D'ATTERRAGGIO"},
    {label:"hanno tre posti",line:"TRIANGOLO D'APPOGGIO / ROTTA VARIABILE"},
    {label:"si trovano quando smetto di cercarle",line:"TRACCIA INTERMITTENTE / RITROVAMENTO TARDIVO"},
  ]},
  {prompt:"La lista della spesa:",trace:"PIEGA DOCUMENTALE",options:[
    {label:"resta piatta",line:"FOGLIO APERTO / BORDI LEGGIBILI"},
    {label:"si piega in quattro",line:"QUATTRO QUADRANTI / TASCA ANTERIORE"},
    {label:"diventa una pallina",line:"VOLUME COMPATTO / TESTO ILLEGGIBILE"},
  ]},
  {prompt:"La sedia, alzandoti:",trace:"GEOGRAFIA DELLA SEDIA",options:[
    {label:"torna sotto il tavolo",line:"ALLINEAMENTO RIPRISTINATO"},
    {label:"resta inclinata",line:"ANGOLO APERTO / PASSAGGIO RECENTE"},
    {label:"si sposta in un'altra geografia",line:"DISTANZA IMPREVISTA / NUOVO CONFINE"},
  ]},
  {prompt:"Il libro iniziato:",trace:"SEGNALIBRO",options:[
    {label:"ha un segnalibro",line:"OGGETTO AGGIUNTO / PAGINA CONSERVATA"},
    {label:"ha un angolo piegato",line:"PIEGA PERMANENTE / PAGINA RITROVATA"},
    {label:"ha una ricevuta preistorica",line:"ARCHIVIO CASUALE / DATA ESTRANEA"},
  ]},
];

function wrap(context:CanvasRenderingContext2D,text:string,maxWidth:number){
  const words=text.split(" ");
  const lines:string[]=[];
  let current="";
  words.forEach((word)=>{
    const next=current?`${current} ${word}`:word;
    if(context.measureText(next).width>maxWidth&&current){lines.push(current);current=word;}else current=next;
  });
  if(current)lines.push(current);
  return lines;
}

function paintReceipt(context:CanvasRenderingContext2D,answers:number[]){
  context.fillStyle="#fffdf5";context.fillRect(0,0,1080,1920);
  context.fillStyle="#263627";context.font="700 72px 'Source Serif 4'";context.fillText("SCONTRINO UMANO",80,130);
  context.font="400 26px 'DM Mono'";context.fillText("CONVENTIONAL / VOL. 1",80,188);
  context.strokeStyle="#263627";context.lineWidth=4;context.beginPath();context.moveTo(80,235);context.lineTo(1000,235);context.stroke();
  questions.forEach((question,index)=>{
    const y=330+index*205;
    context.font="400 27px 'DM Mono'";context.fillText(`${String(index+1).padStart(2,"0")}  ${question.trace}`,80,y);
    context.font="400 40px 'Lisu Bosa'";
    wrap(context,question.options[answers[index]].label,880).slice(0,2).forEach((line,lineIndex)=>context.fillText(line,80,y+58+lineIndex*45));
    context.font="400 22px 'DM Mono'";context.fillText(question.options[answers[index]].line,80,y+146,900);
  });
  context.setLineDash([12,12]);context.beginPath();context.moveTo(80,1595);context.lineTo(1000,1595);context.stroke();context.setLineDash([]);
  context.font="700 50px 'Source Serif 4'";context.fillText("TOTALE: 6 TRACCE",80,1690);
  context.font="400 28px 'DM Mono'";context.fillText("RITRATTO EDITORIALE. NESSUNA DIAGNOSI.",80,1770);
}

export default function ReceiptQuiz({onProgress,onComplete}:GameProps){
  const [answers,setAnswers]=useState<number[]>([]);
  const [confirmed,setConfirmed]=useState(false);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const preview=answers.length===questions.length;

  const answer=(index:number)=>{
    const next=[...answers,index];
    setAnswers(next);
    setConfirmed(false);
    onProgress({risposte:next.length});
  };
  const back=()=>{setAnswers((current)=>current.slice(0,-1));setConfirmed(false);};
  const confirm=()=>{setConfirmed(true);onComplete({risposte:answers.join("-"),classifica:false});};
  const reset=()=>{setAnswers([]);setConfirmed(false);};
  const exportReceipt=async()=>{
    if(!confirmed)return;
    const canvas=canvasRef.current;
    const context=canvas?.getContext("2d");
    if(!canvas||!context)return;
    await document.fonts.ready;
    paintReceipt(context,answers);
    downloadCanvas(canvas,"scontrino-umano-1080x1920.png");
  };

  return (
    <div className="game-panel receipt-game">
      <div className="game-status"><span>{answers.length}/6 RISPOSTE</span><span>NESSUNA CLASSIFICA</span><button onClick={reset}>RIPROVA</button></div>
      {!preview?<section className="quiz-question"><span>DOMANDA {answers.length+1}</span><h2>{questions[answers.length].prompt}</h2>{questions[answers.length].options.map((option,index)=><button key={option.label} onClick={()=>answer(index)}>{option.label}</button>)}{answers.length>0&&<button className="quiz-back" onClick={back}>← DOMANDA PRECEDENTE</button>}</section>:
        <section className="receipt-result" aria-label="Anteprima scontrino 1080 per 1920">
          <span>CONVENTIONAL / VOL. 1</span><h2>Scontrino umano</h2>
          {questions.map((question,index)=><p key={question.trace}><b>{String(index+1).padStart(2,"0")} {question.trace}</b><span>{question.options[answers[index]].label}</span><small>{question.options[answers[index]].line}</small></p>)}
          {!confirmed?<div className="receipt-actions"><button className="control-button" onClick={back}>← MODIFICA ULTIMA</button><button className="control-button primary" onClick={confirm}>CONFERMA RISULTATO</button></div>:<button className="control-button primary" onClick={exportReceipt}>ESPORTA 1080×1920</button>}
        </section>}
      <canvas ref={canvasRef} width={1080} height={1920} hidden/>
    </div>
  );
}
