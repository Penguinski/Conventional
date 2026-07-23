import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "../games/types";
import "./local-image-reader.css";

interface Props extends GameProps { kind:"coffee"|"foot" }
type Analysis={density:number;edges:number;balance:number;seed:number;zones:[number,number,number,number]};

function analyze(context:CanvasRenderingContext2D,width:number,height:number):Analysis{
  const data=context.getImageData(0,0,width,height).data;
  let darkness=0,edges=0,left=0,right=0,hash=2166136261;
  const zones=[0,0,0,0] as [number,number,number,number];
  const counts=[0,0,0,0];
  for(let y=0;y<height;y+=4)for(let x=0;x<width;x+=4){
    const index=(y*width+x)*4;
    const luminance=(data[index]*.299+data[index+1]*.587+data[index+2]*.114)/255;
    const dark=1-luminance;
    darkness+=dark;
    hash=Math.imul(hash^(data[index]+data[index+1]*3+data[index+2]*7),16777619);
    if(x>0){
      const previous=index-4;
      const previousLum=(data[previous]+data[previous+1]+data[previous+2])/(3*255);
      if(Math.abs(luminance-previousLum)>.22)edges+=1;
    }
    if(luminance<.45){if(x<width/2)left+=1;else right+=1;}
    const zone=y<height/2?(x<width/2?0:1):(x<width/2?2:3);
    zones[zone]+=dark;counts[zone]+=1;
  }
  const samples=Math.ceil(width/4)*Math.ceil(height/4);
  return {density:darkness/samples,edges,balance:left-right,seed:hash>>>0,zones:zones.map((value,index)=>value/counts[index]) as Analysis["zones"]};
}

const coffeeOutcomes=[
  "Una forma compatta: qualcosa è stato rimandato, non dimenticato.",
  "Una costellazione larga: il percorso importante passa fra due vuoti.",
  "Un bordo interrotto: la deviazione breve diventa il punto da ricordare.",
  "Un'isola centrale: il gesto ripetuto protegge un piccolo spazio.",
  "Due macchie vicine: una coincidenza sta diventando abitudine.",
  "Una linea che esce dal cerchio: il residuo suggerisce movimento, non previsione.",
];

