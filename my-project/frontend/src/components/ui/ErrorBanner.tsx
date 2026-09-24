import { CircleAlert } from "lucide-react";

export function ErrorBanner({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <span className="flex items-center gap-2">
        <CircleAlert size={16} aria-hidden className="shrink-0" /> {message}
      </span>
      {actionLabel && (
        <button onClick={onAction} className="shrink-0 font-bold underline">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
