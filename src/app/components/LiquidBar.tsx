import { NEU_INSET } from "../../lib/constants";

export function LiquidBar({ value, color, height = 6 }: { value: number; color: string; height?: number }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div
      className="rounded-full w-full overflow-hidden"
      style={{ height, background: "rgba(61,52,44,0.08)", boxShadow: NEU_INSET }}
    >
      <div
        className="h-full rounded-full shimmer-bar"
        style={{
          width: `${pct}%`,
          background: color,
          transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </div>
  );
}
