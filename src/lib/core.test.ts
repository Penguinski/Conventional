import { describe, expect, it } from "vitest";
import { classifyPath } from "../games/desire-path/logic";
import { evaluateGuess } from "../games/five-letters/logic";
import { entries, solutionCells, validateCrossword } from "../games/crossword/logic";
import { compareLowerIsBetter, normalizeStrokes } from "./scoring";
import { isValidNickname, makeNickname, migrateState, SCHEMA_VERSION } from "./persistence";

describe("Cinque tracce", () => {
  it("consuma correttamente le lettere duplicate", () => {
    expect(evaluateGuess("TAZZA", "TRACC")).toEqual(["correct", "present", "absent", "absent", "absent"]);
    expect(evaluateGuess("PASSO", "SEGNO")).toEqual(["absent", "absent", "present", "absent", "correct"]);
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
    expect(classifyPath([{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 100 }])).toBe("scorciatoia");
    expect(classifyPath([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 50 }, { x: 100, y: 100 }])).toBe("ufficiale");
    expect(classifyPath([{ x: 0, y: 0 }, { x: 70, y: 0 }, { x: 70, y: 70 }, { x: 100, y: 100 }])).toBe("ibrido");
  });
});
