import fs from "fs/promises";
import path from "path";
import { config } from "./config";
import type { FileRecord, UploadSession } from "./types";
import { deletePath, metadataPath, sessionMetadataPath } from "./storage";

let redisClient: import("ioredis").default | null = null;

async function getRedis(): Promise<import("ioredis").default | null> {
  if (!config.redis.url) return null;
  if (redisClient) return redisClient;

  const Redis = (await import("ioredis")).default;
  redisClient = new Redis(config.redis.url);
  return redisClient;
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function saveFileRecord(record: FileRecord): Promise<void> {
  await writeJson(metadataPath(record.id), record);

  const redis = await getRedis();
  if (redis) {
    const ttlSeconds = Math.max(
      1,
      Math.floor((new Date(record.expiresAt).getTime() - Date.now()) / 1000)
    );
    await redis.set(`file:${record.id}`, JSON.stringify(record), "EX", ttlSeconds);
  }
}

export async function getFileRecord(id: string): Promise<FileRecord | null> {
  const redis = await getRedis();
  if (redis) {
    const cached = await redis.get(`file:${id}`);
    if (cached) return JSON.parse(cached) as FileRecord;
  }

  const record = await readJson<FileRecord>(metadataPath(id));
  if (!record) return null;

  if (new Date(record.expiresAt) < new Date()) {
    record.status = "expired";
  }

  return record;
}

export async function deleteFileRecord(id: string, storageKey: string): Promise<void> {
  await deletePath(metadataPath(id));
  const ext = path.extname(storageKey);
  if (ext) {
    await deletePath(path.join(config.storageDir, "processed", `${id}${ext}`));
  }

  const redis = await getRedis();
  if (redis) {
    await redis.del(`file:${id}`);
  }

  const { deleteFromS3IfConfigured } = await import("./storage");
  await deleteFromS3IfConfigured(storageKey);
}

export async function saveUploadSession(session: UploadSession): Promise<void> {
  await writeJson(sessionMetadataPath(session.sessionId), session);

  const redis = await getRedis();
  if (redis) {
    await redis.set(
      `session:${session.sessionId}`,
      JSON.stringify(session),
      "EX",
      3600
    );
  }
}

export async function getUploadSession(sessionId: string): Promise<UploadSession | null> {
  const redis = await getRedis();
  if (redis) {
    const cached = await redis.get(`session:${sessionId}`);
    if (cached) return JSON.parse(cached) as UploadSession;
  }

  return readJson<UploadSession>(sessionMetadataPath(sessionId));
}

export async function listAllFileRecords(): Promise<FileRecord[]> {
  const metaDir = path.join(config.storageDir, "metadata");

  let files: string[];
  try {
    files = await fs.readdir(metaDir);
  } catch {
    return [];
  }

  const records: FileRecord[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const record = await readJson<FileRecord>(path.join(metaDir, file));
    if (record) records.push(record);
  }
  return records;
}

export function computeExpiresAt(from = new Date()): string {
  const expires = new Date(from);
  expires.setHours(expires.getHours() + config.ttlHours);
  return expires.toISOString();
}
