import dotenv from "dotenv";
import { writeFileSync } from "node:fs";
import type { Event, MatchResult, F1Result, ResultsMap, ChampionshipStanding } from "../src/types";

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
  // 2026年ワールドカップ参加国
  Japan: "日本",
  Algeria: "アルジェリア",
  Argentina: "アルゼンチン",
  Australia: "オーストラリア",
  Austria: "オーストリア",
  Belgium: "ベルギー",
  "Bosnia-Herzegovina": "ボスニア",
  Brazil: "ブラジル",
  Canada: "カナダ",
  "Cape Verde Islands": "カーボベルデ",
  Czechia: "チェコ",
  Colombia: "コロンビア",
  "Congo DR": "DRコンゴ",
  Croatia: "クロアチア",
  Curaçao: "キュラソー",
  Ecuador: "エクアドル",
  Egypt: "エジプト",
  England: "イングランド",
  France: "フランス",
  Germany: "ドイツ",
  Ghana: "ガーナ",
  Haiti: "ハイチ",
  Iran: "イラン",
  Iraq: "イラク",
  "Ivory Coast": "コートジボワール",
  Jordan: "ヨルダン",
  Mexico: "メキシコ",
  Morocco: "モロッコ",
  Netherlands: "オランダ",
  "New Zealand": "ニュージーランド",
  Norway: "ノルウェー",
  Panama: "パナマ",
  Paraguay: "パラグアイ",
  Portugal: "ポルトガル",
  Qatar: "カタール",
  "Saudi Arabia": "サウジアラビア",
  Scotland: "スコットランド",
  Senegal: "セネガル",
  "South Africa": "南アフリカ",
  "South Korea": "韓国",
  Spain: "スペイン",
  Sweden: "スウェーデン",
  Switzerland: "スイス",
  Tunisia: "チュニジア",
  Turkey: "トルコ",
  "United States": "アメリカ",
  Uruguay: "ウルグアイ",
  Uzbekistan: "ウズベキスタン",
  // クラブチーム
  "Real Madrid CF": "レアル・マドリード",
  "FC Barcelona": "バルセロナ",
};
export const ja = (name: string) => TEAM_JA[name] ?? name;

// ====== F1グランプリの日本語化 ======
const F1_GP_JA: Record<string, string> = {
  "Abu Dhabi Grand Prix": "アブダビGP",
  "Australian Grand Prix": "オーストラリアンGP",
  "Austrian Grand Prix": "オーストリアンGP",
  "Azerbaijan Grand Prix": "アゼルバイジャンGP",
  "Azerbaijani Grand Prix": "アゼルバイジャンGP",
  "Barcelona Grand Prix": "バルセロナGP",
  "Belgian Grand Prix": "ベルギーGP",
  "Brazilian Grand Prix": "ブラジルGP",
  "British Grand Prix": "イギリスGP",
  "Canadian Grand Prix": "カナダGP",
  "Chinese Grand Prix": "中国GP",
  "Dutch Grand Prix": "オランダGP",
  "Emilia Romagna Grand Prix": "エミリア・ロマーニャGP",
  "Hungarian Grand Prix": "ハンガリーGP",
  "Italian Grand Prix": "イタリアンGP",
  "Japanese Grand Prix": "日本GP",
  "Las Vegas Grand Prix": "ラスベガスGP",
  "Mexico City Grand Prix": "メキシコシティGP",
  "Mexican Grand Prix": "メキシコGP",
  "Miami Grand Prix": "マイアミGP",
  "Monaco Grand Prix": "モナコGP",
  "Qatar Grand Prix": "カタールGP",
  "Saudi Arabian Grand Prix": "サウジアラビアGP",
  "Singapore Grand Prix": "シンガポールGP",
  "Spanish Grand Prix": "スペインGP",
  "United States Grand Prix": "アメリカGP",
};
export const f1ja = (gp: string) => F1_GP_JA[gp] ?? gp;

// ====== カテゴリーの日本語化 ======
const CAT_JA: Record<string, string> = {
  "GROUP_STAGE": "グループステージ",
  "LAST_32": "決勝トーナメント1回戦",
  "LAST_16": "決勝トーナメント2回戦",
  "QUARTER_FINALS": "準々決勝",
  "SEMI_FINALS": "準決勝",
  "THIRD_PLACE": "3位決定戦",
  "FINAL": "決勝",
};
export const catja = (cat: string) => CAT_JA[cat] ?? cat;

