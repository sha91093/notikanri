import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const farmGroupId = (session.user as any).farmGroupId;
  if (!farmGroupId) return NextResponse.json([]);

  const members = await prisma.farmGroupUser.findMany({
    where: { farmGroupId },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  return NextResponse.json(members.map((m) => ({ ...m.user, groupRole: m.role })));
}
