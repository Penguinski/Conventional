export const dishClues = [
  { id:"pan",title:"Padella",body:"Salsa di pomodoro fresca; dentro c'è il cucchiaio rosso che Marta usa sempre.",x:58,y:28 },
  { id:"stove",title:"Fornello",body:"Il fornello anteriore è ancora tiepido: la padella è stata usata dopo le 19:30.",x:45,y:32 },
  { id:"teo-plate",title:"Piatto blu",body:"Chicchi di riso freddo e nessuna traccia di pomodoro: coincide con la cena dichiarata da Teo.",x:72,y:67 },
  { id:"nora-receipt",title:"Ricevuta",body:"Cena al ristorante alle 19:38, mentre il fornello di casa veniva usato.",x:20,y:70 },
  { id:"marta-mug",title:"Tazza verde",body:"La bustina è ancora sigillata e la tazza è asciutta: la tisana dichiarata da Marta non è stata preparata.",x:31,y:42 },
] as const;

export const dishSuspects = [
  { id:"nora",name:"Nora",statement:"Sono uscita prima di cena." },
  { id:"teo",name:"Teo",statement:"Ho mangiato il riso avanzato, senza usare i fornelli." },
  { id:"marta",name:"Marta",statement:"Ho preso soltanto una tisana." },
] as const;

export function evaluateAccusation(suspect:string, seen:string[]) {
  if (suspect !== "marta") {
    const reason = suspect === "nora"
      ? "La ricevuta colloca Nora fuori casa quando il fornello era acceso."
      : "Il piatto blu conferma il riso freddo di Teo e non contiene pomodoro.";
    return { solved:false, message: seen.length ? reason : "Puoi accusare subito, ma non hai ancora una traccia che contraddica questa versione." };
  }
  const required = ["pan","marta-mug"];
  const missing = required.filter((id)=>!seen.includes(id));
  if (missing.length) {
    return {
      solved:false,
      message: missing.includes("pan")
        ? "Manca ancora una traccia che colleghi qualcuno alla padella."
        : "Il cucchiaio è un indizio, ma devi ancora verificare la tisana dichiarata.",
    };
  }
  return {
    solved:true,
    message:"Il cucchiaio rosso collega Marta alla salsa; tazza asciutta e bustina sigillata smentiscono la sua unica alternativa dichiarata.",
  };
}
