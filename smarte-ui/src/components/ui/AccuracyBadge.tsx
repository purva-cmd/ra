import { clsx } from "clsx";
import type { AccuracyGrade } from "@/types";

interface Props {
  accuracy: AccuracyGrade;
}

const config: Record<string, { label: string; className: string }> = {
  "A+": { label: "A+", className: "bg-green-100 text-green-800" },
  A: { label: "A", className: "bg-emerald-100 text-emerald-700" },
  B: { label: "B", className: "bg-yellow-100 text-yellow-800" },
  C: { label: "C", className: "bg-orange-100 text-orange-700" },
  null: { label: "No match", className: "bg-gray-100 text-gray-500" },
};

export function AccuracyBadge({ accuracy }: Props) {
  const key = accuracy ?? "null";
  const { label, className } = config[key] ?? config["null"];
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", className)}>
      {label !== "No match" && <span className="mr-1 text-[10px]">●</span>}
      {label}
    </span>
  );
}
