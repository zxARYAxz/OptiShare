import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "OptiShare — Optimize & Share Files",
  description:
    "Upload, optimize, and temporarily share large media files with short links.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="relative min-h-screen bg-zinc-950">
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-3xl" />
            <div className="absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-3xl" />
          </div>

          <nav className="relative z-10 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-zinc-950">
                  O
                </span>
                <span className="font-semibold text-white">OptiShare</span>
              </Link>
              <span className="hidden text-xs text-zinc-500 sm:block">
                Temporary file sharing
              </span>
            </div>
          </nav>

          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
