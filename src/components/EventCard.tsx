import { Star } from "lucide-react";
import type { Event } from "../types";
import { LEAGUES } from "../constants/leagues";
import { BROADCASTERS } from "../constants/broadcasters";

type EventCardProps = {
  e: Event;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

// 試合カード表示コンポーネント
// 時刻、リーグタグ、タイトル、放送局を表示、右上にお気に入りボタン
export function EventCard({ e, isFavorite, onToggleFavorite }: EventCardProps) {
  const league = LEAGUES[e.lg];
  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 px-4 py-3 flex gap-3 items-center shadow-sm">
      <button
        onClick={onToggleFavorite}
        className="absolute top-2 right-2 p-1 text-2xl transition-transform hover:scale-110"
        aria-label="お気に入り"
      >
        <Star
          size={20}
          className={isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-300"}
        />
      </button>

      <div className="text-center shrink-0 w-12">
        <div className="text-[17px] font-black text-slate-900 tabular-nums leading-none">
          {e.time}
        </div>
        {Number(e.time.split(":")[0]) >= 24 && (
          <div className="text-[9px] text-slate-400 mt-0.5">翌</div>
        )}
      </div>

      <div className="w-px self-stretch bg-slate-100" />

      <div className="flex-1 min-w-0">
        {/* リーグタグ */}
        <span
          className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded text-white mb-1"
          style={{ background: league.color }}
        >
          {league.label}
        </span>

        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-bold text-slate-900 truncate">
            {e.title}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">{e.cat}</div>

        <div className="flex flex-wrap gap-1 mt-2">
          {e.casts.map((c) => {
            const b = BROADCASTERS[c];
            return (
              <span
                key={c}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
                style={{ background: b.chip }}
              >
                {b.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
