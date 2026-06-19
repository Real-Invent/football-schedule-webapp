import type { LucideIcon } from "lucide-react";

export type Event = {
  id: string | number;
  lg: "wc2026" | "jleague" | "intl" | "f1" | "olympic";
  date: string; // YYYY-MM-DD
  day: string; // 日・月・火・水・木・金・土
  time: string; // HH:MM
  title: string;
  cat: string;
  casts: string[];
  result?: MatchResult | F1Result;
};

// 試合結果データ（別ファイル results.json で管理）
export type MatchResult = {
  status: "finished" | "ongoing" | "scheduled";
  score?: {
    home: number;
    away: number;
    winner?: "home" | "away" | "draw";
  };
  penalties?: {
    home: number;
    away: number;
  };
  teams?: {
    home: { id: number; crest?: string };
    away: { id: number; crest?: string };
  };
};

export type F1Standing = {
  position: number;
  points: number;
  driver: string;
  constructor: string;
  status: string;
};

export type ChampionshipStanding = {
  position: number;
  driver: string;
  constructor: string;
  points: number;
  wins: number;
};

export type F1Result = {
  status: "finished" | "ongoing" | "scheduled";
  standings?: F1Standing[];
};

export type Result = MatchResult | F1Result;

// results.json の全体構造
export type ResultsMap = Record<string, Result>;

export type League = {
  label: string;
  color: string;
};

export type Broadcaster = {
  label: string;
  kind: "配信" | "地上波" | "BS" | "CS";
  chip: string;
  icon: LucideIcon;
};
