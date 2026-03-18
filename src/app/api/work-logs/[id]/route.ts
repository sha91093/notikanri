import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const log = await prisma.workLog.update({
    where: { id: params.id },
    data: {
      date: new Date(body.date),
      parcelId: body.parcelId ?? null,
      content: body.content,
      weather: body.weather ?? null,
      assignedUserId: body.assignedUserId ?? null,
      memo: body.memo ?? null,
    },
    include: {
      parcel: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true } },
      photos: true,
    },
  });

  return NextResponse.json(log);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.workLog.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
