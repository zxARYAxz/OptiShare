import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { createSessionId } from "@/lib/ids";
import { saveUploadSession } from "@/lib/metadata";
import { ensureStorageDirs } from "@/lib/storage";
import type { UploadSession } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await ensureStorageDirs();

    const body = await request.json();
    const { fileName, mimeType, totalSize } = body as {
      fileName?: string;
      mimeType?: string;
      totalSize?: number;
    };

    if (!fileName || !mimeType || typeof totalSize !== "number") {
      return NextResponse.json(
        { error: "fileName, mimeType, and totalSize are required" },
        { status: 400 }
      );
    }

    if (totalSize > config.maxFileSize) {
      return NextResponse.json(
        { error: `File exceeds maximum size of ${config.maxFileSize / (1024 * 1024)} MB` },
        { status: 400 }
      );
    }

    if (!config.allowedTypes.includes(mimeType as (typeof config.allowedTypes)[number])) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const totalChunks = Math.ceil(totalSize / config.chunkSize);
    const sessionId = createSessionId();

    const session: UploadSession = {
      sessionId,
      fileName,
      mimeType,
      totalSize,
      totalChunks,
      receivedChunks: [],
      createdAt: new Date().toISOString(),
      status: "uploading",
    };

    await saveUploadSession(session);

    return NextResponse.json({
      sessionId,
      chunkSize: config.chunkSize,
      totalChunks,
    });
  } catch (err) {
    console.error("Upload init error:", err);
    return NextResponse.json({ error: "Failed to initialize upload" }, { status: 500 });
  }
}
