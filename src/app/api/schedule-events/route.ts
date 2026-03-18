import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const farmGroupId = (session.user as any).farmGroupId;
  const year = Number(req.nextUrl.searchParams.get("year") ?? new Date().getFullYear());

  const events = await prisma.scheduleEvent.findMany({
    where: {
      year,
      OR: [
        { parcel: { farmGroupId } },
        { parcel: null },
      ],
    },
    include: {
      parcel: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const event = await prisma.scheduleEvent.create({
    data: {
      title: body.title,
      parcelId: body.parcelId ?? null,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      allDay: body.allDay ?? true,
      assignedUserId: body.assignedUserId ?? null,
      memo: body.memo ?? null,
      year: body.year,
      color: body.color ?? null,
    },
    include: {
      parcel: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(event, { status: 201 });
}
