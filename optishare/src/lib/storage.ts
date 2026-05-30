import fs from "fs/promises";
import path from "path";
import { config } from "./config";

const dirs = {
  uploads: () => path.join(config.storageDir, "uploads"),
  chunks: () => path.join(config.storageDir, "chunks"),
  processed: () => path.join(config.storageDir, "processed"),
  metadata: () => path.join(config.storageDir, "metadata"),
  sessions: () => path.join(config.storageDir, "sessions"),
};

export async function ensureStorageDirs(): Promise<void> {
  await Promise.all(Object.values(dirs).map((d) => fs.mkdir(d(), { recursive: true })));
}

export function chunkPath(sessionId: string, index: number): string {
  return path.join(dirs.chunks(), sessionId, String(index));
}

export function sessionDir(sessionId: string): string {
  return path.join(dirs.chunks(), sessionId);
}

export function rawUploadPath(sessionId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(dirs.uploads(), `${sessionId}_${safe}`);
}

export function processedPath(fileId: string, ext: string): string {
  return path.join(dirs.processed(), `${fileId}${ext}`);
}

export function metadataPath(id: string): string {
  return path.join(dirs.metadata(), `${id}.json`);
}

export function sessionMetadataPath(sessionId: string): string {
  return path.join(dirs.sessions(), `${sessionId}.json`);
}

export async function writeFileAbsolute(filePath: string, data: Buffer): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, data);
}

export async function readFileAbsolute(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}

export async function deletePath(target: string): Promise<void> {
  try {
    await fs.rm(target, { recursive: true, force: true });
  } catch {
    // ignore missing paths
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function assembleChunks(
  sessionId: string,
  totalChunks: number,
  destPath: string
): Promise<void> {
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  const handle = await fs.open(destPath, "w");

  try {
    for (let i = 0; i < totalChunks; i++) {
      const chunk = await readFileAbsolute(chunkPath(sessionId, i));
      await handle.write(chunk);
    }
  } finally {
    await handle.close();
  }
}

export function getDownloadUrl(fileId: string): string {
  if (config.cdnUrl) {
    return `${config.cdnUrl.replace(/\/$/, "")}/${fileId}`;
  }
  return `${config.baseUrl.replace(/\/$/, "")}/api/file/${fileId}`;
}

export function getShareUrl(fileId: string): string {
  return `${config.baseUrl.replace(/\/$/, "")}/${fileId}`;
}

/** Optional S3 upload – no-op when S3 is not configured */
export async function uploadToS3IfConfigured(
  localPath: string,
  key: string
): Promise<string | null> {
  if (!config.s3.enabled) return null;

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const body = await fs.readFile(localPath);

  const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  };

  if (config.s3.endpoint) {
    clientConfig.endpoint = config.s3.endpoint;
    clientConfig.forcePathStyle = true;
  }

  const client = new S3Client(clientConfig);
  await client.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: body,
    })
  );

  if (config.cdnUrl) {
    return `${config.cdnUrl.replace(/\/$/, "")}/${key}`;
  }

  return `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;
}

export async function deleteFromS3IfConfigured(key: string): Promise<void> {
  if (!config.s3.enabled) return;

  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

  const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  };

  if (config.s3.endpoint) {
    clientConfig.endpoint = config.s3.endpoint;
    clientConfig.forcePathStyle = true;
  }

  const client = new S3Client(clientConfig);
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    })
  );
}
