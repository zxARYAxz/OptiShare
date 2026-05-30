import path from "path";

const rootDir = process.cwd();

export const config = {
  /** Chunk size for resumable uploads (2 MB) */
  chunkSize: 2 * 1024 * 1024,
  /** Max single file size (500 MB) */
  maxFileSize: 500 * 1024 * 1024,
  /** Hours until files expire */
  ttlHours: parseInt(process.env.FILE_TTL_HOURS || "24", 10),
  /** Local storage root */
  storageDir: process.env.STORAGE_DIR || path.join(rootDir, "storage"),
  /** Public base URL for share links */
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  /** Optional CDN prefix for downloads */
  cdnUrl: process.env.CDN_URL || "",
  /** Image WebP quality (1–100) */
  webpQuality: parseInt(process.env.WEBP_QUALITY || "82", 10),
  /** Allowed MIME types */
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/quicktime",
    "video/webm",
  ] as const,
  redis: {
    url: process.env.REDIS_URL || "",
  },
  s3: {
    enabled: Boolean(process.env.S3_BUCKET),
    bucket: process.env.S3_BUCKET || "",
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT || "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
};

export type AllowedMime = (typeof config.allowedTypes)[number];
