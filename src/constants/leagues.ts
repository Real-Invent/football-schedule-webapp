import type { League } from "../types";

// リーグ・競技のマスタデータ
// W杯、Jリーグ、海外サッカー、F1、オリンピックの5大リーグ定義
export const LEAGUES: Record<string, League> = {
  wc2026: { label: "FIFA W杯", color: "#0E9F6E" },
  jleague: { label: "Jリーグ", color: "#C8102E" },
  intl: { label: "海外サッカー", color: "#2563EB" },
  f1: { label: "F1", color: "#E10600" },
  olympic: { label: "オリンピック", color: "#0A66C2" },
};
