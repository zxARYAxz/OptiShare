"use client";

interface ProgressBarProps {
  value: number;
  label?: string;
  sublabel?: string;
  variant?: "upload" | "process";
}

export default function ProgressBar({
  value,
  label,
  sublabel,
  variant = "upload",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const gradient =
    variant === "upload"
      ? "from-emerald-400 to-teal-500"
      : "from-violet-400 to-indigo-500";

  return (
    <div className="w-full space-y-2">
      {(label || sublabel) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-zinc-200">{label}</span>}
          {sublabel && <span className="text-zinc-400">{sublabel}</span>}
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-300 ease-out`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="text-right text-xs text-zinc-500">{clamped}%</p>
    </div>
  );
}
