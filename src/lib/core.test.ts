import { describe, expect, it } from "vitest";
import { analyzePath, classifyPath, FINISH, MAZE_REACHABLE, MAZE_SOLUTION, START } from "../games/desire-path/logic";
import { acceptedWords, DICTIONARY_VERSION, evaluateGuess, solutionWords } from "../games/five-letters/logic";
import { entries, solutionCells, validateCrossword } from "../games/crossword/logic";
import { evaluateAccusation } from "../games/dish-mystery/logic";
import { compareLowerIsBetter, normalizeStrokes } from "./scoring";
import { isValidNickname, makeNickname, migrateState, SCHEMA_VERSION } from "./persistence";
import { pointFromPointer } from "./pointer-stroke";

describe("Cinque tracce", () => {
  it("consuma correttamente le lettere duplicate", () => {
    expect(evaluateGuess("TAZZA", "TRACC")).toEqual(["correct", "present", "absent", "absent", "absent"]);
    expect(evaluateGuess("PASSO", "SEGNO")).toEqual(["absent", "absent", "present", "absent", "correct"]);
  });
  it("separa soluzioni e dizionario accettato", () => {
    expect(DICTIONARY_VERSION).toBeGreaterThan(1);
    expect(acceptedWords.length).toBeGreaterThan(solutionWords.length * 4);
    expect(solutionWords.every((word) => acceptedWords.includes(word))).toBe(true);
  });
});

describe("cruciverba", () => {
  it("valida tutte le otto definizioni", () => {
    expect(entries).toHaveLength(8);
    const values = Object.fromEntries(solutionCells());
    expect(validateCrossword(values)).toBe(true);
    values["4-1"] = "X";
    expect(validateCrossword(values)).toBe(false);
  });
});

describe("punteggi e persistenza", () => {
  it("ordina completamento, metrica primaria e tempo", () => {
    expect(compareLowerIsBetter({ complete: true, primary: 2, time: 40 }, { complete: true, primary: 3, time: 20 })).toBeLessThan(0);
  });
  it("migra la versione uno", () => {
    const value = migrateState({ version: 1, completed: ["intruso"] });
    expect(value.version).toBe(SCHEMA_VERSION);
    expect(value.games.intruso.state).toBe("completed");
  });
  it("genera solo nickname curati", () => {
    expect(isValidNickname(makeNickname(42))).toBe(true);
    expect(isValidNickname("Admin Gratis 99")).toBe(false);
  });
  it("normalizza e limita le pennellate", () => {
    expect(normalizeStrokes([{ x: -1, y: 20 }, { x: 120, y: 40 }], 100, 40)).toEqual([{ x: 0, y: .5 }, { x: 1, y: 1 }]);
    expect(normalizeStrokes(Array.from({ length: 4001 }, () => ({ x: 1, y: 1 })), 100, 100)).toEqual([]);
  });
});

describe("labirinto", () => {
  it("classifica percorso ufficiale, scorciatoia e ibrido", () => {
    const shortcut = [START, FINISH];
    const official = MAZE_SOLUTION;
    const hybrid = [START, { x:30, y:220 }, { x:30, y:400 }, { x:180, y:400 }, FINISH];
    expect(classifyPath(shortcut)).toBe("scorciatoia");
    expect(classifyPath(official)).toBe("ufficiale");
    expect(classifyPath(hybrid)).toBe("ibrido");
    expect(analyzePath(shortcut)).toMatchObject({ startValid:true, endValid:true });
  });
  it("ha un percorso deterministico raggiungibile senza attraversare muri", () => {
    expect(MAZE_REACHABLE).toBe(true);
    expect(MAZE_SOLUTION.length).toBeGreaterThan(12);
    expect(analyzePath(MAZE_SOLUTION)).toMatchObject({ crossings:[], startValid:true, endValid:true });
  });
});

describe("motore pointer", () => {
  it("estrae subito coordinate logiche e pressione", () => {
    const canvas = { getBoundingClientRect: () => ({ left:10, top:20, width:200, height:100 }) } as HTMLCanvasElement;
    expect(pointFromPointer({ clientX:110, clientY:70, pressure:.7 }, canvas, 400, 300)).toEqual({ x:200, y:150, pressure:.7 });
  });
});

describe("caso dei piatti", () => {
  it("richiede la catena di due evidenze senza bloccare l'accusa", () => {
    expect(evaluateAccusation("marta", [])).toMatchObject({ solved:false });
    expect(evaluateAccusation("marta", ["pan"])).toMatchObject({ solved:false });
    expect(evaluateAccusation("marta", ["pan","marta-mug"])).toMatchObject({ solved:true });
    expect(evaluateAccusation("teo", ["teo-plate"])).toMatchObject({ solved:false });
  });
});
