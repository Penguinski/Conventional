import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import { cellsForEntry, entries, solutionCells, validateCrossword } from "./logic";
import "./game.css";

const solution=solutionCells();

export default function Crossword({onProgress,onComplete}:GameProps){
  const [values,setValues]=useState<Record<string,string>>({});
  const [activeKey,setActiveKey]=useState<string|null>(null);
  const [activeNumber,setActiveNumber]=useState(entries[0].number);
  const [revealed,setRevealed]=useState(0);
  const [checked,setChecked]=useState(false);
  const [done,setDone]=useState(false);
  const inputsRef=useRef<Record<string,HTMLInputElement|null>>({});
  const seconds=useActiveTimer(!done);

  const cellEntries=useMemo(()=>{
    const map=new Map<string,typeof entries>();
    entries.forEach((entry)=>cellsForEntry(entry).forEach((key)=>map.set(key,[...(map.get(key)??[]),entry])));
    return map;
  },[]);
  const activeEntry=entries.find((entry)=>entry.number===activeNumber)??entries[0];
  const activeCells=cellsForEntry(activeEntry);

  const select=(key:string,toggle=false)=>{
    const candidates=cellEntries.get(key)??[];
    if(!candidates.length)return;
    const currentIndex=candidates.findIndex((entry)=>entry.number===activeNumber);
    const chosen=toggle&&candidates.length>1?candidates[(currentIndex+1+candidates.length)%candidates.length]:candidates[Math.max(currentIndex,0)]??candidates[0];
    setActiveKey(key);
    setActiveNumber(chosen.number);
  };

  const finishIfValid=(next:Record<string,string>,revealCount=revealed)=>{
    if(validateCrossword(next)){
      setDone(true);
      onComplete({secondi:seconds,rivelate:revealCount});
    }
  };

  const update=(key:string,value:string)=>{
    const letter=value.slice(-1).toUpperCase().replace(/[^A-Z]/g,"");
    const next={...values,[key]:letter};
    setValues(next);
    setChecked(false);
    onProgress({lettere:Object.values(next).filter(Boolean).length,rivelate:revealed});
    finishIfValid(next);
    if(letter){
      const index=activeCells.indexOf(key);
      const following=activeCells[index+1];
      if(following)inputsRef.current[following]?.focus();
    }
  };

  const onKey=(event:KeyboardEvent<HTMLInputElement>,key:string)=>{
    const index=activeCells.indexOf(key);
    if(event.key==="Backspace"&&!values[key]&&index>0){
      event.preventDefault();
      const previous=activeCells[index-1];
      setValues((current)=>({...current,[previous]:""}));
      inputsRef.current[previous]?.focus();
      return;
    }
    const [row,col]=key.split("-").map(Number);
    const nextKey=event.key==="ArrowRight"?`${row}-${col+1}`:event.key==="ArrowLeft"?`${row}-${col-1}`:event.key==="ArrowDown"?`${row+1}-${col}`:event.key==="ArrowUp"?`${row-1}-${col}`:null;
    if(nextKey&&solution.has(nextKey)){event.preventDefault();inputsRef.current[nextKey]?.focus();}
  };

  const reveal=()=>{
    if(!activeKey||!solution.has(activeKey)||done)return;
    const next={...values,[activeKey]:solution.get(activeKey)!};
    const count=revealed+1;
    setValues(next);
    setRevealed(count);
    finishIfValid(next,count);
  };
  const reset=()=>{setValues({});setActiveKey(null);setActiveNumber(entries[0].number);setRevealed(0);setChecked(false);setDone(false);};
  const numbers=new Map<string,number>();
  entries.forEach((entry)=>numbers.set(`${entry.row}-${entry.col}`,entry.number));

  return (
    <div className="game-panel crossword-game">
      <div className="game-status"><span>{seconds}s · {revealed} rivelate</span><div><button onClick={()=>setChecked(true)}>CONTROLLA</button><button onClick={reveal}>RIVELA LETTERA</button><button onClick={reset}>RIPROVA</button></div></div>
      <section className="active-clue" aria-live="polite"><span>{activeEntry.number} · {activeEntry.direction==="across"?"ORIZZONTALE":"VERTICALE"}</span><strong>{activeEntry.clue}</strong></section>
      <div className="crossword-layout">
        <div className="crossword-grid" aria-label="Cruciverba 9 per 9">
          {Array.from({length:81},(_,index)=>{
            const row=Math.floor(index/9),col=index%9,key=`${row}-${col}`,letter=solution.get(key);
            if(!letter)return <i className="block" key={key}/>;
            const wrong=Boolean(checked&&values[key]&&values[key]!==letter);
            const highlighted=activeCells.includes(key);
            return <label key={key} className={`${wrong?"wrong ":""}${highlighted?"active-word":""}`}>{numbers.has(key)&&<small>{numbers.get(key)}</small>}<input
              ref={(node)=>{inputsRef.current[key]=node;}}
              aria-label={`Casella ${row+1}, ${col+1}`}
              inputMode="text"
              maxLength={1}
              value={values[key]??""}
              onFocus={()=>select(key)}
              onClick={()=>select(key,activeKey===key)}
              onChange={(event)=>update(key,event.target.value)}
              onKeyDown={(event)=>onKey(event,key)}
            /></label>;
          })}
        </div>
        <ol className="clues">{entries.map((entry)=><li className={entry.number===activeNumber?"active":""} key={entry.number}><button onClick={()=>{setActiveNumber(entry.number);inputsRef.current[cellsForEntry(entry)[0]]?.focus();}}><b>{entry.number}.</b> {entry.clue}</button></li>)}</ol>
      </div>
      {done&&<div className="result-panel"><h2>Griglia completa</h2><p>Otto parole, sette incroci e qualche residuo d'inchiostro.</p></div>}
    </div>
  );
}
