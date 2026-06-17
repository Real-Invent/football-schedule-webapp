import { Search, Tv, Radio, Satellite, Wifi } from "lucide-react";
import type { Broadcaster } from "../types";

// 放送局・配信サービスのマスタデータ
// DAZN、ABEMA、NHK、フジテレビなど、スポーツを放送している全サービス定義
export const BROADCASTERS: Record<string, Broadcaster> = {
  dazn: { label: "DAZN", kind: "配信", chip: "#111827", icon: Wifi },
  abema: { label: "ABEMA", kind: "配信", chip: "#00A040", icon: Wifi },
  unext: { label: "U-NEXT", kind: "配信", chip: "#1A1A1A", icon: Wifi },
  nhk: { label: "NHK総合", kind: "地上波", chip: "#E5004F", icon: Radio },
  ntv: { label: "日本テレビ", kind: "地上波", chip: "#D81E2C", icon: Tv },
  fuji: { label: "フジテレビ", kind: "地上波", chip: "#1D6FB8", icon: Tv },
  nhkbs: { label: "NHK BS 4K", kind: "BS", chip: "#7C3AED", icon: Satellite },
  wowow: { label: "WOWOW", kind: "BS", chip: "#003DA5", icon: Satellite },
  sky: { label: "スカパー!", kind: "CS", chip: "#EA7A1E", icon: Satellite },
};
