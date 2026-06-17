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
};

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
