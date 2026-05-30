# OptiShare

A high-traffic-ready file optimization and temporary sharing web app. Upload images and videos, get them automatically compressed/converted, and share a short link that expires on its own.

**Runs fully locally** — no AWS, Redis, or external server required for development or demo use.

## Features

- **Drag-and-drop upload** with real-time progress bars
- **Chunked uploads** (2 MB chunks) for reliable large file transfers
- **Image optimization** — JPG/PNG → WebP via [Sharp](https://sharp.pixelplumbing.com/)
- **Video compression** — MP4 re-encoding via [FFmpeg](https://ffmpeg.org/) (optional, graceful fallback)
- **Short share URLs** — e.g. `localhost:3000/xH7b2Kp9`
- **Download page** with live expiry countdown
- **Auto-cleanup** — files deleted after configurable TTL (default 24h)
- **Optional scaling** — Redis metadata cache, S3 storage, CDN URLs

## Quick Start

```bash
# Clone and install
cd optishare
npm install

# Copy environment config
cp .env.example .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), drop a file, and get a share link.

## Project Structure

```
optishare/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Upload landing page
│   │   ├── [id]/page.tsx            # Download / share page
│   │   └── api/
│   │       ├── upload/
│   │       │   ├── init/route.ts    # Start chunked upload
│   │       │   ├── chunk/route.ts   # Receive chunk
│   │       │   └── complete/route.ts # Assemble + optimize
│   │       ├── upload/[sessionId]/status/route.ts
│   │       ├── file/[id]/route.ts   # Download file
│   │       ├── file/[id]/info/route.ts
│   │       └── cleanup/route.ts
│   ├── components/
│   │   ├── UploadZone.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── DownloadView.tsx
│   │   └── ExpiryCountdown.tsx
│   └── lib/
│       ├── config.ts
│       ├── storage.ts
│       ├── metadata.ts
│       ├── processor.ts
│       ├── cleanup.ts
│       └── ids.ts
├── scripts/
│   └── cleanup.js                   # Standalone expiry cleanup
└── storage/                         # Local files (gitignored)
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/upload/init` | Initialize chunked upload session |
| POST | `/api/upload/chunk` | Upload a single chunk |
| POST | `/api/upload/complete` | Assemble, optimize, return share link |
| GET | `/api/upload/[sessionId]/status` | Upload/processing status |
| GET | `/api/file/[id]` | Download optimized file |
| GET | `/api/file/[id]/info` | File metadata for download page |
| POST | `/api/cleanup` | Trigger expired file cleanup |

## Video Compression (Optional)

Install FFmpeg on your system for video optimization:

- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html), set `FFMPEG_PATH` in `.env.local`
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`

Without FFmpeg, videos are stored as-is (still shareable).

## Cleanup

Run manually or via cron:

```bash
npm run cleanup
```

Or hit `POST /api/cleanup` from a scheduler.

## Scaling to Production

For 10GB+ daily traffic, enable optional services in `.env.local`:

| Variable | Purpose |
|----------|---------|
| `REDIS_URL` | Fast metadata lookups & TTL tracking |
| `S3_BUCKET` + credentials | Object storage for processed files |
| `CDN_URL` | CloudFront/Cloudflare CDN for downloads |
| `FILE_TTL_HOURS` | Expiration window (1–24+) |

## Deploy to GitHub / Vercel

This repo is designed to be pushed to GitHub as-is:

1. `git init && git add . && git commit -m "Initial OptiShare"`
2. Create a GitHub repo and push
3. For live hosting, deploy to [Vercel](https://vercel.com) — note that serverless has file size/time limits; for heavy processing use a VPS or Docker with persistent `storage/` volume

## Tech Stack

- **Next.js 16** (App Router)
- **Sharp** — image processing
- **fluent-ffmpeg** — video processing
- **nanoid** — short URL IDs
- **Tailwind CSS** — responsive UI
- **Local filesystem** — default storage (S3 optional)

## License

MIT
