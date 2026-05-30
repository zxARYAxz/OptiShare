import { NextRequest, NextResponse } from "next/server";
import { getUploadSession, saveUploadSession } from "@/lib/metadata";
import { chunkPath, ensureStorageDirs, writeFileAbsolute } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await ensureStorageDirs();

    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string | null;
    const chunkIndexRaw = formData.get("chunkIndex");
    const chunk = formData.get("chunk") as File | null;

    if (!sessionId || chunkIndexRaw === null || !chunk) {
      return NextResponse.json(
        { error: "sessionId, chunkIndex, and chunk are required" },
        { status: 400 }
      );
    }

    const chunkIndex = Number(chunkIndexRaw);
    if (Number.isNaN(chunkIndex) || chunkIndex < 0) {
      return NextResponse.json({ error: "Invalid chunkIndex" }, { status: 400 });
    }

    const session = await getUploadSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
    }

    if (session.status !== "uploading") {
      return NextResponse.json({ error: "Upload session is not active" }, { status: 400 });
    }

    if (chunkIndex >= session.totalChunks) {
      return NextResponse.json({ error: "Chunk index out of range" }, { status: 400 });
    }

    const buffer = Buffer.from(await chunk.arrayBuffer());
    await writeFileAbsolute(chunkPath(sessionId, chunkIndex), buffer);

    if (!session.receivedChunks.includes(chunkIndex)) {
      session.receivedChunks.push(chunkIndex);
      session.receivedChunks.sort((a, b) => a - b);
      await saveUploadSession(session);
    }

    const progress = Math.round(
      (session.receivedChunks.length / session.totalChunks) * 100
    );

    return NextResponse.json({
      received: session.receivedChunks.length,
      totalChunks: session.totalChunks,
      progress,
    });
  } catch (err) {
    console.error("Chunk upload error:", err);
    return NextResponse.json({ error: "Failed to upload chunk" }, { status: 500 });
  }
}
