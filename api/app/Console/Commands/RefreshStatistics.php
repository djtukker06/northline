<?php

namespace App\Console\Commands;

use App\Services\NetworkStatistics;
use Illuminate\Console\Command;

/**
 * An artisan command: a task you can run from the terminal or on a schedule.
 *
 *     docker compose exec php php artisan northline:refresh-stats
 *
 * This one warms the cache. Rather than making whichever unlucky user arrives
 * after the TTL expires wait for the aggregate queries, a scheduled job
 * recalculates them in the background and writes the result to Redis. Every real
 * request then hits a warm cache.
 *
 * The pattern is "cache warming", and it is what turns a p99 latency spike every
 * sixty seconds into a flat line.
 */
class RefreshStatistics extends Command
{
    protected $signature = 'northline:refresh-stats';

    protected $description = 'Recalculate the cached network statistics';

    public function handle(): int
    {
        $started = microtime(true);

        $stats = NetworkStatistics::make();
        $stats->forget();
        $result = $stats->kpis();

        $ms = round((microtime(true) - $started) * 1000);

        $this->info(sprintf(
            'Statistics refreshed in %dms: %s active shipments, %s%% on time, %s t moving.',
            $ms,
            number_format($result['activeShipments']),
            $result['onTimeRate'],
            number_format($result['freightTonnes']),
        ));

        // Exit codes matter: anything other than 0 tells the scheduler, CI or a
        // container runtime that the command failed.
        return self::SUCCESS;
    }
}
