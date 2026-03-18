import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const farmGroupId = (session.user as any).farmGroupId;
  const year = Number(req.nextUrl.searchParams.get("year") ?? new Date().getFullYear());
  const parcelId = req.nextUrl.searchParams.get("parcelId");
  const userId = req.nextUrl.searchParams.get("userId");

  const logs = await prisma.workLog.findMany({
    where: {
      year,
      ...(parcelId ? { parcelId } : {}),
      ...(userId ? { assignedUserId: userId } : {}),
      parcel: farmGroupId ? { farmGroupId } : undefined,
    },
    include: {
      parcel: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true } },
      photos: true,
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const log = await prisma.workLog.create({
    data: {
      date: new Date(body.date),
      parcelId: body.parcelId ?? null,
      content: body.content,
      weather: body.weather ?? null,
      assignedUserId: body.assignedUserId ?? (session.user as any).id,
      memo: body.memo ?? null,
      year: body.year,
    },
    include: {
      parcel: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true } },
      photos: true,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
