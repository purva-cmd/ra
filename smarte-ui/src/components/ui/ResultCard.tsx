"use client";

import { clsx } from "clsx";

interface FieldProps {
  label: string;
  value: string | number | string[] | undefined | null;
  mono?: boolean;
}

export function Field({ label, value, mono }: FieldProps) {
  if (value === undefined || value === null || value === "") return null;
  const display = Array.isArray(value) ? value.join(", ") : String(value);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className={clsx("text-sm text-gray-900", mono && "font-mono")}>{display || "—"}</span>
    </div>
  );
}

interface ResultCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ResultCard({ title, subtitle, badge, children, className }: ResultCardProps) {
  return (
    <div className={clsx("card p-5", className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {badge && <div>{badge}</div>}
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

export function Divider() {
  return <div className="col-span-2 border-t border-gray-100 my-1" />;
}
