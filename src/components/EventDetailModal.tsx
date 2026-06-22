import { X } from "lucide-react";
import type { Event } from "../types";
import { LEAGUES } from "../constants/leagues";
import { BROADCASTERS } from "../constants/broadcasters";

type EventDetailModalProps = {
  event: Event;
  onClose: () => void;
};

export function EventDetailModal({ event: e, onClose }: EventDetailModalProps) {
  const league = LEAGUES[e.lg];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] w-full sm:max-w-md overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <span
            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded text-white"
            style={{ background: league.color }}
          >
            {league.label}
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="px-4 py-4 space-y-4">
          {/* 日時 */}
          <div>
            <p className="text-[11px] text-slate-500 font-semibold mb-1">日時</p>
            <p className="text-[16px] font-bold text-slate-900">
              {e.time}
              {Number(e.time.split(":")[0]) >= 24 && (
                <span className="text-[12px] text-slate-400 ml-2">（翌日）</span>
              )}
            </p>
          </div>

          {/* 試合情報 */}
          <div>
            <p className="text-[11px] text-slate-500 font-semibold mb-2">試合</p>

            {/* サッカー試合：チームロゴ表示 */}
            {e.result && "teams" in e.result && e.result.teams && (
              <div>
                {e.result.status === "finished" && "score" in e.result && e.result.score ? (
                  <div className="flex items-center justify-between gap-3 mb-2">
                    {(() => {
                      const parts = e.title.split(" vs ");
                      const home = parts[0] || "";
                      const away = parts[1] || "";
                      const homeCrest = e.result.teams?.home.crest;
                      const awayCrest = e.result.teams?.away.crest;
                      return (
                        <>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 justify-end mb-2">
                              {homeCrest && (
                                <img
                                  src={homeCrest}
                                  alt={home}
                                  className="h-10 w-auto"
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              )}
                              <span className="font-bold text-slate-900 text-right">{home}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="text-xl font-black text-slate-900">
                              <span className="text-green-600">{e.result.score.home}</span>
                              <span className="text-slate-400 mx-1">-</span>
                              <span className="text-green-600">{e.result.score.away}</span>
                            </div>
                            {e.result.halfTime && (
                              <div className="text-[11px] text-slate-500 font-semibold">
                                Half Time: <span className="text-slate-700">{e.result.halfTime.home}</span> - <span className="text-slate-700">{e.result.halfTime.away}</span>
                              </div>
                            )}
                            {e.result.penalties && (
                              <div className="text-[11px] text-blue-600 font-semibold mt-2">
                                PK <span className="font-bold text-green-600">{e.result.penalties.home}</span> - <span className="font-bold text-green-600">{e.result.penalties.away}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 justify-start mb-2">
                              <span className="font-bold text-slate-900">{away}</span>
                              {awayCrest && (
                                <img
                                  src={awayCrest}
                                  alt={away}
                                  className="h-10 w-auto"
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {(() => {
                      const parts = e.title.split(" vs ");
                      const home = parts[0] || "";
                      const away = parts[1] || "";
                      const homeCrest = e.result.teams?.home.crest;
                      const awayCrest = e.result.teams?.away.crest;
                      return (
                        <>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 justify-end mb-2">
                              {homeCrest && (
                                <img
                                  src={homeCrest}
                                  alt={home}
                                  className="h-10 w-auto"
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              )}
                              <span className="font-bold text-slate-900 text-right">{home}</span>
                            </div>
                          </div>
                          <span className="flex-shrink-0 text-slate-400 font-semibold">vs</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 justify-start mb-2">
                              <span className="font-bold text-slate-900">{away}</span>
                              {awayCrest && (
                                <img
                                  src={awayCrest}
                                  alt={away}
                                  className="h-10 w-auto"
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
                <p className="text-[12px] text-slate-500">
                  ステータス：{e.result.status === "finished" ? "終了" : e.result.status === "ongoing" ? "進行中" : "予定"}
                </p>
              </div>
            )}

            {/* 通常の試合表示 */}
            {!(e.result && "teams" in e.result && e.result.teams) && (
              <p className="text-[15px] font-bold text-slate-900">{e.title}</p>
            )}

            {/* F1結果：全順位表示 */}
            {e.result && e.result.status === "finished" && "standings" in e.result && e.result.standings && (
              <div className="space-y-1">
                <p className="text-[12px] font-semibold text-slate-900 mb-2">レース結果</p>
                {e.result.standings.map((s) => (
                  <div key={s.position} className="text-[13px] text-slate-700">
                    <span className="font-bold text-slate-900">{s.position}位</span> {s.driver} ({s.constructor}) <span className="text-slate-500">{s.points}pt</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* カテゴリー */}
          {e.lg !== "f1" && (
            <div>
              <p className="text-[11px] text-slate-500 font-semibold mb-1">カテゴリー</p>
              <p className="text-[14px] text-slate-700">{e.cat}</p>
            </div>
          )}

          {/* 放送局 */}
          <div>
            <p className="text-[11px] text-slate-500 font-semibold mb-2">放送局</p>
            <div className="flex flex-wrap gap-2">
              {e.casts.map((c) => {
                const b = BROADCASTERS[c];
                return (
                  <div
                    key={c}
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-md text-white"
                    style={{ background: b.chip }}
                  >
                    {b.icon && <b.icon size={14} />}
                    {b.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
