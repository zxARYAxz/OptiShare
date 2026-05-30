"use client";

import { useCallback, useEffect, useState } from "react";
import ExpiryCountdown from "./ExpiryCountdown";

interface FileInfo {
  id: string;
  originalName: string;
  mimeType: string;
  originalSize: number;
  optimizedSize: number | null;
  savingsPercent: number;
  optimized: boolean;
  expiresAt: string;
  downloadUrl: string;
  shareUrl: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileIcon(mime: string): string {
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.startsWith("video/")) return "🎬";
  return "📄";
}

export default function DownloadView({ fileId }: { fileId: string }) {
  const [info, setInfo] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [expired, setExpired] = useState(false);

  const fetchInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/file/${fileId}/info`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "File not found");
      }
      setInfo(await res.json());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const copyLink = async () => {
    if (!info) return;
    await navigator.clipboard.writeText(info.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-400" />
      </div>
    );
  }

  if (error || expired) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
        <p className="text-4xl">⏳</p>
        <h2 className="mt-4 text-xl font-semibold text-white">
          {expired ? "Link expired" : "File unavailable"}
        </h2>
        <p className="mt-2 text-zinc-400">
          {expired
            ? "This file has been automatically deleted."
            : error || "The file may have expired or been removed."}
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-xl bg-zinc-800 px-6 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700"
        >
          Upload a new file
        </a>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
        <div className="mb-6 text-center">
          <span className="text-5xl">{fileIcon(info.mimeType)}</span>
          <h1 className="mt-4 break-all text-lg font-semibold text-white sm:text-xl">
            {info.originalName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{info.mimeType}</p>
        </div>

        <ExpiryCountdown
          expiresAt={info.expiresAt}
          onExpired={() => setExpired(true)}
        />

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-zinc-950/50 p-3">
            <p className="text-zinc-500">Original size</p>
            <p className="font-medium text-zinc-300">
              {formatBytes(info.originalSize)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-950/50 p-3">
            <p className="text-zinc-500">Download size</p>
            <p className="font-medium text-emerald-400">
              {formatBytes(info.optimizedSize ?? info.originalSize)}
              {info.savingsPercent > 0 && (
                <span className="ml-1 text-xs text-emerald-500/80">
                  -{info.savingsPercent}%
                </span>
              )}
            </p>
          </div>
        </div>

        {info.optimized && (
          <p className="mt-4 text-center text-xs text-emerald-500/80">
            Optimized with WebP / H.264 compression
          </p>
        )}

        <a
          href={`/api/file/${info.id}`}
          download={info.originalName}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 font-semibold text-zinc-950 transition hover:opacity-90"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download file
        </a>

        <button
          onClick={copyLink}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800/50"
        >
          {copied ? "Copied!" : "Copy share link"}
        </button>
      </div>
    </div>
  );
}