// ====== ③ サッカー日程の取得（football-data.org）======
export async function fetchFootball(
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
      cat: catja(m.stage ?? ""),
      _competition: competitionCode,
    };
    return { ...base, casts: resolveCasts(base) };
  });
}

// ====== ④ F1日程の取得（Jolpica / 旧Ergast互換）======
export async function fetchF1(season: number): Promise<Event[]> {
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

// ====== ④-2 サッカー試合結果の取得（football-data.org）======
export async function fetchFootballResults(
  competitionCode: string,
  dateFrom: string,
  dateTo: string
): Promise<Record<string, MatchResult>> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) throw new Error("FOOTBALL_DATA_TOKEN is not set");
  const url = `https://api.football-data.org/v4/competitions/${competitionCode}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  const res = await fetch(url, { headers: { "X-Auth-Token": token } });
  if (!res.ok) throw new Error(`football-data ${competitionCode}: ${res.status}`);
  const data: any = await res.json();
  console.log(`[DEBUG] ${competitionCode}: retrieved ${data.matches?.length ?? 0} matches`);

  const results: Record<string, MatchResult> = {};
  for (const m of data.matches ?? []) {
    const id = `fb-${m.id}`;
    const status = m.status === "FINISHED" ? "finished" : m.status === "LIVE" ? "ongoing" : "scheduled";

    const result: MatchResult = {
      status,
      teams: {
        home: {
          id: m.homeTeam?.id ?? 0,
          crest: m.homeTeam?.crest,
        },
        away: {
          id: m.awayTeam?.id ?? 0,
          crest: m.awayTeam?.crest,
        },
      },
    };

    if (status === "finished" && m.score) {
      const home = m.score.fullTime?.home ?? 0;
      const away = m.score.fullTime?.away ?? 0;
      let winner: "home" | "away" | "draw";
      if (home > away) winner = "home";
      else if (away > home) winner = "away";
      else winner = "draw";

      result.score = { home, away, winner };

      if (m.score.halfTime) {
        result.halfTime = {
          home: m.score.halfTime.home ?? 0,
          away: m.score.halfTime.away ?? 0,
        };
      }

      if (m.score.penalties) {
        result.penalties = {
          home: m.score.penalties.home ?? 0,
          away: m.score.penalties.away ?? 0,
        };
      }
    }

    results[id] = result;
  }
  return results;
}

// ====== ④-2-5 F1チャンピオンシップ順位表の取得（Ergast API）======
export async function fetchF1Championship(season: number): Promise<ChampionshipStanding[]> {
  const url = `https://api.jolpi.ca/ergast/f1/${season}/driverstandings.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`jolpica championship: ${res.status}`);
  const data: any = await res.json();

  const standings = data.MRData.StandingsTable.StandingsLists?.[0]?.DriverStandings ?? [];
  return standings.map((d: any) => ({
    position: parseInt(d.position),
    driver: `${d.Driver.givenName} ${d.Driver.familyName}`,
    constructor: d.Constructors?.[0]?.name ?? "Unknown",
    points: parseInt(d.points),
    wins: parseInt(d.wins),
  }));
}

