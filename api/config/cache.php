<?php

use Illuminate\Support\Str;

return [
    'default' => env('CACHE_STORE', 'redis'),

    'stores' => [
        'array' => [
            'driver' => 'array',
            'serialize' => false,
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'lock_connection' => 'default',
        ],

        'file' => [
            'driver' => 'file',
            'path' => storage_path('framework/cache/data'),
        ],
    ],

    // Every cache key is prefixed so a shared Redis cannot mix applications.
    'prefix' => env('CACHE_PREFIX', Str::slug(env('APP_NAME', 'northline'), '_').'_cache_'),
];
