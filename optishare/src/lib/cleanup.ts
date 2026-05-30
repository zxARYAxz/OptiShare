import fs from "fs/promises";
import path from "path";
import { config } from "./config";
import { deleteFileRecord, listAllFileRecords } from "./metadata";
import { deletePath, sessionDir } from "./storage";

export interface CleanupResult {
  deleted: number;
  errors: string[];
}

export async function cleanupExpiredFiles(): Promise<CleanupResult> {
  const result: CleanupResult = { deleted: 0, errors: [] };
  const now = new Date();
  const records = await listAllFileRecords();

  for (const record of records) {
    if (new Date(record.expiresAt) >= now && record.status !== "expired") {
      continue;
    }

    try {
      const ext = path.extname(record.storageKey) || "";
      await deleteFileRecord(record.id, record.storageKey);
      await deletePath(path.join(config.storageDir, "processed", `${record.id}${ext}`));
      result.deleted += 1;
    } catch (err) {
      result.errors.push(
        `Failed to delete ${record.id}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  await cleanupStaleSessions();
  await cleanupStaleUploads();

  return result;
}

async function cleanupStaleSessions(): Promise<void> {
  const sessionsDir = path.join(config.storageDir, "sessions");
  const chunksDir = path.join(config.storageDir, "chunks");

  try {
    const sessions = await fs.readdir(sessionsDir);
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;

    for (const file of sessions) {
      const filePath = path.join(sessionsDir, file);
      const stat = await fs.stat(filePath);
      if (stat.mtimeMs < cutoff) {
        const sessionId = file.replace(".json", "");
        await deletePath(filePath);
        await deletePath(sessionDir(sessionId));
      }
    }
  } catch {
    // directory may not exist yet
  }

  try {
    const chunkSessions = await fs.readdir(chunksDir);
    for (const sessionId of chunkSessions) {
      const dir = sessionDir(sessionId);
      const stat = await fs.stat(dir);
      if (stat.mtimeMs < Date.now() - 2 * 60 * 60 * 1000) {
        await deletePath(dir);
      }
    }
  } catch {
    // ignore
  }
}

async function cleanupStaleUploads(): Promise<void> {
  const uploadsDir = path.join(config.storageDir, "uploads");

  try {
    const files = await fs.readdir(uploadsDir);
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stat = await fs.stat(filePath);
      if (stat.mtimeMs < cutoff) {
        await deletePath(filePath);
      }
    }
  } catch {
    // ignore
  }
}
