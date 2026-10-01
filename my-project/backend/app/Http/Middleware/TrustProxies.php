<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as BaseTrustProxies;

/**
 * TrustProxies — required behind Render/Railway/Vercel so HTTPS is detected
 * correctly (isSecure(), Secure cookies, HSTS, absolute URLs). Trust all
 * proxies ('*') only for headers; the app itself never trusts client IPs
 * for auth decisions. Register in bootstrap/app.php:
 *   ->withMiddleware(fn (Middleware $m) => $m->trustProxies(at: '*'))
 */
class TrustProxies extends BaseTrustProxies
{
    protected $proxies = '*';

    protected $headers = BaseTrustProxies::HEADER_X_FORWARDED_FOR
        | BaseTrustProxies::HEADER_X_FORWARDED_HOST
        | BaseTrustProxies::HEADER_X_FORWARDED_PORT
        | BaseTrustProxies::HEADER_X_FORWARDED_PROTO;
}
