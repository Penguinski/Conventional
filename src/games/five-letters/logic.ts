export type LetterMark = "correct" | "present" | "absent";

export function evaluateGuess(guess: string, answer: string): LetterMark[] {
  const marks: LetterMark[] = Array(answer.length).fill("absent");
  const remaining = new Map<string, number>();
  for (let i = 0; i < answer.length; i += 1) {
    if (guess[i] === answer[i]) marks[i] = "correct";
    else remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1);
  }
  for (let i = 0; i < guess.length; i += 1) {
    if (marks[i] === "correct") continue;
    const count = remaining.get(guess[i]) ?? 0;
    if (count > 0) { marks[i] = "present"; remaining.set(guess[i], count - 1); }
  }
  return marks;
}

export const words = ["SEGNO", "USURA", "CREPA", "GESTO", "PASSO", "RESTO", "TAZZA", "FANGO", "RUGHE", "CALCO", "ODORE", "SCIAI"];
export function dailyWord(date = new Date()): string {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return words[Math.abs(day) % words.length];
}
