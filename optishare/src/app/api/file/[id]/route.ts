import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { cleanupExpiredFiles } from "@/lib/cleanup";
import { getFileRecord } from "@/lib/metadata";
import { processedPath } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await cleanupExpiredFiles();

  const record = await getFileRecord(id);
  if (!record || record.status === "expired") {
    return NextResponse.json({ error: "File not found or expired" }, { status: 404 });
  }

  if (record.status !== "ready") {
    return NextResponse.json({ error: "File is not ready" }, { status: 404 });
  }

  const ext = path.extname(record.storageKey) || "";
  const filePath = processedPath(id, ext);

  try {
    const fileBuffer = await fs.readFile(filePath);
    const encodedName = encodeURIComponent(record.originalName);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": record.mimeType,
        "Content-Length": String(fileBuffer.length),
        "Content-Disposition": `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-OptiShare-Optimized": record.optimized ? "true" : "false",
      },
    });
  } catch {
    return NextResponse.json({ error: "File data missing" }, { status: 404 });
  }
}
