<?php

use Monolog\Handler\StreamHandler;

/*
 * Logging. In a container you log to stdout/stderr rather than to a file: the
 * container runtime collects the stream and ships it wherever logs are kept.
 * Writing to a file inside a container means the logs disappear when it restarts.
 *
 * The `json` channel writes one JSON object per line. Machines can parse that;
 * a log platform can then filter on request_id or status without regex guesswork.
 */

return [
    'default' => env('LOG_CHANNEL', 'stack'),

    'deprecations' => [
        'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
        'trace' => false,
    ],

    'channels' => [
        'stack' => [
            'driver' => 'stack',
            'channels' => explode(',', env('LOG_STACK', 'json')),
            'ignore_exceptions' => false,
        ],

        'json' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => StreamHandler::class,
            'handler_with' => ['stream' => 'php://stderr'],
            'formatter' => Monolog\Formatter\JsonFormatter::class,
        ],

        'stderr' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => StreamHandler::class,
            'handler_with' => ['stream' => 'php://stderr'],
            'formatter' => env('LOG_STDERR_FORMATTER'),
        ],

        'single' => [
            'driver' => 'single',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        'null' => [
            'driver' => 'monolog',
            'handler' => Monolog\Handler\NullHandler::class,
        ],
    ],
];
