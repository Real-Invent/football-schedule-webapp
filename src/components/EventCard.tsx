import { Star } from "lucide-react";
import type { Event } from "../types";
import { LEAGUES } from "../constants/leagues";
import { BROADCASTERS } from "../constants/broadcasters";

type EventCardProps = {
  e: Event;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDetailClick?: () => void;
};

// 試合カード表示コンポーネント
// 時刻、リーグタグ、タイトル、放送局を表示、右上にお気に入りボタン
export function EventCard({ e, isFavorite, onToggleFavorite, onDetailClick }: EventCardProps) {
  const league = LEAGUES[e.lg];

  return (
    <div
      onClick={onDetailClick}
      className="relative bg-white rounded-2xl border border-slate-200 px-4 py-3 flex gap-3 items-center shadow-sm cursor-pointer hover:shadow-md hover:border-slate-300 transition-shadow"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
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

        {/* サッカー試合：チームロゴ表示 */}
        {e.result && "teams" in e.result && e.result.teams && (
          <div>
            {e.result.status === "finished" && "score" in e.result && e.result.score ? (
              <div className="flex items-center justify-between gap-1">
                {(() => {
                  const parts = e.title.split(" vs ");
                  const home = parts[0] || "";
                  const away = parts[1] || "";
                  const homeCrest = e.result.teams?.home.crest;
                  const awayCrest = e.result.teams?.away.crest;
                  return (
                    <>
                      <div className="flex items-center gap-1 flex-1 justify-end min-w-0">
                        <span className="font-bold text-slate-900 text-right truncate">{home}</span>
                        {homeCrest && (
                          <img src={homeCrest} alt={home} className="h-[16px] w-auto shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
                        )}
                      </div>
                      <div className="flex-shrink-0 text-nowrap px-1">
                        <span className="font-bold text-slate-900">
                          <span className="text-green-600">{e.result.score.home}</span> - <span className="text-green-600">{e.result.score.away}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-1 justify-start min-w-0">
                        {awayCrest && (
                          <img src={awayCrest} alt={away} className="h-[16px] w-auto shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
                        )}
                        <div className="text-left truncate">
                          <span className="font-bold text-slate-900">
                            {away}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-1">
                {(() => {
                  const parts = e.title.split(" vs ");
                  const home = parts[0] || "";
                  const away = parts[1] || "";
                  const homeCrest = e.result.teams?.home.crest;
                  const awayCrest = e.result.teams?.away.crest;
                  return (
                    <>
                      <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                        <span className="font-bold text-slate-900 text-right break-words">{home}</span>
                        {homeCrest && (
                          <img src={homeCrest} alt={home} className="h-[16px] w-auto shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
                        )}
                      </div>
                      <span className="flex-shrink-0 text-slate-400 text-[12px] px-1">vs</span>
                      <div className="flex items-center gap-1.5 flex-1 justify-start min-w-0">
                        {awayCrest && (
                          <img src={awayCrest} alt={away} className="h-[16px] w-auto shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
                        )}
                        <span className="font-bold text-slate-900 break-words">{away}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
            {e.result.penalties && (
              <div className="text-center text-[12px] text-blue-600 font-semibold mt-0.5">
                PK <span className="font-bold">
                  <span className="text-green-600">{e.result.penalties.home}</span> - <span className="text-green-600">{e.result.penalties.away}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* 通常の試合表示（結果なし・チームロゴなし） */}
        {!(e.result && "teams" in e.result && e.result.teams) && !(e.result && e.result.status === "finished" && "score" in e.result) && (
          <div className="flex items-center gap-1.5">
            <span className={`text-[15px] font-bold text-slate-900 truncate ${e.lg === 'f1' ? 'ml-[10px]' : ''}`}>
              {e.title}
            </span>
          </div>
        )}

        {/* F1結果：3位まで表示 */}
        {e.result && e.result.status === "finished" && "standings" in e.result && e.result.standings && (
          <div className="flex justify-center mt-1">
            <div className="text-[12px] text-blue-600 font-semibold space-y-0.5">
              {e.result.standings.slice(0, 3).map((s) => (
                <div key={s.position}>
                  {s.position}位 {s.driver} ({s.constructor})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* cat表示（F1は除外） */}
        {e.lg !== "f1" && (
          <div className="text-[11px] text-slate-400 mt-0.5">{e.cat}</div>
        )}

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
