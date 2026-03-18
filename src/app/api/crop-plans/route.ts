import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const farmGroupId = (session.user as any).farmGroupId;
  const year = Number(req.nextUrl.searchParams.get("year") ?? new Date().getFullYear());

  const plans = await prisma.cropPlan.findMany({
    where: {
      year,
      parcel: { farmGroupId },
    },
    include: {
      parcel: true,
      assignedUser: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const plan = await prisma.cropPlan.upsert({
    where: { parcelId_year: { parcelId: body.parcelId, year: body.year } },
    update: {
      crop1: body.crop1 ?? null,
      crop2: body.crop2 ?? null,
      assignedUserId: body.assignedUserId ?? null,
      note: body.note ?? null,
    },
    create: {
      parcelId: body.parcelId,
      year: body.year,
      crop1: body.crop1 ?? null,
      crop2: body.crop2 ?? null,
      assignedUserId: body.assignedUserId ?? null,
      note: body.note ?? null,
    },
    include: {
      assignedUser: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(plan);
}
