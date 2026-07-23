export type LetterMark = "correct" | "present" | "absent";
export const DICTIONARY_VERSION = 2;

export function evaluateGuess(guess:string,answer:string):LetterMark[]{
  const marks:LetterMark[]=Array(answer.length).fill("absent");
  const remaining=new Map<string,number>();
  for(let index=0;index<answer.length;index+=1){
    if(guess[index]===answer[index])marks[index]="correct";
    else remaining.set(answer[index],(remaining.get(answer[index])??0)+1);
  }
  for(let index=0;index<guess.length;index+=1){
    if(marks[index]==="correct")continue;
    const count=remaining.get(guess[index])??0;
    if(count>0){marks[index]="present";remaining.set(guess[index],count-1);}
  }
  return marks;
}

export const solutionWords=["SEGNO","USURA","CREPA","GESTO","PASSO","RESTO","TAZZA","FANGO","RUGHE","CALCO","ODORE","SCIAI"] as const;
export const acceptedWords=[
  ...solutionWords,
  "ABITO","ACERO","ACIDO","ACQUA","ALONE","AMICO","AMORE","ANIMA","APICE","ARARE","ARENA","ARGINE","AROMA",
  "BANCO","BARCA","BORDO","BORSA","BRACE","BUCHI","CAMPO","CARTA","CASCO","CASSA","CERTO","CHIAVE","CIELO","CINTO",
  "COLLA","COLPO","CORDA","CORPO","COSTA","CRETA","CURVA","DENTE","DISCO","DONNA","FALDA","FELPA","FERMO","FIATO",
  "FIORE","FORMA","FORTE","FOSSA","FRENO","FRIGO","FRONTE","GAMBA","GESSO","GIRAI","GOMMA","GRADO","GRANO","LARGO",
  "LATTA","LENTO","LINEA","LISTA","LUOGO","MACCHIA","MAGRO","MALTA","MARCA","METRO","MIELE","NERBO","NODAI","OMBRA",
  "ONDAI","OPACO","ORMAI","PANNO","PAREO","PASTA","PIEGA","PIENO","PISTA","PORTA","PRESA","PUNTO","RAGNO","RAMEO",
  "RETRO","RIGHE","RUOTA","SASSO","SCALA","SCOPO","SEDIA","SENNO","SENSO","SPAGO","SPINA","STANZA","STIVA","SUOLA",
  "TAPPO","TERRA","TUBAI","VETRO","VIALE","ZAINO",
].map((word)=>word.toUpperCase()).filter((word)=>word.length===5);

export const solutionNotes:Record<string,string>={
  SEGNO:"Un segno è intenzione oppure residuo: spesso lo decide chi arriva dopo.",
  USURA:"L'usura misura una ripetizione senza bisogno di conoscere chi l'ha compiuta.",
  CREPA:"La crepa rende visibile il tempo come linea.",
  GESTO:"Un gesto breve può diventare regola quando viene ripetuto.",
  PASSO:"Il passo scompare; la superficie conserva una versione ridotta del suo peso.",
  RESTO:"Il resto non è soltanto avanzo: è una prova che qualcosa è accaduto.",
  TAZZA:"La tazza lascia cerchi, calore e un posto momentaneamente occupato.",
  FANGO:"Il fango viaggia sotto la scarpa e ridisegna il pavimento.",
  RUGHE:"Le rughe sono pieghe del tempo, non errori da correggere.",
  CALCO:"Il calco trasforma un vuoto in una forma trasportabile.",
  ODORE:"L'odore è una traccia senza bordo visibile.",
  SCIAI:"Una scia esiste soltanto dopo un movimento.",
};

export function dailyWord(date=new Date()):string{
  const day=Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000);
  return solutionWords[Math.abs(day)%solutionWords.length];
}

export function dayKey(date=new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
