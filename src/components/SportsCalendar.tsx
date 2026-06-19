import { useEffect, useRef } from "react";
import { Search, X, CalendarDays, Filter, Star } from "lucide-react";
import type { Event } from "../types";
import { useEvents } from "../hooks/useEvents";
import { LEAGUES } from "../constants/leagues";
import { BROADCASTERS } from "../constants/broadcasters";
import { COLORS } from "../constants/colors";
import { UI_TEXTS, UI_SIZES } from "../constants/ui";
import { FilterRow } from "./FilterRow";
import { FilterChip } from "./FilterChip";
import { EventCard } from "./EventCard";

export function SportsCalendar() {
  const {
    activeLeagues,
    activeCasts,
    query,
    favOnly,
    favorites,
    filtered,
    groups,
    activeFilterCount,
    isOngoing,
    toggleLeague,
    toggleCast,
    setQuery,
    setFavOnly,
    toggleFavorite,
    clearAll,
  } = useEvents();

  const todayRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (todayRef.current) {
      setTimeout(() => {
        const filterBar = document.querySelector("div.sticky") as HTMLElement | null;
        const filterHeight = filterBar?.offsetHeight ?? 0;
        const todayElement = todayRef.current;
        const scrollTop = (todayElement?.offsetTop ?? 0) - filterHeight - 10;
        window.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: "auto",
        });
      }, 0);
    }
  }, [groups]);

  const weekColor = (day: string) =>
    day === "土" ? COLORS.weekday.sat : day === "日" ? COLORS.weekday.sun : COLORS.weekday.default;

  const fmtDate = (iso: string) => {
    const [, mm, dd] = iso.split("-");
    return `${Number(mm)}/${Number(dd)}`;
  };

  return (
    <div style={{ background: COLORS.bg.primary, minHeight: "100vh" }} className="font-sans">
      <div className="mx-auto" style={{ maxWidth: UI_SIZES.container.maxWidth }}>
        {/* ===== ヘッダー ===== */}
        <header
          className="px-5 pt-6 pb-5 text-white"
          style={{ background: COLORS.bg.dark }}
        >
          <div className="flex items-center gap-2 mb-3">
            {isOngoing && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: COLORS.status.ongoingBg, color: COLORS.status.ongoingText }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {UI_TEXTS.header.badge}
              </span>
            )}
            <span className="text-[11px] tracking-widest text-slate-400 font-semibold">
              {UI_TEXTS.header.subtitle}
            </span>
          </div>
          <h1 className="text-[26px] leading-none font-black tracking-tight">
            {UI_TEXTS.header.title}
          </h1>
          <p className="text-slate-400 text-[13px] mt-2">
            {UI_TEXTS.header.description}
          </p>
        </header>

        {/* ===== 検索・フィルター（上部に貼り付く）===== */}
        <div
          className="sticky top-0 z-10 px-4 pt-3 pb-3 border-b border-slate-200"
          style={{ background: COLORS.bg.primary }}
        >
          {/* 検索ボックス */}
          <div className="relative mb-3">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={UI_TEXTS.search.placeholder}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-[14px] bg-white border border-slate-200 outline-none focus:border-slate-400"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                aria-label="検索をクリア"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* リーグ・競技フィルター */}
          <FilterRow label={UI_TEXTS.filter.league}>
            {Object.entries(LEAGUES).map(([key, l]) => (
              <FilterChip
                key={key}
                active={activeLeagues.has(key)}
                onClick={() => toggleLeague(key)}
                color={l.color}
                label={l.label}
              />
            ))}
          </FilterRow>

          {/* 放送局フィルター */}
          <FilterRow label={UI_TEXTS.filter.broadcast}>
            <FilterChip
              active={favOnly}
              onClick={() => setFavOnly((v: boolean) => !v)}
              color={COLORS.filter.favorite}
              icon={Star}
              label={UI_TEXTS.filter.favorite}
            />
            {Object.entries(BROADCASTERS).map(([key, b]) => (
              <FilterChip
                key={key}
                active={activeCasts.has(key)}
                onClick={() => toggleCast(key)}
                color={b.chip}
                icon={b.icon}
                label={b.label}
              />
            ))}
          </FilterRow>

          {/* 適用中フィルターの件数とクリア */}
          {(activeFilterCount > 0 || query) && (
            <div className="flex items-center justify-between mt-2 px-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                <Filter size={11} />
                {filtered.length}件を表示中
              </span>
              <button
                onClick={clearAll}
                className="text-[11px] text-slate-500 font-bold underline underline-offset-2"
              >
                すべて解除
              </button>
            </div>
          )}
        </div>

        {/* ===== イベント一覧 ===== */}
        <main className="px-4 py-4 pb-12">
          {groups.length === 0 && (
            <div className="text-center text-slate-500 py-16">
              <CalendarDays size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-[14px] font-semibold">
                {UI_TEXTS.empty.title}
              </p>
              <p className="text-[12px] mt-1">
                {UI_TEXTS.empty.description}
              </p>
            </div>
          )}

          {groups.map(([date, items]) => {
            const today = new Date().toISOString().slice(0, 10);
            const isToday = date === today;
            return (
              <section key={date} ref={isToday ? todayRef : null} className="mb-5">
                <div className="flex items-baseline gap-2 mb-2 px-1">
                  <span className="text-[18px] font-black text-slate-800 tabular-nums">
                    {fmtDate(date)}
                  </span>
                  <span
                    className="text-[12px] font-bold"
                    style={{ color: weekColor(items[0].day) }}
                  >
                    ({items[0].day})
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((e: Event) => (
                    <EventCard
                      key={e.id}
                      e={e}
                      isFavorite={favorites.has(e.id)}
                      onToggleFavorite={() => toggleFavorite(e.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          <p className="text-[11px] text-slate-400 text-center mt-6 leading-relaxed">
            {UI_TEXTS.disclaimer.line1}
            <br />
            {UI_TEXTS.disclaimer.line2}
          </p>
        </main>
      </div>
    </div>
  );
}
