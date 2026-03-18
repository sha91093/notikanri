import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrentFiscalYear(): number {
  const now = new Date();
  // 農業年度: 4月始まり
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

export function getFiscalYearRange(year: number) {
  return {
    start: new Date(year, 3, 1),   // 4月1日
    end: new Date(year + 1, 2, 31), // 翌年3月31日
  };
}

export const CROP_COLORS: Record<string, string> = {
  水稲: "#4CAF50",
  麦: "#FFC107",
  大豆: "#8BC34A",
  野菜: "#FF9800",
  果樹: "#E91E63",
  その他: "#9E9E9E",
  未設定: "#E0E0E0",
};

export function getCropColor(cropName: string | null | undefined): string {
  if (!cropName) return CROP_COLORS["未設定"];
  for (const [key, color] of Object.entries(CROP_COLORS)) {
    if (cropName.includes(key)) return color;
  }
  return CROP_COLORS["その他"];
}

export const WEATHER_LABELS: Record<string, string> = {
  SUNNY: "晴れ",
  PARTLY_CLOUDY: "晴れ時々曇り",
  CLOUDY: "曇り",
  RAINY: "雨",
  SNOWY: "雪",
};

export const WEATHER_ICONS: Record<string, string> = {
  SUNNY: "☀️",
  PARTLY_CLOUDY: "⛅",
  CLOUDY: "☁️",
  RAINY: "🌧️",
  SNOWY: "❄️",
};

// Open-Meteo WMO天気コードの変換
export function wmoCodeToWeatherType(code: number): string {
  if (code === 0) return "SUNNY";
  if (code <= 2) return "PARTLY_CLOUDY";
  if (code <= 3) return "CLOUDY";
  if (code <= 67) return "RAINY";
  if (code <= 77) return "SNOWY";
  if (code <= 82) return "RAINY";
  return "CLOUDY";
}

export function wmoCodeToIcon(code: number): string {
  return WEATHER_ICONS[wmoCodeToWeatherType(code)] ?? "🌤️";
}
