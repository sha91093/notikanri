"use client";

import { useEffect, useState } from "react";
import { useYearStore } from "@/lib/stores/yearStore";
import { wmoCodeToIcon, wmoCodeToWeatherType, WEATHER_LABELS } from "@/lib/utils";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw, Sun, Droplets } from "lucide-react";

const DEFAULT_LAT = 35.6762;
const DEFAULT_LON = 139.6503;

export default function WeatherPage() {
  const { year } = useYearStore();
  const [forecast, setForecast] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [tab, setTab] = useState<"forecast" | "history">("forecast");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadForecast();
    loadHistory();
  }, [year]);

  async function loadForecast() {
    setLoading(true);
    const res = await fetch(
      `/api/weather?type=forecast&lat=${DEFAULT_LAT}&lon=${DEFAULT_LON}`
    );
    if (res.ok) setForecast(await res.json());
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function loadHistory() {
    const res = await fetch(`/api/weather?type=history&year=${year}`);
    if (res.ok) setRecords(await res.json());
  }

  async function syncHistory() {
    setSyncing(true);
    await fetch("/api/weather", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: DEFAULT_LAT, lon: DEFAULT_LON }),
    });
    await loadHistory();
    setSyncing(false);
  }

  const forecastDays = forecast?.daily
    ? forecast.daily.time.map((date: string, i: number) => ({
        date,
        code: forecast.daily.weathercode[i],
        tempMax: forecast.daily.temperature_2m_max[i],
        tempMin: forecast.daily.temperature_2m_min[i],
        precipitation: forecast.daily.precipitation_sum[i],
        sunshine: forecast.daily.sunshine_duration
          ? (forecast.daily.sunshine_duration[i] / 3600).toFixed(1)
          : null,
      }))
    : [];

  // 月別集計
  const monthlyData = (() => {
    const map: Record<string, { month: string; rain: number; sunshine: number; count: number }> = {};
    records.forEach((r) => {
      const m = format(new Date(r.date), "M月", { locale: ja });
      if (!map[m]) map[m] = { month: m, rain: 0, sunshine: 0, count: 0 };
      map[m].rain += r.precipitation ?? 0;
      map[m].sunshine += r.sunshineDuration ?? 0;
      map[m].count += 1;
    });
    return Object.values(map);
  })();

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">天気</h1>

      {/* タブ */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab("forecast")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            tab === "forecast" ? "bg-white text-[#2d6a4f] shadow-sm" : "text-gray-500"
          }`}
        >
          ☀️ 1週間予報
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            tab === "history" ? "bg-white text-[#2d6a4f] shadow-sm" : "text-gray-500"
          }`}
        >
          📊 実績グラフ
        </button>
      </div>

      {tab === "forecast" && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-gray-400 py-10">読み込み中...</div>
          ) : (
            <>
              {forecastDays.map((day: any) => (
                <div
                  key={day.date}
                  className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4"
                >
                  <div className="text-center w-14">
                    <p className="text-xs text-gray-500">
                      {format(new Date(day.date), "M/d", { locale: ja })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(day.date), "E", { locale: ja })}
                    </p>
                  </div>

                  <div className="text-4xl">{wmoCodeToIcon(day.code)}</div>

                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      {WEATHER_LABELS[wmoCodeToWeatherType(day.code)]}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-red-500 font-semibold text-sm">
                        {day.tempMax != null ? `${Math.round(day.tempMax)}°` : "--"}
                      </span>
                      <span className="text-blue-500 text-sm">
                        {day.tempMin != null ? `${Math.round(day.tempMin)}°` : "--"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-1 justify-end">
                      <Droplets size={12} className="text-blue-400" />
                      {day.precipitation != null ? `${day.precipitation}mm` : "--"}
                    </div>
                    {day.sunshine && (
                      <div className="flex items-center gap-1 justify-end">
                        <Sun size={12} className="text-yellow-400" />
                        {day.sunshine}h
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 text-center">
                データ提供: Open-Meteo（無料天気API）
              </p>
            </>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{year}年度の実績データ</p>
            <button
              onClick={syncHistory}
              disabled={syncing}
              className="flex items-center gap-1 text-sm text-[#2d6a4f] font-medium px-3 py-2 rounded-xl border border-[#2d6a4f] touch-target"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              最新データ取得
            </button>
          </div>

          {records.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-gray-400 shadow-sm">
              <p className="text-sm">実績データがまだありません。</p>
              <p className="text-xs mt-1">「最新データ取得」で過去30日分を取り込めます。</p>
            </div>
          ) : (
            <>
              {/* 降水量グラフ */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">
                  <Droplets size={14} className="text-blue-400" />
                  月別降水量 (mm)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="rain" fill="#60a5fa" name="降水量(mm)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 日照時間グラフ */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">
                  <Sun size={14} className="text-yellow-400" />
                  月別日照時間 (h)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="sunshine" fill="#fbbf24" name="日照時間(h)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
