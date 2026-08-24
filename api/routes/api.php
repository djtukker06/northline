<?php

use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\FacilityController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\OpsEventController;
use App\Http\Controllers\Api\RouteController;
use App\Http\Controllers\Api\ShipmentController;
use App\Http\Controllers\Api\StatisticsController;
use App\Http\Controllers\Api\VehicleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API routes
|--------------------------------------------------------------------------
|
| VERSIONING. Every path starts with /v1. The version is not decoration: once
| something else depends on your response shape you can no longer change it
| freely. When a breaking change is needed you publish /v2 and keep /v1 running
| until the consumers have moved. Without a version in the path, "we changed the
| API" and "we broke the dashboard" are the same event.
|
| A breaking change is anything a client could be relying on: removing a field,
| renaming one, changing its type, or narrowing what a value can be. Adding a new
| optional field is not breaking, which is why APIs grow rather than change.
|
*/

Route::prefix('v1')->group(function (): void {

    // Unauthenticated on purpose: an orchestrator has no API key and still needs
    // to know whether this instance is fit to serve.
    Route::get('health', HealthController::class)->name('health');

    // A tiny index so a developer hitting the base URL learns what exists.
    Route::get('/', fn () => response()->json([
        'name' => 'NORTHLINE API',
        'version' => 'v1',
        'documentation' => 'See docs/backend-glossary.md in the repository.',
        'authentication' => 'Send your key in the X-API-Key header.',
        'endpoints' => [
            'GET /api/v1/health' => 'Readiness probe, no key required',
            'GET /api/v1/kpis' => 'Headline network metrics',
            'GET /api/v1/history?days=7|30|90' => 'Daily performance series',
            'GET /api/v1/shipments' => 'Paginated shipments, filterable and sortable',
            'GET /api/v1/shipments/{ref}' => 'One shipment with its full timeline',
            'GET /api/v1/vehicles' => 'Paginated fleet',
            'GET /api/v1/vehicles/{ref}' => 'One vehicle with driver and current loads',
            'GET /api/v1/drivers' => 'Drivers, optionally those near their driving limit',
            'GET /api/v1/routes' => 'Corridors with stop and vehicle counts',
            'GET /api/v1/routes/{ref}' => 'One corridor with its stops',
            'GET /api/v1/facilities' => 'Warehouses and hubs',
            'GET /api/v1/facilities/{code}' => 'One facility',
            'GET /api/v1/alerts' => 'Alerts, filterable by severity and age',
            'GET /api/v1/alerts/{ref}' => 'One alert',
            'GET /api/v1/events' => 'Live operations feed',
        ],
    ]))->name('index');

    /*
     * Everything below needs a valid API key and is rate limited.
     *
     * RATE LIMITING caps how many requests one caller may make per minute. It
     * protects the database from a runaway client (a useEffect without a
     * dependency array will happily send thousands of requests a second) and
     * limits the damage from a leaked key.
     *
     * Over the limit the API answers 429 Too Many Requests with a Retry-After
     * header. A frontend should read that header and back off, rather than retry
     * immediately and make the problem worse.
     */
    Route::middleware(['api.key', 'throttle:northline'])->group(function (): void {
        Route::get('kpis', [StatisticsController::class, 'kpis'])->name('kpis');
        Route::get('history', [StatisticsController::class, 'history'])->name('history');

        Route::get('shipments', [ShipmentController::class, 'index'])->name('shipments.index');
        Route::get('shipments/{ref}', [ShipmentController::class, 'show'])->name('shipments.show');

        Route::get('vehicles', [VehicleController::class, 'index'])->name('vehicles.index');
        Route::get('vehicles/{ref}', [VehicleController::class, 'show'])->name('vehicles.show');

        Route::get('drivers', [DriverController::class, 'index'])->name('drivers.index');

        Route::get('routes', [RouteController::class, 'index'])->name('routes.index');
        Route::get('routes/{ref}', [RouteController::class, 'show'])->name('routes.show');

        Route::get('facilities', [FacilityController::class, 'index'])->name('facilities.index');
        Route::get('facilities/{code}', [FacilityController::class, 'show'])->name('facilities.show');

        Route::get('alerts', [AlertController::class, 'index'])->name('alerts.index');
        Route::get('alerts/{ref}', [AlertController::class, 'show'])->name('alerts.show');

        Route::get('events', [OpsEventController::class, 'index'])->name('events.index');
    });
});
