<?php

namespace App\Services;

use App\Models\DailyMetric;
use App\Models\Shipment;
use App\Models\Vehicle;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * A service class: business logic that does not belong to any single model and
 * should not sit in a controller. Controllers translate HTTP to method calls;
 * services do the actual work. Keeping them apart means the same calculation can
 * be reused by a console command or a queued job without pretending to be a
 * web request.
 *
 * CACHING
 *
 * The KPI figures come from aggregate queries over 1,924 shipments and 184
 * vehicles. Correct, but too slow to repeat for every dashboard load, and the
 * numbers do not change second to second.
 *
 * So the result is cached in Redis for CACHE_TTL seconds. The first request pays
 * for the queries; the rest read from memory. That is the entire trade-off of
 * caching: you accept data that may be up to TTL seconds stale in exchange for
 * not hitting the database.
 *
 * `Cache::remember` is the "cache-aside" pattern: look in the cache, and on a miss
 * run the callback and store what it returns.
 */
class NetworkStatistics
{
    public const CACHE_KEY = 'northline:stats:v1';

    public function __construct(private readonly int $ttl)
    {
    }

    public static function make(): self
    {
        return new self((int) config('northline.cache_ttl', 60));
    }

    public function kpis(): array
    {
        return Cache::remember(self::CACHE_KEY, $this->ttl, fn (): array => $this->compute());
    }

    /** Drops the cached figures so the next request recomputes them. */
    public function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    private function compute(): array
    {
        /*
         * One query per figure, each aggregated by the database rather than in PHP.
         * Pulling 1,924 rows into PHP to sum a column would move megabytes over the
         * wire to produce a single number; SUM() does it where the data already is.
         */
        $activeCount = Shipment::query()->active()->count();

        $freightTonnes = (float) Shipment::query()->moving()->sum('weight_tonnes');

        $delivered = Shipment::query()
            ->delivered()
            ->selectRaw('COUNT(*) AS total, SUM(CASE WHEN delay_minutes = 0 THEN 1 ELSE 0 END) AS on_time')
            ->first();

        $onTimeRate = $delivered && $delivered->total > 0
            ? round(($delivered->on_time / $delivered->total) * 100, 1)
            : 0.0;

        $utilisation = (float) Vehicle::query()->available()->avg('utilisation');

        $history = DailyMetric::query()
            ->orderByDesc('date')
            ->limit(14)
            ->get()
            ->reverse()
            ->values();

        return [
            'activeShipments' => $activeCount,
            'onTimeRate' => $onTimeRate,
            'fleetUtilisation' => round($utilisation, 1),
            'freightTonnes' => (int) round($freightTonnes),
            'fleetSize' => Vehicle::query()->count(),
            'fleetByStatus' => Vehicle::query()
                ->select('status', DB::raw('COUNT(*) AS total'))
                ->groupBy('status')
                ->pluck('total', 'status'),
            'shipmentsByStatus' => Shipment::query()
                ->active()
                ->select('status', DB::raw('COUNT(*) AS total'))
                ->groupBy('status')
                ->pluck('total', 'status'),
            'history' => $history->map(fn (DailyMetric $m): array => [
                'date' => $m->date->toDateString(),
                'onTime' => $m->on_time,
                'delayed' => $m->delayed,
                'completed' => $m->completed,
                'volume' => $m->volume,
                'utilisation' => (float) $m->utilisation,
                'costPerShipment' => (float) $m->cost_per_shipment,
            ]),
            'computedAt' => now()->toIso8601String(),
        ];
    }
}
