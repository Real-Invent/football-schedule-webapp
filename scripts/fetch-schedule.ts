import dotenv from "dotenv";
import { writeFileSync } from "node:fs";
import type { Event } from "../src/types";

dotenv.config();

// ====== ① 放送局の対応表（手動メンテ）======
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
    } as Record<string, string[]>,
  },
  f1: { default: ["dazn", "sky"] },
};

// ====== ② チーム名の日本語化（任意）======
const TEAM_JA: Record<string, string> = {
  Japan: "日本",
  Brazil: "ブラジル",
  "Real Madrid CF": "レアル・マドリード",
  "FC Barcelona": "バルセロナ",
};
const ja = (name: string) => TEAM_JA[name] ?? name;

// ====== ③ サッカー日程の取得（football-data.org）======
async function fetchFootball(
  lg: "wc2026" | "intl",
  competitionCode: string,
  dateFrom: string,
  dateTo: string
): Promise<Event[]> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) throw new Error("FOOTBALL_DATA_TOKEN is not set");
  const url = `https://api.football-data.org/v4/competitions/${competitionCode}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  const res = await fetch(url, { headers: { "X-Auth-Token": token } });
  if (!res.ok) throw new Error(`football-data ${competitionCode}: ${res.status}`);
  const data: any = await res.json();

  return (data.matches ?? []).map((m: any) => {
    const { date, day, time } = toJst(m.utcDate);
    const homeName = m.homeTeam?.name ?? "TBD";
    const awayName = m.awayTeam?.name ?? "TBD";
    const title = `${ja(homeName)} vs ${ja(awayName)}`;
    const base = {
      id: `fb-${m.id}`,
      lg,
      date,
      day,
      time,
      title,
      cat: m.stage ?? "",
      _competition: competitionCode,
    };
    return { ...base, casts: resolveCasts(base) };
  });
}

// ====== ④ F1日程の取得（Jolpica / 旧Ergast互換）======
async function fetchF1(season: number): Promise<Event[]> {
  const url = `https://api.jolpi.ca/ergast/f1/${season}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`jolpica f1: ${res.status}`);
  const data: any = await res.json();
  const races = data.MRData.RaceTable.Races ?? [];

  const events: Event[] = [];
  for (const r of races) {
    const gp = r.raceName;
    if (r.Qualifying) {
      const q = toJst(`${r.Qualifying.date}T${r.Qualifying.time}`);
      events.push(mkF1(`f1-${r.round}-q`, gp, "予選", q));
    }
    const race = toJst(`${r.date}T${r.time}`);
    events.push(mkF1(`f1-${r.round}-r`, gp, "決勝", race));
  }
  return events;
}

function mkF1(
  id: string,
  gp: string,
  cat: string,
  { date, day, time }: { date: string; day: string; time: string }
): Event {
  const base = {
    id,
    lg: "f1" as const,
    date,
    day,
    time,
    title: `${gp} ${cat}`,
    cat,
    _competition: "",
  };
  return { ...base, casts: resolveCasts(base) };
}

// ====== ⑤ 放送局を対応表から解決する ======
function resolveCasts(ev: any): string[] {
  const rule = BROADCASTER_RULES[ev.lg as keyof typeof BROADCASTER_RULES];
  if (!rule) return [];

  if ("byCompetition" in rule && rule.byCompetition[ev._competition as string]) {
    return rule.byCompetition[ev._competition as string];
  }

  if ("overrides" in rule) {
    for (const o of rule.overrides) {
      if (o.test(ev.title)) return o.casts;
    }
  }

  return rule.default ?? [];
}

// ====== ⑥ UTC → 日本時間(JST, +9h)へ変換 ======
function toJst(utcString: string): { date: string; day: string; time: string } {
  const d = new Date(utcString);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const result = {
    date: `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}`,
    day: "日月火水木金土"[jst.getUTCDay()],
    time: `${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`,
  };
  return adjustMidnightTime(result.date, result.day, result.time);
}

// ====== 早朝4時を基軸とした28時間表記に調整 ======
// 00:00～03:59 は前日の 24:00～27:59 に変換
function adjustMidnightTime(date: string, day: string, time: string): { date: string; day: string; time: string } {
  const [h, m] = time.split(":").map(Number);

  if (h < 4) {
    const prev = new Date(`${date}T00:00:00Z`);
    prev.setUTCDate(prev.getUTCDate() - 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    const newDate = `${prev.getUTCFullYear()}-${pad(prev.getUTCMonth() + 1)}-${pad(prev.getUTCDate())}`;
    const newTime = `${pad(h + 24)}:${pad(m)}`;
    const dayIndex = prev.getUTCDay();
    const newDay = "日月火水木金土"[dayIndex];
    return { date: newDate, day: newDay, time: newTime };
  }

  return { date, day, time };
}

// ====== ⑦ 実行 ======
async function main() {
  const all: Event[] = [];
  try {
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10);

    all.push(...(await fetchFootball("wc2026", "WC", from, to)));
    all.push(...(await fetchFootball("intl", "PL", from, to)));
    all.push(...(await fetchFootball("intl", "CL", from, to)));
    all.push(...(await fetchF1(2026)));
  } catch (e) {
    console.error("取得エラー:", (e as Error).message);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const events = all
    .filter((e: Event) => e.date >= today)
    .map(({ _competition, ...rest }: any) => rest)
    .sort((a: Event, b: Event) =>
      (a.date + a.time).localeCompare(b.date + b.time)
    );

  writeFileSync("public/data/events.json", JSON.stringify(events, null, 2));
  console.log(`✅ ${events.length}件を events.json に書き出しました`);
}

main();
