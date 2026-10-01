<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * FileUploadValidator — single authoritative gate for ANY future upload endpoint.
 *
 * There is currently NO upload route (no Storage::put / move / store() in the
 * codebase, no Supabase Storage bucket). Use this class when adding one:
 *
 *   $data = $request->validate(FileUploadValidator::rules('attachment'));
 *   $path = FileUploadValidator::store($request->file('attachment'));
 *   return FileUploadValidator::downloadResponse($path, $originalName);
 *
 * Guarantees: allowlist extensions+MIMEs, 5 MB max, sniffed MIME (not just
 * client header), randomized hash filename, storage OUTSIDE webroot
 * (storage/app/private-uploads, never public/), executable types blocked
 * (svg/php/html/js), downloads served as Content-Disposition: attachment.
 */
class FileUploadValidator
{
    public const MAX_BYTES = 5242880; // 5 MB

    /** Extension => allowed sniffed MIME(s). No svg/html/php/js/exe by design. */
    public const ALLOWED = [
        'png'  => ['image/png'],
        'jpg'  => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'webp' => ['image/webp'],
        'gif'  => ['image/gif'],
        'pdf'  => ['application/pdf'],
        'txt'  => ['text/plain'],
        'md'   => ['text/plain', 'text/markdown'],
        'csv'  => ['text/plain', 'text/csv'],
    ];

    public const DISK = 'local'; // storage/app — NOT public webroot
    public const DIR = 'private-uploads';

    /**
     * Laravel validation rules for an upload field (mimes + max enforced
     * before any file touches disk). 5120 KB = 5 MB.
     */
    public static function rules(string $field = 'file'): array
    {
        $exts = implode(',', array_keys(self::ALLOWED));
        return [$field => ['required', 'file', "mimes:{$exts}", 'max:5120']];
    }

    /**
     * Deep-check + store with a random hash name. Throws on mismatch.
     * Returns the storage path (e.g. private-uploads/a3f9....pdf).
     */
    public static function store(UploadedFile $file): string
    {
        $ext = strtolower($file->getClientOriginalExtension());
        if (!isset(self::ALLOWED[$ext])) {
            abort(422, 'File type is not allowed. Use PNG, JPG, PDF, TXT, MD or CSV.');
        }

        // Scan Content-Type: sniff real bytes, never trust client MIME/extension.
        $sniffed = $file->getMimeType();
        if (!in_array($sniffed, self::ALLOWED[$ext], true)) {
            abort(422, 'File content does not match its extension.');
        }

        if ($file->getSize() === 0 || $file->getSize() > self::MAX_BYTES) {
            abort(422, 'File must be non-empty and under 5 MB.');
        }

        // Randomize filename: hash + safe extension only (no user input in path).
        $name = Str::random(40) . '.' . $ext;

        return $file->storeAs(self::DIR, $name, ['disk' => self::DISK]);
    }

    /**
     * Serve a stored file as a forced download (never inline execute):
     * Content-Disposition: attachment + X-Content-Type-Options: nosniff.
     * Pass the ORIGINAL user name only for the download label (sanitized).
     */
    public static function downloadResponse(string $path, ?string $label = null)
    {
        $safe = $label !== null
            ? preg_replace('/[^\w\-. ]+/', '', basename($label)) ?: 'download'
            : basename($path);

        return Storage::disk(self::DISK)->download($path, $safe, [
            'X-Content-Type-Options' => 'nosniff',
            // download() already sets Content-Disposition: attachment.
        ]);
    }
}
