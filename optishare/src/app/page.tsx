import UploadZone from "@/components/UploadZone";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12 sm:py-20">
      <header className="mb-10 text-center sm:mb-14">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Optimize · Share · Expire
        </div>
        <h1 className="bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          OptiShare
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400 sm:text-base">
          Upload large media files, get them optimized automatically, and share a
          temporary link that expires on its own.
        </p>
      </header>

      <UploadZone />

      <section className="mt-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {[
          {
            title: "Smart compression",
            desc: "Images → WebP, videos → optimized MP4",
            icon: "⚡",
          },
          {
            title: "Chunked uploads",
            desc: "Reliable transfers for large files",
            icon: "📦",
          },
          {
            title: "Auto-expiry",
            desc: "Files deleted after 24 hours",
            icon: "🕐",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-center sm:p-5"
          >
            <span className="text-2xl">{item.icon}</span>
            <h3 className="mt-2 text-sm font-semibold text-zinc-200">
              {item.title}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">{item.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
