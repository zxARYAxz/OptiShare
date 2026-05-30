export type FileStatus = "uploading" | "processing" | "ready" | "expired" | "error";

export interface FileRecord {
  id: string;
  originalName: string;
  mimeType: string;
  originalSize: number;
  optimizedSize: number | null;
  storageKey: string;
  status: FileStatus;
  createdAt: string;
  expiresAt: string;
  error?: string;
  optimized: boolean;
}

export interface UploadSession {
  sessionId: string;
  fileName: string;
  mimeType: string;
  totalSize: number;
  totalChunks: number;
  receivedChunks: number[];
  createdAt: string;
  status: "uploading" | "processing" | "complete" | "error";
  fileId?: string;
  error?: string;
}
