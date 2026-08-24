<?php

return [
    'name' => env('APP_NAME', 'NORTHLINE'),
    'env' => env('APP_ENV', 'production'),

    // With debug on, an error response contains the stack trace. Never on in
    // production: it exposes file paths, library versions and sometimes secrets.
    'debug' => (bool) env('APP_DEBUG', false),

    'url' => env('APP_URL', 'http://localhost:8080'),
    'timezone' => env('APP_TIMEZONE', 'UTC'),
    'locale' => 'en',
    'fallback_locale' => 'en',
    'faker_locale' => 'nl_NL',

    // Used to encrypt cookies and signed URLs. Generated once per environment
    // with `php artisan key:generate`. Changing it invalidates existing sessions.
    'cipher' => 'AES-256-CBC',
    'key' => env('APP_KEY'),
    'previous_keys' => [],

    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
    ],
];
