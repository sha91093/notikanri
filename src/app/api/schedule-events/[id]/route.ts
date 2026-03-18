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
  const event = await prisma.scheduleEvent.update({
    where: { id: params.id },
    data: {
      title: body.title,
      parcelId: body.parcelId ?? null,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      allDay: body.allDay ?? true,
      assignedUserId: body.assignedUserId ?? null,
      memo: body.memo ?? null,
      color: body.color ?? null,
    },
    include: {
      parcel: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.scheduleEvent.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
