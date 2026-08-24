<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyMetric;
use App\Services\NetworkStatistics;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class StatisticsController extends Controller
{
    public function kpis(): JsonResponse
    {
        $stats = NetworkStatistics::make()->kpis();

        return response()->json(['data' => $stats])
            /*
             * Cache-Control tells the browser and any CDN in between how long they
             * may reuse this response without asking again.
             *
             *   public          any shared cache may store it (no user data here)
             *   max-age=30      fresh for 30 seconds
             *   s-maxage=60     but a CDN may keep it for 60
             *
             * This is a second, separate layer from the Redis cache inside the
             * service: Redis saves the database, HTTP caching saves the network.
             */
            ->header('Cache-Control', 'public, max-age=30, s-maxage=60');
    }

    public function history(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'days' => ['sometimes', 'integer', 'in:7,30,90'],
        ]);

        $days = (int) ($validated['days'] ?? 30);

        $metrics = Cache::remember(
            "northline:history:{$days}",
            (int) config('northline.cache_ttl'),
            fn () => DailyMetric::query()
                ->orderByDesc('date')
                ->limit($days)
                ->get()
                ->reverse()
                ->values()
                ->map(fn (DailyMetric $m): array => [
                    'date' => $m->date->toDateString(),
                    'label' => $m->date->format('j M'),
                    'onTime' => $m->on_time,
                    'delayed' => $m->delayed,
                    'completed' => $m->completed,
                    'volume' => $m->volume,
                    'costPerShipment' => (float) $m->cost_per_shipment,
                    'utilisation' => (float) $m->utilisation,
                    'throughput' => $m->throughput,
                ])
                ->all()
        );

        return response()->json(['data' => $metrics])
            ->header('Cache-Control', 'public, max-age=60, s-maxage=300');
    }
}
