<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

/**
 * A service provider is where things are registered and configured as the
 * application boots. Laravel calls register() on every provider first, then boot(),
 * so boot() can rely on everything else already being available.
 */
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->configureRateLimiting();
        $this->configureModels();
    }

    /**
     * RATE LIMITING caps how many requests one caller may make per minute. It
     * protects the database from a runaway client (a useEffect without a dependency
     * array will happily fire thousands of requests a second) and limits the damage
     * a leaked key can do.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('northline', function (Request $request): Limit {
            $perMinute = (int) config('northline.rate_limit_per_minute', 120);

            // Counted per API key rather than per IP: two consumers behind one
            // office connection would otherwise share a budget and throttle each other.
            $consumer = $request->attributes->get('api_consumer')
                ?? $request->header('X-API-Key')
                ?? $request->ip();

            return Limit::perMinute($perMinute)
                ->by((string) $consumer)
                ->response(fn (Request $r, array $headers) => response()->json([
                    'error' => [
                        'code' => 'rate_limited',
                        'message' => 'Too many requests. Retry after the number of seconds in the Retry-After header.',
                    ],
                ], 429, $headers));
        });
    }

    /**
     * Two guards that turn silent mistakes into loud ones during development.
     *
     * preventLazyLoading catches the N+1 problem at its source: touching a relation
     * that was not eager-loaded throws instead of quietly firing another query. You
     * find it on your machine rather than in production.
     *
     * preventSilentlyDiscardingAttributes throws when you fill a column missing from
     * $fillable, instead of ignoring it. Otherwise a typo in a field name means the
     * value simply never gets saved and nothing tells you.
     *
     * Both are disabled in production: a guard that turns a working page into a 500
     * is worse than the bug it was meant to surface.
     */
    private function configureModels(): void
    {
        Model::shouldBeStrict(! app()->isProduction());
    }
}
