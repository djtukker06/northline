<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Two small guarantees for every API response.
 *
 * 1. Always JSON. Without this, a client that forgets the Accept header gets an
 *    HTML error page when something breaks, and the frontend's response.json()
 *    throws a parse error that hides the real problem.
 *
 * 2. Every response carries an X-Request-Id. When the dashboard shows an error,
 *    you can hand that id to a backend developer and they can find the exact
 *    request in the logs. This is called request correlation, and it turns "it
 *    was broken this morning" into a single log lookup.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        // Honour an id the caller already generated, so a trace can span services.
        $requestId = $request->header('X-Request-Id') ?: (string) Str::uuid();
        $request->attributes->set('request_id', $requestId);

        $response = $next($request);
        $response->headers->set('X-Request-Id', $requestId);

        return $response;
    }
}
