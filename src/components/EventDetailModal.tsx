import { X, Loader } from "lucide-react";
import { useState } from "react";
import type { Event } from "../types";
import { LEAGUES } from "../constants/leagues";
import { BROADCASTERS } from "../constants/broadcasters";
import { getGeminiApiKey } from "../config/env";

type EventDetailModalProps = {
  event: Event;
  onClose: () => void;
};

const GEMINI_MODELS = [
  { model: "gemini-2.5-flash", label: "Flash" },
  { model: "gemini-2.5-flash-lite", label: "Flash Lite" },
  { model: "gemini-3.1-flash-lite", label: "3.1 Flash Lite" },
  { model: "gemini-3-flash", label: "3 Flash" },
];

const parsePrediction = (text: string): { result: string; explanation: string } => {
  const match = text.match(/予想：(.+?)(?:\n\n|$)/);
  const resultText = match ? match[1].trim() : "";
  const explanationMatch = text.match(/解説：([\s\S]+?)$/);
  const explanationText = explanationMatch ? explanationMatch[1].trim() : text;
  return {
    result: resultText || "予想を取得できませんでした",
    explanation: explanationText || text
  };
};


export function EventDetailModal({ event: e, onClose }: EventDetailModalProps) {
  const league = LEAGUES[e.lg];
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<{ result: string; explanation: string } | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);

  const handleAIPrediction = async () => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      alert("APIキーが設定されていません");
      return;
    }

    // サッカー試合の対戦相手が決まっているか確認
    if (["wc2026", "jleague", "intl"].includes(e.lg)) {
      const parts = e.title.split(" vs ");
      if (parts.length !== 2 || !parts[0]?.trim() || !parts[1]?.trim() ||
        parts[0].includes("TBD") || parts[1].includes("TBD")) {
        setPrediction({ result: "予想不可", explanation: "対戦カードがまだ決まっていないため、予想できません。" });
        return;
      }
    }

    setIsLoading(true);
    setPrediction(null);

    const prompt = e.lg === "f1"
      ? `以下のF1レースについて、簡潔な予想や解説をしてください。以下の形式で返してください：

予想：<予想されるチーム名（例：Ferrari, Mercedes, Red Bull, McLaren等）>

解説：<3〜5文の解説>

レース: ${e.title}
開催日: ${e.date}
時間: ${e.time}`
      : `以下のスポーツ試合について、簡潔な予想や解説をしてください。以下の形式で返してください：

予想：<どちらが勝つか、または引き分けか>

解説：<3〜5文の解説>

大会: ${LEAGUES[e.lg].label}
試合: ${e.title}
開催日: ${e.date}
カテゴリー: ${e.cat}
時間: ${e.time}`;

    try {
      for (const modelConfig of GEMINI_MODELS) {
        const model = modelConfig.model;

        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            }
          );

          if (!response.ok) {
            if (response.status === 429) {
              console.warn(`${model}: 429 rate limited, trying next model...`);
              continue;
            } else if (response.status === 401 || response.status === 403) {
              throw new Error("APIキーが無効です。設定を確認してください。");
            } else if (response.status === 503) {
              throw new Error("AIがすこし忙しそうです。もう一回ためしてね！");
            } else {
              throw new Error(`エラーが発生しました。しばらく待ってからお試しください。`);
            }
          }

          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            continue;
          }
          setPrediction(parsePrediction(text));
          setUsedModel(model);
          return;
        } catch (error) {
          if (error instanceof Error && error.message.includes("APIキーが無効")) {
            throw error;
          }
          continue;
        }
      }

      setPrediction({ result: "エラー", explanation: "APIの使用上限に達しました。しばらく待ってからお試しください。" });
    } catch (error) {
      console.error("AI Prediction Error:", error);
      const errorMessage = error instanceof Error ? error.message : "エラーが発生しました。もう一度お試しください。";
      setPrediction({ result: "エラー", explanation: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-h-[70vh] sm:max-h-[90vh] w-full sm:max-w-md overflow-y-auto">
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
                  <div className="flex items-center justify-between sm:gap-3 gap-2 mb-2">
                    {(() => {
                      const parts = e.title.split(" vs ");
                      const home = parts[0] || "";
                      const away = parts[1] || "";
                      const homeCrest = e.result.teams?.home.crest;
                      const awayCrest = e.result.teams?.away.crest;
                      return (
                        <>
                          <div className="flex-1">
                            <div className="flex sm:flex-row flex-col items-center sm:gap-2 gap-1 justify-end mb-2">
                              <span className="font-bold text-slate-900 text-right text-sm sm:text-base">{home}</span>
                              {homeCrest && (
                                <img
                                  src={homeCrest}
                                  alt={home}
                                  className="sm:h-10 h-6 w-auto"
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              )}
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
                            <div className="flex sm:flex-row flex-col items-center sm:gap-2 gap-1 justify-start mb-2">
                              {awayCrest && (
                                <img
                                  src={awayCrest}
                                  alt={away}
                                  className="sm:h-10 h-6 w-auto"
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              )}
                              <span className="font-bold text-slate-900 text-sm sm:text-base">{away}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex items-center justify-between sm:gap-2 gap-1 mb-2">
                    {(() => {
                      const parts = e.title.split(" vs ");
                      const home = parts[0] || "";
                      const away = parts[1] || "";
                      const homeCrest = e.result.teams?.home.crest;
                      const awayCrest = e.result.teams?.away.crest;
                      return (
                        <>
                          <div className="flex-1">
                            <div className="flex sm:flex-row flex-col items-center sm:gap-2 gap-1 justify-end mb-2">
                              <span className="font-bold text-slate-900 text-right text-sm sm:text-base">{home}</span>
                              {homeCrest && (
                                <img
                                  src={homeCrest}
                                  alt={home}
                                  className="sm:h-10 h-6 w-auto"
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              )}
                            </div>
                          </div>
                          <span className="flex-shrink-0 text-slate-400 font-semibold">vs</span>
                          <div className="flex-1">
                            <div className="flex sm:flex-row flex-col items-center sm:gap-2 gap-1 justify-start mb-2">
                              {awayCrest && (
                                <img
                                  src={awayCrest}
                                  alt={away}
                                  className="sm:h-10 h-6 w-auto"
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              )}
                              <span className="font-bold text-slate-900 text-sm sm:text-base">{away}</span>
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
                  <div key={s.position} className="flex text-[13px] text-slate-700">
                    <span className="w-8 text-right font-bold text-slate-900">{s.position}位</span>
                    <span className="w-8"></span>
                    <span className="flex-1">{s.driver} ({s.constructor})</span>
                    {!e.id.toString().endsWith('-q') && <span className="w-14 text-right text-slate-500">{s.points}pt</span>}
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
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 flex-1">
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
              {!(e.result && e.result.status === "finished") && (
                <div className="flex-shrink-0">
                  <button
                    onClick={handleAIPrediction}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-[12px] font-bold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5"
                  >
                    {isLoading && <Loader size={14} className="animate-spin" />}
                    {isLoading ? "読込中..." : "AI予想"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* AI予想結果 */}
          {prediction && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-[11px] text-blue-700 font-semibold mb-2">AI予想</p>
              <h4 className="text-[18px] font-bold text-slate-900 mb-3">{prediction.result}</h4>
              <p className="text-[13px] text-slate-800 leading-relaxed">{prediction.explanation}</p>
              {usedModel && (
                <p className="text-[9px] text-slate-400 mt-2 text-right">{usedModel}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
