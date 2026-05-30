"use client";

import { useEffect, useState } from "react";

interface ExpiryCountdownProps {
  expiresAt: string;
  onExpired?: () => void;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function ExpiryCountdown({ expiresAt, onExpired }: ExpiryCountdownProps) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now())
  );

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setRemaining(ms);
      if (ms <= 0) onExpired?.();
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  if (remaining <= 0) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-red-400">
        This link has expired
      </div>
    );
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-4 text-center">
      <p className="text-xs uppercase tracking-wider text-amber-500/80">
        Expires in
      </p>
      <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-amber-300 sm:text-4xl">
        {hours > 0 && `${pad(hours)}:`}
        {pad(minutes)}:{pad(seconds)}
      </p>
    </div>
  );
}
