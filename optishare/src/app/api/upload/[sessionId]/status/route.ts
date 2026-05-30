import { NextRequest, NextResponse } from "next/server";
import { getUploadSession } from "@/lib/metadata";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await getUploadSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const uploadProgress =
    session.totalChunks > 0
      ? Math.round((session.receivedChunks.length / session.totalChunks) * 100)
      : 0;

  return NextResponse.json({
    sessionId: session.sessionId,
    status: session.status,
    uploadProgress,
    receivedChunks: session.receivedChunks.length,
    totalChunks: session.totalChunks,
    fileId: session.fileId,
    error: session.error,
  });
}
