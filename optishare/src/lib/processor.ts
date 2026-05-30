import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { config } from "./config";
import { processedPath } from "./storage";

export interface ProcessResult {
  outputPath: string;
  mimeType: string;
  size: number;
  optimized: boolean;
  extension: string;
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

export function isImage(mime: string): boolean {
  return IMAGE_TYPES.has(mime);
}

export function isVideo(mime: string): boolean {
  return VIDEO_TYPES.has(mime);
}

export async function processFile(
  inputPath: string,
  fileId: string,
  mimeType: string
): Promise<ProcessResult> {
  if (isImage(mimeType)) {
    return processImage(inputPath, fileId, mimeType);
  }

  if (isVideo(mimeType)) {
    return processVideo(inputPath, fileId, mimeType);
  }

  const ext = path.extname(inputPath) || ".bin";
  const outputPath = processedPath(fileId, ext);
  await fs.copyFile(inputPath, outputPath);
  const stat = await fs.stat(outputPath);

  return {
    outputPath,
    mimeType,
    size: stat.size,
    optimized: false,
    extension: ext,
  };
}

async function processImage(
  inputPath: string,
  fileId: string,
  mimeType: string
): Promise<ProcessResult> {
  const outputPath = processedPath(fileId, ".webp");
  const inputStat = await fs.stat(inputPath);

  if (mimeType === "image/gif") {
    await fs.copyFile(inputPath, processedPath(fileId, ".gif"));
    return {
      outputPath: processedPath(fileId, ".gif"),
      mimeType: "image/gif",
      size: inputStat.size,
      optimized: false,
      extension: ".gif",
    };
  }

  await sharp(inputPath)
    .webp({ quality: config.webpQuality, effort: 4 })
    .toFile(outputPath);

  const outputStat = await fs.stat(outputPath);

  return {
    outputPath,
    mimeType: "image/webp",
    size: outputStat.size,
    optimized: outputStat.size < inputStat.size,
    extension: ".webp",
  };
}

async function processVideo(
  inputPath: string,
  fileId: string,
  mimeType: string
): Promise<ProcessResult> {
  const outputPath = processedPath(fileId, ".mp4");
  const inputStat = await fs.stat(inputPath);

  try {
    const ffmpeg = await import("fluent-ffmpeg");
    const ffmpegPath = process.env.FFMPEG_PATH;

    if (ffmpegPath) {
      ffmpeg.default.setFfmpegPath(ffmpegPath);
    }

    await new Promise<void>((resolve, reject) => {
      ffmpeg
        .default(inputPath)
        .outputOptions([
          "-c:v libx264",
          "-preset fast",
          "-crf 28",
          "-c:a aac",
          "-b:a 128k",
          "-movflags +faststart",
        ])
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .save(outputPath);
    });

    const outputStat = await fs.stat(outputPath);

    return {
      outputPath,
      mimeType: "video/mp4",
      size: outputStat.size,
      optimized: outputStat.size < inputStat.size,
      extension: ".mp4",
    };
  } catch {
    const ext = mimeType === "video/webm" ? ".webm" : ".mp4";
    const fallbackPath = processedPath(fileId, ext);
    await fs.copyFile(inputPath, fallbackPath);

    return {
      outputPath: fallbackPath,
      mimeType,
      size: inputStat.size,
      optimized: false,
      extension: ext,
    };
  }
}
