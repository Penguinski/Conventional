import type { GameProgress } from "../games/types";

const DB_NAME = "conventional-vol-1";
const STORE = "progress";
export const SCHEMA_VERSION = 2;

export interface PersistedState {
  version: number;
  games: Record<string, GameProgress>;
  nickname: string;
}

const adjectives = ["Stanco", "Sbeccata", "Perso", "Piegata", "Consunto", "Spostata"];
const objects = ["Calzino", "Tazza", "Ombrello", "Lista", "Pomello", "Chiave"];

export function makeNickname(seed: number): string {
  const safe = Math.abs(Math.floor(seed));
  return `${objects[safe % objects.length]} ${adjectives[Math.floor(safe / objects.length) % adjectives.length]} ${String(safe % 100).padStart(2, "0")}`;
}

export function isValidNickname(value: string): boolean {
  const pattern = new RegExp(`^(${objects.join("|")}) (${adjectives.join("|")}) \\d{2}$`);
  return pattern.test(value);
}

export function migrateState(value: unknown): PersistedState {
  const fallback: PersistedState = {
    version: SCHEMA_VERSION,
    games: {},
    nickname: makeNickname(Date.now()),
  };
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Partial<PersistedState> & { completed?: string[] };
  if (raw.version === 1 && Array.isArray(raw.completed)) {
    const games = Object.fromEntries(raw.completed.map((id) => [id, {
      state: "completed" as const,
      updatedAt: Date.now(),
    }]));
    return { ...fallback, games };
  }
  if (raw.version === SCHEMA_VERSION && raw.games && typeof raw.games === "object") {
    return {
      version: SCHEMA_VERSION,
      games: raw.games,
      nickname: isValidNickname(raw.nickname ?? "") ? raw.nickname! : fallback.nickname,
    };
  }
  return fallback;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadState(): Promise<PersistedState> {
  try {
    const db = await openDb();
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).get("state");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return migrateState(value);
  } catch {
    return migrateState(undefined);
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(state, "state");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  } catch {
    // The magazine remains playable if private browsing blocks IndexedDB.
  }
}
