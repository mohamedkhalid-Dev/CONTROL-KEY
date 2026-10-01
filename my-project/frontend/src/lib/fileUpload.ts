/**
 * fileUpload.ts — single source of truth for any future file upload / download.
 *
 * There is currently NO user file-upload feature (no <input type=file>, no
 * chat attachments, no Supabase Storage bucket). This module exists so the
 * next feature cannot reintroduce classic flaws: executable uploads (svg/php),
 * oversized files, predictable paths, MIME sniffing, or inline serving.
 *
 * Backend mirror: backend/app/Services/FileUploadValidator.php (authoritative).
 * Frontend checks are UX-only — Laravel validation always re-checks.
 */

import type { ValidationResult } from "./validators";

/** 5 MB max — keeps mobile uploads fast + blocks zip-bomb style DoS. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Conservative allowlist. Deliberately EXCLUDES executable / active content:
 * svg (scripts), html/htm, php/js, exe/dmg. Add types only after review.
 * Key = extension, value = expected MIME(s).
 */
export const ALLOWED_UPLOADS: Record<string, string[]> = {
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  gif: ["image/gif"],
  pdf: ["application/pdf"],
  txt: ["text/plain"],
  md: ["text/markdown", "text/plain"],
  csv: ["text/csv", "text/plain"],
};

const BLOCKED_EXTENSIONS = new Set([
  "svg", "html", "htm", "xhtml", "php", "phtml", "js", "mjs",
  "exe", "dll", "bat", "cmd", "sh", "msi", "dmg", "apk",
]);

export function validateUploadFile(file: File): ValidationResult {
  const name = file.name ?? "";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (!ext || BLOCKED_EXTENSIONS.has(ext)) {
    return { ok: false, error: "That file type is blocked. Use PNG, JPG, PDF, TXT, MD or CSV." };
  }
  const allowedMimes = ALLOWED_UPLOADS[ext];
  if (!allowedMimes) {
    return { ok: false, error: "That file type is not allowed. Use PNG, JPG, PDF, TXT, MD or CSV." };
  }
  // Scan Content-Type: browser MIME must match the extension allowlist.
  // Empty type (some Android browsers) is rejected — backend sniffs bytes anyway.
  if (!file.type || !allowedMimes.includes(file.type)) {
    return { ok: false, error: "File content does not match its extension." };
  }
  if (file.size <= 0) {
    return { ok: false, error: "That file is empty." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File is too big. Keep it under 5 MB." };
  }
  return { ok: true };
}

/**
 * Randomize filenames so stored objects are unpredictable (no enumeration,
 * no overwrite, no path traversal). Keeps only the safe extension.
 * Example: "homework.pdf" -> "a3f9c1...e7.pdf"
 */
export function safeStorageName(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "bin";
  const allowed = ALLOWED_UPLOADS[ext] ? ext : "bin";
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`;
  return `${rand}.${allowed}`;
}

/** Strip path + unsafe chars for the user-visible download name. */
export function sanitizeDownloadName(name: string, fallback = "chat"): string {
  const base = name.split(/[\\/]/).pop() ?? fallback;
  const clean = base.replace(/[^\w\- ]+/g, "").slice(0, 60).trim();
  return clean || fallback;
}

/**
 * Safe download = Content-Disposition: attachment equivalent.
 * Forces save-dialog (never inline render), uses an explicit MIME
 * (text/plain for exports), revokes the object URL immediately.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  // `download` attribute is the browser equivalent of
  // Content-Disposition: attachment; filename="...".
  a.download = sanitizeDownloadName(filename);
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on next tick so large exports finish streaming first.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
