import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredFiles } from "@/lib/cleanup";
import { getFileRecord } from "@/lib/metadata";
import { getDownloadUrl, getShareUrl } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await cleanupExpiredFiles();

  const record = await getFileRecord(id);
  if (!record) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  if (record.status === "expired" || new Date(record.expiresAt) < new Date()) {
    return NextResponse.json({ error: "File has expired" }, { status: 410 });
  }

  const savings =
    record.originalSize > 0 && record.optimizedSize
      ? Math.round((1 - record.optimizedSize / record.originalSize) * 100)
      : 0;

  return NextResponse.json({
    id: record.id,
    originalName: record.originalName,
    mimeType: record.mimeType,
    originalSize: record.originalSize,
    optimizedSize: record.optimizedSize,
    savingsPercent: Math.max(0, savings),
    optimized: record.optimized,
    status: record.status,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    downloadUrl: getDownloadUrl(record.id),
    shareUrl: getShareUrl(record.id),
  });
}
