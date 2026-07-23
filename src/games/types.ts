import type { ComponentType } from "react";

export type GameCategory = "percorso" | "osservazione" | "mistero" | "parole" | "rituale";
export type PlayState = "new" | "in-progress" | "completed";

export interface GameProgress {
  state: PlayState;
  result?: Record<string, string | number | boolean>;
  updatedAt: number;
}

export interface GameProps {
  saved?: GameProgress;
  onProgress: (result?: GameProgress["result"]) => void;
  onComplete: (result?: GameProgress["result"]) => void;
}

export interface GameDefinition {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  category: GameCategory;
  intro: string;
  action: string;
  component: () => Promise<{ default: ComponentType<GameProps> }>;
  conclusion: string;
  sources?: Array<{ label: string; href: string }>;
}

export interface EditorialCard {
  id: string;
  type: "vignetta" | "nota" | "archivio" | "bacheca";
  title: string;
  body: string;
  action: string;
}
