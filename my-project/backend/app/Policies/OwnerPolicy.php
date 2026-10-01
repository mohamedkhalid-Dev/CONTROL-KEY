<?php

namespace App\Policies;

/**
 * OwnerPolicy — single DRY ownership gate for all per-user resources.
 * Use in any controller that accepts an object ID:
 *   OwnerPolicy::authorize($request->user()->id, $resource->user_id);
 * Never trust a raw `?id=` / `:id` / `user_id` input without this check.
 * No UI-only hiding — server aborts 403 on cross-user access.
 */
class OwnerPolicy
{
    public static function authorize(string $authUserId, string $resourceUserId): void
    {
        if ($authUserId === '' || $resourceUserId === '') {
            abort(403, 'Forbidden.');
        }
        if (!hash_equals($authUserId, $resourceUserId)) {
            abort(403, 'Forbidden.');
        }
    }

    public static function check(string $authUserId, string $resourceUserId): bool
    {
        if ($authUserId === '' || $resourceUserId === '') return false;
        return hash_equals($authUserId, $resourceUserId);
    }
}