export default function LocalImageReader({kind,onProgress,onComplete}:Props){
  const videoRef=useRef<HTMLVideoElement>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const completedRef=useRef("");
  const [camera,setCamera]=useState(false);
  const [analysis,setAnalysis]=useState<Analysis|null>(null);
  const [phase,setPhase]=useState<"idle"|"analysing"|"ready">("idle");
  const [error,setError]=useState("");
  const [choice,setChoice]=useState("");
  const [zones,setZones]=useState<string[]>([]);
  const [completed,setCompleted]=useState(false);

  const stop=()=>{streamRef.current?.getTracks().forEach((track)=>track.stop());streamRef.current=null;setCamera(false);};
  useEffect(()=>stop,[]);

  const start=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
      streamRef.current=stream;
      if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play();}
      setCamera(true);setError("");
    }catch{setError("Fotocamera non disponibile. Puoi caricare un'immagine o usare la demo.");stop();}
  };

  const finish=(source:CanvasImageSource)=>{
    const canvas=canvasRef.current;
    const context=canvas?.getContext("2d");
    if(!canvas||!context)return;
    context.clearRect(0,0,520,420);
    context.drawImage(source,0,0,520,420);
    const next=analyze(context,520,420);
    setAnalysis(next);
    setChoice("");
    setZones([]);
    setCompleted(false);
    setPhase("analysing");
    stop();
    onProgress({analisiLocale:true});
    window.setTimeout(()=>setPhase("ready"),500);
  };

  const capture=()=>{if(videoRef.current)finish(videoRef.current);};
  const upload=(file?:File)=>{
    if(!file)return;
    const image=new Image();
    const url=URL.createObjectURL(file);
    image.onload=()=>{finish(image);URL.revokeObjectURL(url);};
    image.onerror=()=>{URL.revokeObjectURL(url);setError("Immagine non leggibile.");};
    image.src=url;
  };
  const demo=()=>{
    const canvas=document.createElement("canvas");canvas.width=520;canvas.height=420;
    const context=canvas.getContext("2d")!;
    context.fillStyle="#e8dfce";context.fillRect(0,0,520,420);
    if(kind==="coffee"){
      context.fillStyle="#563522";context.beginPath();context.arc(260,210,155,0,Math.PI*2);context.fill();
      context.fillStyle="#b5845e";context.beginPath();context.arc(235,185,82,0,Math.PI*2);context.fill();
      context.strokeStyle="#f7f3ea";context.lineWidth=16;context.beginPath();context.arc(285,240,58,.3,4.6);context.stroke();
    }else{
      context.fillStyle="#36433a";context.beginPath();context.ellipse(250,210,92,178,-.08,0,Math.PI*2);context.fill();
      context.fillStyle="#9f9720";for(let index=0;index<8;index+=1)context.fillRect(188+(index%2)*96,65+index*39,64,14);
      context.fillStyle="#c96243";context.fillRect(185,65,70,125);context.fillRect(275,250,65,125);
    }
    finish(canvas);
  };

  const reset=()=>{stop();setAnalysis(null);setChoice("");setZones([]);setCompleted(false);setPhase("idle");setError("");completedRef.current="";const context=canvasRef.current?.getContext("2d");context?.clearRect(0,0,520,420);};
  const densityLabel=!analysis?"":analysis.density>.48?"macchie fitte":analysis.density>.28?"macchie distribuite":"molti spazi chiari";
  const edgeLabel=!analysis?"":analysis.edges>900?"bordi netti":analysis.edges>450?"bordi spezzati":"contorni morbidi";

  const constellation=useMemo(()=>{
    if(!analysis)return[];
    return Array.from({length:7},(_,index)=>({x:12+((analysis.seed>>(index*3))%76),y:14+((analysis.seed>>(index*2+5))%70),r:2+(index%3)}));
  },[analysis]);

  const pickCoffee=(value:string)=>{
    if(!analysis)return;
    setChoice(value);
    const key=`${analysis.seed}-${value}`;
    if(completedRef.current===key)return;
    completedRef.current=key;
    setCompleted(true);
    const choiceValue=value.split("").reduce((sum,letter)=>sum+letter.charCodeAt(0),0);
    onComplete({lettura:coffeeOutcomes[(analysis.seed+choiceValue)%coffeeOutcomes.length],forma:value,seed:String(analysis.seed),immagineSalvata:false});
  };

  const toggleZone=(zone:string)=>setZones((current)=>current.includes(zone)?current.filter((item)=>item!==zone):[...current,zone]);
  const confirmFoot=()=>{
    if(!analysis||!zones.length)return;
    const key=`${analysis.seed}-${zones.sort().join("-")}`;
    if(completedRef.current===key)return;
    completedRef.current=key;
    setCompleted(true);
    onComplete({zone:zones.join(","),seed:String(analysis.seed),immagineSalvata:false});
  };

  const actions=<div className="reader-actions"><button className="control-button" onClick={start}>USA FOTOCAMERA</button><label className="control-button">CARICA IMMAGINE<input type="file" accept="image/*" onChange={(event)=>upload(event.target.files?.[0])}/></label><button className="control-button" onClick={demo}>MODALITÀ DEMO</button><button className="control-button" onClick={reset}>RIPROVA</button></div>;

  if(kind==="coffee"){
    const outcome=analysis&&choice?coffeeOutcomes[(analysis.seed+choice.split("").reduce((sum,letter)=>sum+letter.charCodeAt(0),0))%coffeeOutcomes.length]:"";
    return <div className="game-panel coffee-reader">
      <div className="privacy-note"><strong>Il fondo resta sul dispositivo.</strong><span>Fotogramma e lettura non vengono inviati.</span></div>
      {actions}
      <div className="coffee-lab">
        <div className="reader-frame coffee"><video ref={videoRef} muted playsInline className={camera?"":"hidden"}/><canvas ref={canvasRef} width={520} height={420}/><i aria-hidden="true"/></div>
        {analysis&&<svg className={`analysis-overlay ${phase}`} viewBox="0 0 100 100" aria-hidden="true">{constellation.map((point,index)=><circle key={index} cx={point.x} cy={point.y} r={point.r}/>) }<polyline points={constellation.map((point)=>`${point.x},${point.y}`).join(" ")}/></svg>}
      </div>
      {camera&&<div className="reader-actions"><button className="control-button primary" onClick={capture}>SCATTA</button><button className="control-button" onClick={stop}>ANNULLA</button></div>}
      {error&&<p role="alert">{error}</p>}
      {phase==="analysing"&&<p className="analysis-status">Cerco contorni, macchie e costellazioni…</p>}
      {phase==="ready"&&analysis&&<><p className="analysis-status">Vedo {densityLabel} e {edgeLabel}. Quale forma riconosci?</p><div className="shape-choices">{["ANELLO","ISOLA","SENTIERO"].map((value)=><button className={choice===value?"selected":""} key={value} onClick={()=>pickCoffee(value)}>{value}</button>)}</div></>}
      {outcome&&<div className="result-panel"><h2>Lettura del fondo</h2><p>{outcome}</p><p>È un esito editoriale deterministico, non una previsione.</p></div>}
    </div>;
  }

  const zoneNames=["PUNTA","TALLONE","LATO SINISTRO","LATO DESTRO"];
  return <div className="game-panel foot-reader">
    <div className="privacy-note"><strong>Fotografa preferibilmente la suola.</strong><span>L'immagine resta locale e non produce valutazioni di salute, postura o personalità.</span></div>
    {actions}
    <div className="sole-workbench">
      <div className="reader-frame foot"><video ref={videoRef} muted playsInline className={camera?"":"hidden"}/><canvas ref={canvasRef} width={520} height={420}/><i aria-hidden="true"/></div>
      <div className="sole-guide" aria-label="Sagoma guida della suola"><span>PUNTA</span><span>TALLONE</span></div>
    </div>
    {camera&&<div className="reader-actions"><button className="control-button primary" onClick={capture}>SCATTA</button><button className="control-button" onClick={stop}>ANNULLA</button></div>}
    {error&&<p role="alert">{error}</p>}
    {phase==="analysing"&&<p className="analysis-status">Separo punta, tallone e lati della suola…</p>}
    {phase==="ready"&&analysis&&<><p className="analysis-status">La mappa automatica è un punto di partenza. Segna le zone che ti sembrano davvero più consumate.</p><div className="wear-map">{zoneNames.map((zone,index)=><button key={zone} aria-pressed={zones.includes(zone)} className={zones.includes(zone)?"selected":""} onClick={()=>toggleZone(zone)}><span>{zone}</span><i style={{opacity:.25+analysis.zones[index]*.75}}/></button>)}</div><button className="control-button primary" disabled={!zones.length} onClick={confirmFoot}>CONFERMA MAPPA D'USURA</button></>}
    {completed&&<div className="result-panel"><h2>Suola e percorso</h2><p>L'usura selezionata concentra il racconto su {zones.join(", ").toLowerCase()}: non dice chi sei, ma dove la suola ha incontrato più spesso il terreno.</p></div>}
  </div>;
}
