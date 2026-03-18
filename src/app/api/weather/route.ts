import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Open-Meteo から1週間予報を取得
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lat = req.nextUrl.searchParams.get("lat") ?? "35.6762";
  const lon = req.nextUrl.searchParams.get("lon") ?? "139.6503";
  const type = req.nextUrl.searchParams.get("type") ?? "forecast";

  if (type === "forecast") {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration&timezone=Asia%2FTokyo&forecast_days=7`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ error: "Weather API error" }, { status: 502 });

    const data = await res.json();
    return NextResponse.json(data);
  }

  // 過去実績: farmGroupId の WeatherRecord を返す
  const farmGroupId = (session.user as any).farmGroupId;
  const year = Number(req.nextUrl.searchParams.get("year") ?? new Date().getFullYear());

  const records = await prisma.weatherRecord.findMany({
    where: {
      farmGroupId,
      date: {
        gte: new Date(year, 3, 1),
        lte: new Date(year + 1, 2, 31),
      },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(records);
}

// 実績天気データをDBに保存（日次バッチ or 手動）
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const farmGroupId = (session.user as any).farmGroupId;
  const body = await req.json();
  const { lat, lon } = body;

  // 過去30日分を取得してDBへ保存
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration&timezone=Asia%2FTokyo&start_date=${startStr}&end_date=${endStr}`;

  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ error: "Weather API error" }, { status: 502 });

  const data = await res.json();
  const { time, weathercode, temperature_2m_max, temperature_2m_min, precipitation_sum, sunshine_duration } = data.daily;

  const upserts = time.map((dateStr: string, i: number) =>
    prisma.weatherRecord.upsert({
      where: { date_farmGroupId: { date: new Date(dateStr), farmGroupId } },
      update: {
        weatherCode: weathercode[i],
        tempMax: temperature_2m_max[i],
        tempMin: temperature_2m_min[i],
        precipitation: precipitation_sum[i],
        sunshineDuration: sunshine_duration[i] ? sunshine_duration[i] / 3600 : null,
      },
      create: {
        date: new Date(dateStr),
        farmGroupId,
        weatherCode: weathercode[i],
        tempMax: temperature_2m_max[i],
        tempMin: temperature_2m_min[i],
        precipitation: precipitation_sum[i],
        sunshineDuration: sunshine_duration[i] ? sunshine_duration[i] / 3600 : null,
      },
    })
  );

  await prisma.$transaction(upserts);
  return NextResponse.json({ saved: time.length });
}
