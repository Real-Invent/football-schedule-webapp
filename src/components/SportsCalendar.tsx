import { Search, X, CalendarDays, Filter, Star } from "lucide-react";
import { useEvents } from "../hooks/useEvents";
import { LEAGUES } from "../constants/leagues";
import { BROADCASTERS } from "../constants/broadcasters";
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

  const weekColor = (day: string) =>
    day === "土" ? "#1D6FB8" : day === "日" ? "#E5004F" : "#334155";

  const fmtDate = (iso: string) => {
    const [, mm, dd] = iso.split("-");
    return `${Number(mm)}/${Number(dd)}`;
  };

  return (
    <div style={{ background: "#EDEFF4", minHeight: "100vh" }} className="font-sans">
      <div className="mx-auto" style={{ maxWidth: 430 }}>
        {/* ===== ヘッダー ===== */}
        <header
          className="px-5 pt-6 pb-5 text-white"
          style={{ background: "#0B1020" }}
        >
          <div className="flex items-center gap-2 mb-3">
            {isOngoing && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#1FE0A0", color: "#0B1020" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                開催中
              </span>
            )}
            <span className="text-[11px] tracking-widest text-slate-400 font-semibold">
              観戦カレンダー
            </span>
          </div>
          <h1 className="text-[26px] leading-none font-black tracking-tight">
            いつ・どこで観る？
          </h1>
          <p className="text-slate-400 text-[13px] mt-2">
            検索してから、リーグ・放送局でさらに絞り込めます。
          </p>
        </header>

        {/* ===== 検索・フィルター（上部に貼り付く）===== */}
        <div
          className="sticky top-0 z-10 px-4 pt-3 pb-3 border-b border-slate-200"
          style={{ background: "#EDEFF4" }}
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
              placeholder="チーム名・種目で検索（全リーグ横断）"
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
          <FilterRow label="リーグ・競技">
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
          <FilterRow label="放送局・配信">
            <FilterChip
              active={favOnly}
              onClick={() => setFavOnly((v: boolean) => !v)}
              color="#F59E0B"
              icon={Star}
              label="お気に入り"
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
                条件に合う試合がありません
              </p>
              <p className="text-[12px] mt-1">
                フィルターを減らすと見つかるかもしれません。
              </p>
            </div>
          )}

          {groups.map(([date, items]) => (
            <section key={date} className="mb-5">
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
                {items.map((e) => (
                  <EventCard
                    key={e.id}
                    e={e}
                    isFavorite={favorites.has(e.id)}
                    onToggleFavorite={() => toggleFavorite(e.id)}
                  />
                ))}
              </div>
            </section>
          ))}

          <p className="text-[11px] text-slate-400 text-center mt-6 leading-relaxed">
            ※ 試合日程・放送局は説明用のサンプルです。
            <br />
            実際の最新情報は各公式サイトでご確認ください。
          </p>
        </main>
      </div>
    </div>
  );
}
