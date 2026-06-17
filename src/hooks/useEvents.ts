import { useState, useMemo, useEffect } from "react";
import type { Event } from "../types";
import { SAMPLE_EVENTS } from "../constants/sampleEvents";

// カスタムフック: イベント管理・フィルタリング・検索を一元管理
export function useEvents() {
  const [events, setEvents] = useState<Event[]>(SAMPLE_EVENTS);
  const [activeLeagues, setActiveLeagues] = useState<Set<string>>(new Set());
  const [activeCasts, setActiveCasts] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string | number>>(new Set());

  // 起動時に自動生成された日程を読み込む（失敗時はサンプルのまま）
  useEffect(() => {
    loadEvents().then(setEvents);
  }, []);

  // localStorage からお気に入りを復元
  useEffect(() => {
    const stored = localStorage.getItem("favorites");
    if (stored) {
      try {
        setFavorites(new Set(JSON.parse(stored)));
        console.log('これは復元する関数です', stored);
      } catch {
        // 破損していたら無視
      }
    }
  }, []);

  // favorites が変更されたら localStorage に保存
  useEffect(() => {
    if (favorites && favorites.size > 0) {
      localStorage.setItem("favorites", JSON.stringify([...favorites]));
      console.log('これは変更されたら保存される関数です', favorites);
    }
  }, [favorites]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (key: string) =>
    setter((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
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
      next.has(eventId) ? next.delete(eventId) : next.add(eventId);
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

  const groups = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of filtered) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return [...map.entries()];
  }, [filtered]);

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
    const res = await fetch("/data/events.json", { cache: "no-store" });
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    return Array.isArray(data) && data.length ? data : SAMPLE_EVENTS;
  } catch {
    return SAMPLE_EVENTS;
  }
}
