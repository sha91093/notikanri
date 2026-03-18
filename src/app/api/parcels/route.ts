import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const farmGroupId = (session.user as any).farmGroupId;
  if (!farmGroupId) return NextResponse.json([]);

  const parcels = await prisma.parcel.findMany({
    where: { farmGroupId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(parcels);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const farmGroupId = (session.user as any).farmGroupId;
  if (!farmGroupId) return NextResponse.json({ error: "No farm group" }, { status: 400 });

  const body = await req.json();
  const parcel = await prisma.parcel.create({
    data: {
      name: body.name,
      area: body.area ?? null,
      geometry: body.geometry,
      farmGroupId,
    },
  });

  return NextResponse.json(parcel, { status: 201 });
}
