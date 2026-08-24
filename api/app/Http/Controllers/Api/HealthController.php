<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * HEALTH CHECKS
 *
 * A health endpoint answers one question: is this instance fit to serve traffic?
 * Load balancers, Kubernetes and Docker poll it and take an unhealthy instance out
 * of rotation automatically.
 *
 * Two kinds, and mixing them up causes outages:
 *
 *   Liveness  - "is the process alive?" If this fails, restart the container.
 *               Must not check dependencies: a database blip would otherwise
 *               restart every application container at once.
 *
 *   Readiness - "can it actually serve a request right now?" This one does check
 *               the database and cache. If it fails, stop sending traffic here,
 *               but do not restart: the process is fine, its dependency is not.
 *
 * Laravel's built-in /up is the liveness probe. This is the readiness probe.
 */
class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [
            'database' => $this->check(function (): string {
                DB::connection()->getPdo();
                $count = DB::table('shipments')->count();

                return "reachable, {$count} shipments";
            }),
            'cache' => $this->check(function (): string {
                $probe = 'northline:health:'.uniqid();
                Cache::put($probe, 'ok', 5);
                $value = Cache::get($probe);
                Cache::forget($probe);

                if ($value !== 'ok') {
                    throw new \RuntimeException('cache did not return what was written');
                }

                return 'read and write ok';
            }),
        ];

        $healthy = collect($checks)->every(fn (array $c): bool => $c['ok']);

        return response()->json([
            'status' => $healthy ? 'ok' : 'degraded',
            'checks' => $checks,
            'version' => config('app.version', 'dev'),
            'time' => now()->toIso8601String(),
        // 503 Service Unavailable is the correct code for "alive but not ready".
        // Returning 200 with {"status":"degraded"} defeats the point: the probe
        // reads the status code, not the body.
        ], $healthy ? 200 : 503)->header('Cache-Control', 'no-store');
    }

    private function check(callable $probe): array
    {
        $start = microtime(true);

        try {
            $detail = $probe();

            return [
                'ok' => true,
                'detail' => $detail,
                'ms' => round((microtime(true) - $start) * 1000, 1),
            ];
        } catch (Throwable $e) {
            return [
                'ok' => false,
                // The class name, never the message: an exception message can
                // contain the connection string, and this endpoint is unauthenticated.
                'detail' => class_basename($e),
                'ms' => round((microtime(true) - $start) * 1000, 1),
            ];
        }
    }
}
