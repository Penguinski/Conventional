import { useEffect, useMemo, useState } from "react";
import type { GameProps } from "../types";
import { useActiveTimer } from "../../lib/game-utils";
import { acceptedWords, dailyWord, dayKey, DICTIONARY_VERSION, evaluateGuess, solutionNotes, type LetterMark } from "./logic";
import "./game.css";

const keyboard=["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"];
const rank:Record<LetterMark,number>={absent:1,present:2,correct:3};

export default function FiveLetters({saved,onProgress,onComplete}:GameProps){
  const answer=dailyWord();
  const today=dayKey();
  const [guesses,setGuesses]=useState<string[]>(()=>{
    try{
      const value=JSON.parse(String(saved?.result?.partita??"{}")) as {date?:string;version?:number;guesses?:string[]};
      return value.date===today&&value.version===DICTIONARY_VERSION&&Array.isArray(value.guesses)?value.guesses:[];
    }catch{return [];}
  });
  const [draft,setDraft]=useState("");
  const [message,setMessage]=useState("");
  const won=guesses.includes(answer);
  const over=won||guesses.length>=6;
  const seconds=useActiveTimer(!over);

  const persist=(next:string[],complete=false)=>{
    const payload={date:today,version:DICTIONARY_VERSION,guesses:next};
    const result={partita:JSON.stringify(payload),tentativi:next.length,vinta:next.includes(answer),data:today,dizionario:DICTIONARY_VERSION};
    if(complete)onComplete(result); else onProgress(result);
  };

  const enter=()=>{
    if(over)return;
    if(draft.length!==5){setMessage("Servono cinque lettere.");return;}
    if(!acceptedWords.includes(draft)){setMessage("Parola non presente nel dizionario locale.");return;}
    const next=[...guesses,draft];
    setGuesses(next);
    setDraft("");
    setMessage("");
    persist(next,draft===answer||next.length===6);
  };

  const key=(value:string)=>{
    if(over)return;
    if(value==="⌫")setDraft((text)=>text.slice(0,-1));
    else if(value==="INVIO")enter();
    else if(/^[A-Z]$/.test(value)&&draft.length<5)setDraft((text)=>text+value);
  };

  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      if(event.key==="Enter")key("INVIO");
      else if(event.key==="Backspace")key("⌫");
      else key(event.key.toUpperCase());
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  });

  const letterStates=useMemo(()=>{
    const result:Record<string,LetterMark>={};
    guesses.forEach((guess)=>evaluateGuess(guess,answer).forEach((mark,index)=>{
      const letter=guess[index];
      if(!result[letter]||rank[mark]>rank[result[letter]])result[letter]=mark;
    }));
    return result;
  },[answer,guesses]);

  const reset=()=>{setDraft("");setGuesses([]);setMessage("");persist([]);};

  return (
    <div className="game-panel word-game">
      <div className="game-status"><span>DIZIONARIO V. {DICTIONARY_VERSION}</span><span>{guesses.length}/6 · {seconds}s</span><button onClick={reset}>RIPROVA</button></div>
      <div className="word-board" aria-label="Griglia dei tentativi">
        {Array.from({length:6},(_,row)=>{
          const value=guesses[row]??(row===guesses.length?draft:"");
          const marks=guesses[row]?evaluateGuess(guesses[row],answer):[];
          return Array.from({length:5},(_,col)=><i key={`${row}-${col}`} className={marks[col]??""} data-state={marks[col]??"vuota"}>{value[col]??""}</i>);
        })}
      </div>
      <div className="keyboard">{keyboard.map((row)=><div key={row}>{row.split("").map((letter)=><button className={letterStates[letter]??""} key={letter} onClick={()=>key(letter)}>{letter}</button>)}</div>)}<div><button className="wide" onClick={()=>key("INVIO")}>INVIO</button><button className="wide" onClick={()=>key("⌫")}>⌫</button></div></div>
      {message&&<p className="word-message" role="status">{message}</p>}
      {over&&<div className="result-panel"><h2>{won?answer:`Era ${answer}`}</h2><p>{won?`Risolta in ${guesses.length} tentativi.`:"I sei tentativi sono terminati e il risultato è stato salvato."}</p><p>{solutionNotes[answer]}</p></div>}
    </div>
  );
}
