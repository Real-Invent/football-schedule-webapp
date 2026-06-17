import dotenv from "dotenv";
import type { Event } from "../src/types";

dotenv.config();

// ====== 放送局ルール（fetch-schedule.ts から引用）======
const BROADCASTER_RULES = {
  wc2026: {
    default: ["dazn"],
    overrides: [
      { test: (t: string) => /日本|Japan/i.test(t), casts: ["dazn", "nhk", "ntv", "fuji"] },
    ],
  },
  intl: {
    default: [],
    byCompetition: {
      PL: ["unext", "abema"],
      PD: ["wowow", "abema"],
      SA: ["dazn"],
      CL: ["wowow", "unext"],
    },
  },
  f1: { default: ["dazn", "sky"] },
};

// football-data.org の生データ形式を確認
async function testFootballDataFormat() {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    console.error("❌ FOOTBALL_DATA_TOKEN 環境変数が設定されていません");
    console.log("   設定方法: export FOOTBALL_DATA_TOKEN=your_token");
    return;
  }

  try {
    const url = `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=2026-06-14&dateTo=2026-06-22`;
    console.log(`🔍 API呼び出し: ${url}\n`);

    const res = await fetch(url, { headers: { "X-Auth-Token": token } });
    if (!res.ok) {
      console.error(`❌ API エラー: ${res.status} ${res.statusText}`);
      return;
    }

    const data = await res.json();

    // 複数のマッチを処理して casts を付け足す
    console.log("✅ casts を付け足した完全な Event データ（最初の3件）:\n");
    if (data.matches && data.matches.length > 0) {
      for (let i = 0; i < Math.min(3, data.matches.length); i++) {
        const event = convertToEventWithCasts(data.matches[i]);
        console.log(`【マッチ ${i + 1}】`);
        console.log(JSON.stringify(event, null, 2));
        console.log("");
      }
    }
  } catch (e) {
    console.error("❌ エラー:", (e as Error).message);
  }
}

// football-data.org の API応答を Event型に変換（casts付き）
function convertToEventWithCasts(m: any): Event {
  const { date, day, time } = toJst(m.utcDate);
  const base = {
    id: `fb-${m.id}`,
    lg: "wc2026" as const,
    date,
    day,
    time,
    title: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
    cat: m.stage ?? "",
    _competition: "WC",
  };
  return { ...base, casts: resolveCasts(base) };
}

function resolveCasts(ev: any): string[] {
  const rule = BROADCASTER_RULES[ev.lg as keyof typeof BROADCASTER_RULES];
  if (!rule) return [];
  if (rule.byCompetition?.[ev._competition]) {
    return rule.byCompetition[ev._competition];
  }
  for (const o of rule.overrides ?? []) {
    if (o.test(ev.title)) return o.casts;
  }
  return rule.default ?? [];
}

function toJst(utcString: string): { date: string; day: string; time: string } {
  const d = new Date(utcString);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}`,
    day: "日月火水木金土"[jst.getUTCDay()],
    time: `${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`,
  };
}

testFootballDataFormat();
