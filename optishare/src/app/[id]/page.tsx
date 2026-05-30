import DownloadView from "@/components/DownloadView";
import Link from "next/link";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12 sm:py-20">
      <Link
        href="/"
        className="mb-8 text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        ← Back to OptiShare
      </Link>

      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Your shared file
        </h1>
        <p className="mt-1 font-mono text-sm text-zinc-500">/{id}</p>
      </header>

      <DownloadView fileId={id} />
    </main>
  );
}
