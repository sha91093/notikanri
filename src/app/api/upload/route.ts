import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// R2が設定されている場合のみS3クライアントを初期化
async function uploadToR2(file: File, key: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
  const buffer = Buffer.from(await file.arrayBuffer());
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const workLogId = formData.get("workLogId") as string | null;

  if (!file || !workLogId) {
    return NextResponse.json({ error: "file and workLogId are required" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `photos/${workLogId}/${randomUUID()}.${ext}`;

  let url: string;

  // R2が未設定の場合はローカル確認用のプレースホルダーURLを使用
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_PUBLIC_URL) {
    url = `/api/upload/placeholder?name=${encodeURIComponent(file.name)}`;
  } else {
    url = await uploadToR2(file, key);
  }

  const photo = await prisma.photo.create({
    data: { workLogId, url },
  });

  return NextResponse.json(photo, { status: 201 });
}
