import { NextRequest, NextResponse } from "next/server";
import { createShareId } from "@/lib/ids";
import {
  computeExpiresAt,
  getUploadSession,
  saveFileRecord,
  saveUploadSession,
} from "@/lib/metadata";
import { processFile } from "@/lib/processor";
import {
  assembleChunks,
  deletePath,
  ensureStorageDirs,
  getShareUrl,
  rawUploadPath,
  sessionDir,
  uploadToS3IfConfigured,
} from "@/lib/storage";
import type { FileRecord } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let sessionId: string | undefined;

  try {
    await ensureStorageDirs();

    const body = await request.json();
    sessionId = (body as { sessionId?: string }).sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const session = await getUploadSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
    }

    if (session.receivedChunks.length !== session.totalChunks) {
      return NextResponse.json(
        {
          error: "Not all chunks received",
          received: session.receivedChunks.length,
          totalChunks: session.totalChunks,
        },
        { status: 400 }
      );
    }

    session.status = "processing";
    await saveUploadSession(session);

    const uploadPath = rawUploadPath(sessionId, session.fileName);
    await assembleChunks(sessionId, session.totalChunks, uploadPath);

    const fileId = createShareId();
    const result = await processFile(uploadPath, fileId, session.mimeType);

    await uploadToS3IfConfigured(result.outputPath, fileId);

    const record: FileRecord = {
      id: fileId,
      originalName: session.fileName,
      mimeType: result.mimeType,
      originalSize: session.totalSize,
      optimizedSize: result.size,
      storageKey: `${fileId}${result.extension}`,
      status: "ready",
      createdAt: new Date().toISOString(),
      expiresAt: computeExpiresAt(),
      optimized: result.optimized,
    };

    await saveFileRecord(record);

    session.status = "complete";
    session.fileId = fileId;
    await saveUploadSession(session);

    await deletePath(uploadPath);
    await deletePath(sessionDir(sessionId));

    const savings =
      session.totalSize > 0
        ? Math.round((1 - result.size / session.totalSize) * 100)
        : 0;

    return NextResponse.json({
      fileId,
      shareUrl: getShareUrl(fileId),
      originalSize: session.totalSize,
      optimizedSize: result.size,
      savingsPercent: Math.max(0, savings),
      optimized: result.optimized,
      expiresAt: record.expiresAt,
    });
  } catch (err) {
    console.error("Upload complete error:", err);

    if (sessionId) {
      const session = await getUploadSession(sessionId);
      if (session) {
        session.status = "error";
        session.error = err instanceof Error ? err.message : "Processing failed";
        await saveUploadSession(session);
      }
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}
