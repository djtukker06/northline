<?php

/*
 * Queues move slow work out of the request. Instead of making the user wait while
 * a report is generated, the controller pushes a job onto the queue and returns
 * immediately; the `queue` container picks the job up and runs it.
 */

return [
    'default' => env('QUEUE_CONNECTION', 'redis'),

    'connections' => [
        'sync' => [
            // Runs the job immediately, in-process. Useful in tests.
            'driver' => 'sync',
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
            'queue' => env('REDIS_QUEUE', 'default'),
            // How long a job may run before it is considered stuck and retried.
            'retry_after' => 120,
            'block_for' => null,
            'after_commit' => false,
        ],
    ],

    // Jobs that fail every attempt land here rather than vanishing, so you can
    // inspect the payload and the exception, fix the cause, and replay them.
    'failed' => [
        'driver' => 'database-uuids',
        'database' => env('DB_CONNECTION', 'mysql'),
        'table' => 'failed_jobs',
    ],
];
