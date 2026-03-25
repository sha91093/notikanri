import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 シードデータを投入します...");

  // 農家グループ
  const group = await prisma.farmGroup.upsert({
    where: { id: "seed-group-1" },
    update: {},
    create: {
      id: "seed-group-1",
      name: "サンプル農場",
      latitude: 35.6762,
      longitude: 139.6503,
    },
  });
  console.log(`✅ 農家グループ: ${group.name}`);

  // 管理者ユーザー
  const hashed = await bcrypt.hash("password123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "管理者",
      password: hashed,
      role: "ADMIN",
    },
  });

  // グループに紐付け
  await prisma.farmGroupUser.upsert({
    where: { farmGroupId_userId: { farmGroupId: group.id, userId: admin.id } },
    update: {},
    create: { farmGroupId: group.id, userId: admin.id, role: "ADMIN" },
  });
  console.log(`✅ 管理者ユーザー: ${admin.email} / パスワード: password123`);

  // 一般メンバー
  const member = await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: {
      email: "member@example.com",
      name: "田中 太郎",
      password: hashed,
      role: "MEMBER",
    },
  });
  await prisma.farmGroupUser.upsert({
    where: { farmGroupId_userId: { farmGroupId: group.id, userId: member.id } },
    update: {},
    create: { farmGroupId: group.id, userId: member.id, role: "MEMBER" },
  });
  console.log(`✅ メンバー: ${member.email} / パスワード: password123`);

  // サンプル農地区画（東京周辺のダミーポリゴン）
  const parcelsData = [
    {
      id: "parcel-1",
      name: "第1圃場",
      area: 0.5,
      geometry: {
        type: "Polygon",
        coordinates: [[
          [139.648, 35.674],
          [139.650, 35.674],
          [139.650, 35.676],
          [139.648, 35.676],
          [139.648, 35.674],
        ]],
      },
    },
    {
      id: "parcel-2",
      name: "第2圃場",
      area: 0.8,
      geometry: {
        type: "Polygon",
        coordinates: [[
          [139.652, 35.674],
          [139.655, 35.674],
          [139.655, 35.677],
          [139.652, 35.677],
          [139.652, 35.674],
        ]],
      },
    },
    {
      id: "parcel-3",
      name: "第3圃場",
      area: 0.3,
      geometry: {
        type: "Polygon",
        coordinates: [[
          [139.648, 35.671],
          [139.651, 35.671],
          [139.651, 35.673],
          [139.648, 35.673],
          [139.648, 35.671],
        ]],
      },
    },
  ];

  for (const data of parcelsData) {
    const parcel = await prisma.parcel.upsert({
      where: { id: data.id },
      update: {},
      create: { ...data, farmGroupId: group.id },
    });
    console.log(`✅ 農地区画: ${parcel.name} (${parcel.area} ha)`);
  }

  // サンプル作付計画（2025年度）
  const year = 2025;
  const cropPlanData = [
    { parcelId: "parcel-1", crop1: "水稲", crop2: null, assignedUserId: admin.id },
    { parcelId: "parcel-2", crop1: "麦", crop2: "大豆", assignedUserId: member.id },
    { parcelId: "parcel-3", crop1: "野菜", crop2: null, assignedUserId: admin.id },
  ];
  for (const data of cropPlanData) {
    await prisma.cropPlan.upsert({
      where: { parcelId_year: { parcelId: data.parcelId, year } },
      update: {},
      create: { ...data, year },
    });
  }
  console.log("✅ サンプル作付計画を投入しました");

  // サンプルスケジュール
  const today = new Date();
  await prisma.scheduleEvent.upsert({
    where: { id: "event-seed-1" },
    update: {},
    create: {
      id: "event-seed-1",
      title: "水稲 播種",
      parcelId: "parcel-1",
      startDate: new Date(today.getFullYear(), today.getMonth(), 20),
      endDate: new Date(today.getFullYear(), today.getMonth(), 20),
      allDay: true,
      assignedUserId: admin.id,
      memo: "午前中に完了予定",
      year,
      color: "#2d6a4f",
    },
  });
  await prisma.scheduleEvent.upsert({
    where: { id: "event-seed-2" },
    update: {},
    create: {
      id: "event-seed-2",
      title: "麦 防除",
      parcelId: "parcel-2",
      startDate: new Date(today.getFullYear(), today.getMonth(), 25),
      endDate: new Date(today.getFullYear(), today.getMonth(), 25),
      allDay: true,
      assignedUserId: member.id,
      year,
      color: "#1565c0",
    },
  });
  console.log("✅ サンプルスケジュールを投入しました");

  // サンプル作業日誌
  await prisma.workLog.upsert({
    where: { id: "log-seed-1" },
    update: {},
    create: {
      id: "log-seed-1",
      date: new Date(today.getFullYear(), today.getMonth(), 10),
      parcelId: "parcel-1",
      content: "耕起",
      weather: "SUNNY",
      assignedUserId: admin.id,
      memo: "天気良好。土の状態も良い。",
      year,
    },
  });
  console.log("✅ サンプル作業日誌を投入しました");

  console.log("\n🎉 シード完了！");
  console.log("─────────────────────────────");
  console.log("ログイン情報:");
  console.log("  管理者: admin@example.com / password123");
  console.log("  メンバー: member@example.com / password123");
  console.log("─────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
