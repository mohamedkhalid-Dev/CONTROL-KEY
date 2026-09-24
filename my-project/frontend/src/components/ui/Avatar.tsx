import { cn } from "@/lib/utils";

const COLORS = [
  "#2563EB",
  "#0EA5E9",
  "#16A34A",
  "#EA580C",
  "#7C3AED",
  "#64748B",
];

export function avatarColorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return COLORS[h % COLORS.length];
}

export function Avatar({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      aria-label={`Avatar for ${name}`}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-extrabold text-white",
        className
      )}
      style={{
        width: size,
        height: size,
        background: avatarColorFor(name || "?"),
        fontSize: size * 0.38,
      }}
    >
      {initials || "CK"}
    </span>
  );
}
