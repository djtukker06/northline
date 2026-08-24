<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * API KEY AUTHENTICATION
 *
 * An API key is a long random string that identifies the *calling application*.
 * The caller sends it with every request:
 *
 *     curl -H "X-API-Key: nl_dev_dashboard_..." http://localhost:8080/api/v1/kpis
 *
 * What it is good for: telling one machine consumer from another, so usage can be
 * measured, rate-limited and revoked per consumer.
 *
 * What it is NOT: proof of who the human user is. An API key travels with the
 * application, not the person, and anything shipped to a browser is public. If the
 * dashboard ever gets user accounts, the key stays server-side and the user gets a
 * separate token. That distinction is worth remembering:
 *
 *     API key  - identifies an application. Long-lived. Server-side only.
 *     Session  - identifies a user via a cookie the browser sends automatically.
 *                Server holds the state. Vulnerable to CSRF, so needs a CSRF token.
 *     JWT      - identifies a user via a signed token the client stores and sends
 *                in an Authorization header. Server holds no state, which makes it
 *                scalable but awkward to revoke before it expires.
 *
 * In this project the Next.js server holds the key and calls the API from the
 * server side, so the key never reaches the browser. That is the pattern to insist
 * on when a backend developer hands you a key.
 */
class RequireApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $provided = $request->header('X-API-Key') ?? $request->query('api_key');

        if (blank($provided)) {
            return $this->deny('missing_api_key', 'No API key was supplied. Send it in the X-API-Key header.');
        }

        $matched = null;

        foreach (config('northline.api_keys', []) as $entry) {
            /*
             * hash_equals compares in constant time: it always takes the same
             * number of operations regardless of where the strings start to
             * differ. A normal === returns early on the first wrong character,
             * and an attacker can measure that difference to guess a key one
             * character at a time. This is called a timing attack.
             */
            if (hash_equals((string) $entry['key'], (string) $provided)) {
                $matched = $entry;
                break;
            }
        }

        if ($matched === null) {
            return $this->deny('invalid_api_key', 'That API key is not recognised.');
        }

        // Downstream code can read who is calling, for logging and rate limiting.
        $request->attributes->set('api_consumer', $matched['label']);
        $request->attributes->set('api_scopes', $matched['scopes']);

        return $next($request);
    }

    private function deny(string $code, string $message): JsonResponse
    {
        // 401 Unauthorized means "I do not know who you are".
        // 403 Forbidden means "I know who you are, and you may not do this".
        return response()->json([
            'error' => [
                'code' => $code,
                'message' => $message,
                'docs' => '/api/v1',
            ],
        ], Response::HTTP_UNAUTHORIZED);
    }
}
