"use client";

import { useCallback, useRef, useState } from "react";
import ProgressBar from "./ProgressBar";

type UploadPhase = "idle" | "uploading" | "processing" | "done" | "error";

interface UploadResult {
  fileId: string;
  shareUrl: string;
  originalSize: number;
  optimizedSize: number;
  savingsPercent: number;
  optimized: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processProgress, setProcessProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    setError("");
    setResult(null);
    setFileName(file.name);
    setPhase("uploading");
    setUploadProgress(0);
    setProcessProgress(0);

    try {
      const initRes = await fetch("/api/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          totalSize: file.size,
        }),
      });

      if (!initRes.ok) {
        const data = await initRes.json();
        throw new Error(data.error || "Failed to start upload");
      }

      const { sessionId, chunkSize, totalChunks } = await initRes.json();

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("sessionId", sessionId);
        formData.append("chunkIndex", String(i));
        formData.append("chunk", chunk);

        const chunkRes = await fetch("/api/upload/chunk", {
          method: "POST",
          body: formData,
        });

        if (!chunkRes.ok) {
          const data = await chunkRes.json();
          throw new Error(data.error || `Failed to upload chunk ${i + 1}`);
        }

        const { progress } = await chunkRes.json();
        setUploadProgress(progress);
      }

      setPhase("processing");
      setProcessProgress(10);

      const processInterval = setInterval(() => {
        setProcessProgress((p) => Math.min(p + 8, 90));
      }, 400);

      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      clearInterval(processInterval);

      if (!completeRes.ok) {
        const data = await completeRes.json();
        throw new Error(data.error || "Processing failed");
      }

      const data = await completeRes.json();
      setProcessProgress(100);
      setResult(data);
      setPhase("done");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      uploadFile(files[0]);
    },
    [uploadFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const reset = () => {
    setPhase("idle");
    setUploadProgress(0);
    setProcessProgress(0);
    setFileName("");
    setError("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => phase === "idle" && inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all sm:p-14 ${
          isDragging
            ? "border-emerald-400 bg-emerald-400/10"
            : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-900/80"
        } ${phase !== "idle" ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20">
          <svg
            className="h-8 w-8 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-white sm:text-2xl">
          Drop your file here
        </h2>
        <p className="mt-2 text-sm text-zinc-400 sm:text-base">
          Images &amp; videos — optimized automatically
        </p>
        <p className="mt-4 text-xs text-zinc-500">
          JPG, PNG, WebP, GIF, MP4, WebM · Max 500 MB
        </p>
      </div>

      {phase === "uploading" && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="mb-4 truncate text-sm text-zinc-300">{fileName}</p>
          <ProgressBar
            value={uploadProgress}
            label="Uploading"
            sublabel={`Chunked transfer`}
            variant="upload"
          />
        </div>
      )}

      {phase === "processing" && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="mb-4 truncate text-sm text-zinc-300">{fileName}</p>
          <ProgressBar value={100} label="Upload complete" variant="upload" />
          <div className="mt-4">
            <ProgressBar
              value={processProgress}
              label="Optimizing"
              sublabel="Converting & compressing"
              variant="process"
            />
          </div>
        </div>
      )}

      {phase === "done" && result && (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              ✓
            </span>
            <h3 className="text-lg font-semibold text-white">Ready to share</h3>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-zinc-900/60 p-3">
              <p className="text-zinc-500">Original</p>
              <p className="font-medium text-zinc-200">
                {formatBytes(result.originalSize)}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-900/60 p-3">
              <p className="text-zinc-500">Optimized</p>
              <p className="font-medium text-emerald-400">
                {formatBytes(result.optimizedSize)}
                {result.savingsPercent > 0 && (
                  <span className="ml-1 text-xs">(-{result.savingsPercent}%)</span>
                )}
              </p>
            </div>
          </div>

          <a
            href={result.shareUrl}
            className="block w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-center font-semibold text-zinc-950 transition hover:opacity-90"
          >
            Open share page
          </a>

          <button
            onClick={reset}
            className="mt-3 w-full py-2 text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            Upload another file
          </button>
        </div>
      )}

      {phase === "error" && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <p className="text-red-400">{error}</p>
          <button
            onClick={reset}
            className="mt-3 text-sm text-zinc-400 underline hover:text-zinc-200"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
