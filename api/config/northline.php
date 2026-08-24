<?php

/*
 * Application-specific settings. Keeping these in their own config file rather
 * than reading env() throughout the code matters: Laravel caches configuration in
 * production with `config:cache`, and after that env() returns null everywhere
 * except inside config files.
 */

return [
    /*
     * Valid API keys, labelled by consumer. Each caller gets its own key so a
     * leaked one can be revoked without breaking every other client. Real systems
     * store hashed keys in the database with scopes and an expiry date; this is
     * the same idea at the size this project needs.
     */
    'api_keys' => array_values(array_filter([
        ['key' => env('API_KEY_DASHBOARD'), 'label' => 'dashboard', 'scopes' => ['read', 'write']],
        ['key' => env('API_KEY_READONLY'), 'label' => 'readonly', 'scopes' => ['read']],
    ], fn (array $entry): bool => ! empty($entry['key']))),

    'rate_limit_per_minute' => (int) env('RATE_LIMIT_PER_MINUTE', 120),

    'cache_ttl' => (int) env('CACHE_TTL', 60),

    // The dataset is pinned to a fixed moment so every screen agrees on "now".
    'clock' => env('NORTHLINE_CLOCK', '2026-08-18T12:20:00Z'),

    'pagination' => [
        'default_per_page' => 25,
        'max_per_page' => 100,
    ],
];
