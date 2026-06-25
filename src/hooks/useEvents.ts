import { useState, useMemo, useEffect } from "react";
import type { Event, ResultsMap } from "../types";
import { SAMPLE_EVENTS } from "../constants/sampleEvents";
import { MATCH_DURATION_MINUTES } from "../constants/match";

// localStorage からお気に入りを復元
function loadFavorites(): Set<string | number> {
  const stored = localStorage.getItem("favorites");
  if (stored) {
    try {
      return new Set(JSON.parse(stored));
    } catch {
      // 破損していたら無視
    }
  }
  return new Set();
}

// カスタムフック: イベント管理・フィルタリング・検索を一元管理
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeLeagues, setActiveLeagues] = useState<Set<string>>(new Set());
  const [activeCasts, setActiveCasts] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string | number>>(loadFavorites);

  // 起動時に自動生成された日程を読み込む（失敗時はサンプルのまま）
  useEffect(() => {
    loadEvents().then(setEvents);
  }, []);

  // favorites が変更されたら localStorage に保存
  useEffect(() => {
    if (favorites.size > 0) {
      localStorage.setItem("favorites", JSON.stringify([...favorites]));
    } else {
      localStorage.removeItem("favorites");
    }
  }, [favorites]);

  // 開催中の試合を判定（現在時刻とイベント時刻を毎回比較）
  const isOngoingNow = useMemo(() => {
    const now = new Date();
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const jstDateStr = `${jstNow.getUTCFullYear()}-${String(jstNow.getUTCMonth() + 1).padStart(2, "0")}-${String(jstNow.getUTCDate()).padStart(2, "0")}`;
    const currentMinutes = jstNow.getUTCHours() * 60 + jstNow.getUTCMinutes();

    return events.some((e) => {
      if (e.date !== jstDateStr) return false;
      const [h, m] = e.time.split(":").map(Number);
      const eventStartMinutes = h * 60 + m;
      return currentMinutes >= eventStartMinutes && currentMinutes < eventStartMinutes + MATCH_DURATION_MINUTES;
    });
  }, [events]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (key: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

  const toggleLeague = toggle(setActiveLeagues);
  const toggleCast = toggle(setActiveCasts);

  const activeFilterCount =
    activeLeagues.size + activeCasts.size + (favOnly ? 1 : 0);

  const clearAll = () => {
    setActiveLeagues(new Set());
    setActiveCasts(new Set());
    setFavOnly(false);
    setQuery("");
  };

  const toggleFavorite = (eventId: string | number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    return events
      .filter((e) =>
        query.trim() === "" ? true : e.title.includes(query.trim())
      )
      .filter((e) =>
        activeLeagues.size === 0 ? true : activeLeagues.has(e.lg)
      )
      .filter((e) =>
        activeCasts.size === 0 ? true : e.casts.some((c) => activeCasts.has(c))
      )
      .filter((e) => {
        const isFav = favorites.has(e.id);
        return favOnly ? isFav : true;
      })
      .sort((a, b) =>
        a.date === b.date
          ? toMinutes(a.time) - toMinutes(b.time)
          : a.date < b.date ? -1 : 1
      );
  }, [events, query, activeLeagues, activeCasts, favOnly, favorites]);

  const map = new Map();
  for (const e of filtered) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date).push(e);   // 同じ日付の試合を同じ箱に入れていく
  }
  const groups = [...map.entries()];  // [日付, 試合の配列] のリストになる

  return {
    events,
    activeLeagues,
    activeCasts,
    query,
    favOnly,
    favorites,
    filtered,
    groups,
    activeFilterCount,
    isOngoing: isOngoingNow,
    toggleLeague,
    toggleCast,
    setQuery,
    setFavOnly,
    toggleFavorite,
    clearAll,
  };
}

// "26:00" のような深夜表記をソート用の数値に変換
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// 自動生成された日程(events.json)を読み込む。失敗時はサンプルを返す。
async function loadEvents(): Promise<Event[]> {
  try {
    const [eventsRes, resultsRes] = await Promise.all([
      fetch("/data/events.json", { cache: "no-store" }),
      fetch("/data/results.json", { cache: "no-store" }),
    ]);

    if (!eventsRes.ok) throw new Error("events.json not found");
    const events: Event[] = await eventsRes.json();
    if (!Array.isArray(events) || !events.length) return SAMPLE_EVENTS;

    // 結果データを結合
    if (resultsRes.ok) {
      const resultsMap: ResultsMap = await resultsRes.json();
      return events.map((e) => ({
        ...e,
        result: resultsMap[e.id as string],
      }));
    }

    return events;
  } catch {
    return SAMPLE_EVENTS;
  }
}