// ====== ④-3 F1レース結果の取得（Ergast API）======
export async function fetchF1Results(season: number): Promise<Record<string, F1Result>> {
  const racesUrl = `https://api.jolpi.ca/ergast/f1/${season}.json`;
  const racesRes = await fetch(racesUrl);
  if (!racesRes.ok) throw new Error(`jolpica f1: ${racesRes.status}`);
  const racesData: any = await racesRes.json();
  const races = racesData.MRData.RaceTable.Races ?? [];

  const results: Record<string, F1Result> = {};

  for (const race of races) {
    const round = race.round;

    // 予選結果を取得
    try {
      const qualUrl = `https://api.jolpi.ca/ergast/f1/${season}/${round}/qualifying.json`;
      const qualRes = await fetch(qualUrl);
      if (qualRes.ok) {
        const qualData: any = await qualRes.json();
        const qualResults = qualData.MRData.RaceTable.Races?.[0];

        if (qualResults?.QualifyingResults) {
          const id = `f1-${round}-q`;
          results[id] = {
            status: "finished",
            standings: qualResults.QualifyingResults.map((res: any) => ({
              position: parseInt(res.position),
              points: 0,
              driver: `${res.Driver.givenName} ${res.Driver.familyName}`,
              constructor: res.Constructor.name,
              status: "Qualified",
            })),
          };
        }
      }
    } catch {
      // 予選結果取得失敗時は続行
    }

    // レース結果を取得
    try {
      const raceResultUrl = `https://api.jolpi.ca/ergast/f1/${season}/${round}/results.json`;
      const raceRes = await fetch(raceResultUrl);
      if (!raceRes.ok) continue;
      const raceData: any = await raceRes.json();
      const raceResults = raceData.MRData.RaceTable.Races?.[0];

      if (raceResults?.Results) {
        const id = `f1-${round}-r`;
        results[id] = {
          status: "finished",
          standings: raceResults.Results.map((res: any) => ({
            position: parseInt(res.position),
            points: parseInt(res.points),
            driver: `${res.Driver.givenName} ${res.Driver.familyName}`,
            constructor: res.Constructor.name,
            status: res.status,
          })),
        };
      }
    } catch {
      // レース結果取得失敗時は、このレースをスキップ
    }
  }
  return results;
}

export function mkF1(
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
    title: `${f1ja(gp)} ${cat}`,
    cat,
    _competition: "",
  };
  return { ...base, casts: resolveCasts(base) };
}

// ====== ⑤ 放送局を対応表から解決する ======
export function resolveCasts(ev: any): string[] {
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
export function toJst(utcString: string): { date: string; day: string; time: string } {
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
export function adjustMidnightTime(date: string, day: string, time: string): { date: string; day: string; time: string } {
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
  console.log("[DEBUG] main() started");
  const all: Event[] = [];
  const resultsMap: ResultsMap = {};
  let championship: ChampionshipStanding[] = [];

  try {
    // 2026年データを取得（過去含める。将来的に複数年対応時はここを拡張）
    const from = "2026-01-01";
    const to = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10);
    console.log(`[DEBUG] Fetching data from ${from} to ${to}`);

    console.log("\n📡 API から日程を取得中...");
    all.push(...(await fetchFootball("wc2026", "WC", from, to)));
    all.push(...(await fetchFootball("intl", "PL", from, to)));
    all.push(...(await fetchFootball("intl", "CL", from, to)));
    all.push(...(await fetchF1(2026)));

    console.log("\n📊 API から試合結果を取得中...");
    Object.assign(resultsMap, await fetchFootballResults("WC", from, to));
    Object.assign(resultsMap, await fetchFootballResults("PL", from, to));
    Object.assign(resultsMap, await fetchFootballResults("CL", from, to));
    Object.assign(resultsMap, await fetchF1Results(2026));

    console.log("\n🏆 API からドライバーランキングを取得中...");
    championship = await fetchF1Championship(2026);
  } catch (e) {
    console.error("❌ 取得エラー:", (e as Error).message);
    console.error((e as Error).stack);
    process.exit(1);
  }

  const events = all
    .map(({ _competition, ...rest }: any) => rest)
    .sort((a: Event, b: Event) =>
      (a.date + a.time).localeCompare(b.date + b.time)
    );

  writeFileSync("public/data/events.json", JSON.stringify(events, null, 2));
  writeFileSync("public/data/results.json", JSON.stringify(resultsMap, null, 2));
  writeFileSync("public/data/standings.json", JSON.stringify(championship, null, 2));

  console.log("\n========== ✅ スケジュール更新完了 ==========");
  console.log(`📅 取得日付範囲: 2026-01-01 ～ 2026-08-28`);
  console.log(`⚽ イベント数: ${events.length}件`);
  console.log(`   - ワールドカップ: ${events.filter(e => e.lg === "wc2026").length}件`);
  console.log(`   - 国際リーグ: ${events.filter(e => e.lg === "intl").length}件`);
  console.log(`   - F1: ${events.filter(e => e.lg === "f1").length}件`);
  console.log(`📊 試合結果: ${Object.keys(resultsMap).length}件`);
  console.log(`🏆 ドライバーランキング: ${championship.length}名`);
  console.log("=========================================\n");
}

export { main };

console.log("[DEBUG] About to call main()");
main().catch(err => {
  console.error("[DEBUG] Caught error:", err);
  process.exit(1);
});
console.log("[DEBUG] main() called");
