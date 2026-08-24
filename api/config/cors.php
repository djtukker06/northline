<?php

/*
 * Cross-Origin Resource Sharing.
 *
 * A browser will happily let your JavaScript call an API on the same origin
 * (same scheme, host and port). The moment the origin differs, it blocks the
 * response unless the server explicitly allows that origin with these headers.
 * The frontend runs on :3000 and the API on :8080, so they are different origins
 * and this configuration is what makes the dashboard work at all.
 *
 * Note that CORS protects the *user*, not the API. It stops a random website from
 * reading responses using the visitor's credentials. It is not authentication:
 * anything can still call the API directly with curl.
 */

return [
    'paths' => ['api/*', 'up'],

    'allowed_methods' => ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],

    // Listing exact origins rather than '*' is deliberate. A wildcard cannot be
    // combined with credentials, and it invites use from origins you never intended.
    'allowed_origins' => array_filter([
        env('FRONTEND_ORIGIN', 'http://localhost:3000'),
        env('FRONTEND_ORIGIN_ALT'),
    ]),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'X-API-Key', 'Accept', 'Authorization', 'X-Requested-With'],

    // Headers the browser is allowed to read from the response. Without this the
    // frontend cannot see our rate-limit or request-id headers.
    'exposed_headers' => ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'],

    // How long the browser may cache the preflight OPTIONS response, in seconds.
    'max_age' => 3600,

    'supports_credentials' => false,
];
