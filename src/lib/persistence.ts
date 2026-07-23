import type { GameProgress } from "../games/types";

const DB_NAME = "conventional-vol-1";
const STORE = "progress";
const LOCAL_KEY = "conventional-vol-1-progress";
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

function localSnapshot(): unknown {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function reconcile(first: PersistedState, second: PersistedState): PersistedState {
  const games = { ...first.games };
  Object.entries(second.games).forEach(([id, progress]) => {
    if (!games[id] || progress.updatedAt >= games[id].updatedAt) games[id] = progress;
  });
  return {
    version: SCHEMA_VERSION,
    games,
    nickname: isValidNickname(second.nickname) ? second.nickname : first.nickname,
  };
}

export async function loadState(): Promise<PersistedState> {
  const local = migrateState(localSnapshot());
  try {
    const db = await openDb();
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).get("state");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return reconcile(migrateState(value), local);
  } catch {
    return local;
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch {
    // IndexedDB remains available when localStorage is blocked or full.
  }
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
