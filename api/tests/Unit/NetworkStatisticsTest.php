<?php

namespace Tests\Unit;

use App\Models\Facility;
use App\Models\Route;
use App\Models\Shipment;
use App\Models\Vehicle;
use App\Services\NetworkStatistics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * These assert the business rules behind the headline figures, which is where a
 * quiet mistake would be most expensive: a wrong number on a dashboard is worse
 * than a missing one, because nobody questions it.
 */
class NetworkStatisticsTest extends TestCase
{
    use RefreshDatabase;

    private function seedNetwork(): void
    {
        $origin = Facility::factory()->create(['code' => 'RTM-01']);
        $destination = Facility::factory()->create(['code' => 'BER-01']);

        $route = Route::query()->create([
            'ref' => 'R-1', 'name' => 'A to B', 'corridor' => 'Test',
            'origin_facility_id' => $origin->id,
            'destination_facility_id' => $destination->id,
            'distance_km' => 100, 'planned_minutes' => 100, 'actual_minutes' => 100,
            'efficiency' => 90, 'status' => 'on-schedule', 'delay_minutes' => 0,
            'cost_per_km' => 1, 'tolls_eur' => 10, 'co2_per_tonne_km' => 50,
        ]);

        $make = fn (string $status, float $weight, int $delay = 0) => Shipment::query()->create([
            'ref' => 'NL-'.fake()->unique()->numberBetween(10000, 99999),
            'origin_facility_id' => $origin->id,
            'destination_facility_id' => $destination->id,
            'route_id' => $route->id,
            'carrier' => 'Test', 'status' => $status, 'priority' => 'normal',
            'departed_at' => now()->subHour(), 'eta' => now()->addHour(),
            'planned_eta' => now()->addHour(),
            'delivered_at' => $status === 'delivered' ? now() : null,
            'weight_tonnes' => $weight, 'pallets' => 10, 'cargo' => 'Test',
            'temperature_controlled' => false, 'customer' => 'Test',
            'reference' => 'PO-1', 'progress' => 50, 'delay_minutes' => $delay,
            'value_eur' => 1000,
        ]);

        // On the road: counts toward freight tonnage.
        $make('in-transit', 10.0);
        $make('delayed', 5.0, 30);
        // Booked but not moving: active, but carrying no freight yet.
        $make('scheduled', 99.0);
        // Finished: neither active nor moving.
        $make('delivered', 50.0);
        $make('delivered', 50.0, 20);

        Vehicle::factory()->create(['status' => 'in-transit', 'utilisation' => 90]);
        Vehicle::factory()->create(['status' => 'idle', 'utilisation' => 70]);
        Vehicle::factory()->inMaintenance()->create(['utilisation' => 0]);
    }

    public function test_freight_tonnage_counts_only_shipments_on_the_road(): void
    {
        $this->seedNetwork();

        $stats = NetworkStatistics::make()->kpis();

        // 10 + 5 from the moving loads. The scheduled load's 99 t is still in a
        // warehouse and the delivered ones have already arrived.
        $this->assertSame(15, $stats['freightTonnes']);
    }

    public function test_active_shipments_exclude_delivered_ones(): void
    {
        $this->seedNetwork();

        $this->assertSame(3, NetworkStatistics::make()->kpis()['activeShipments']);
    }

    public function test_on_time_rate_is_measured_over_delivered_shipments(): void
    {
        $this->seedNetwork();

        // One of the two delivered loads arrived late.
        $this->assertSame(50.0, NetworkStatistics::make()->kpis()['onTimeRate']);
    }

    public function test_fleet_utilisation_excludes_vehicles_in_the_workshop(): void
    {
        $this->seedNetwork();

        // (90 + 70) / 2. A vehicle off the road cannot be under-used.
        $this->assertSame(80.0, NetworkStatistics::make()->kpis()['fleetUtilisation']);
    }

    public function test_results_are_cached_between_calls(): void
    {
        $this->seedNetwork();

        $stats = NetworkStatistics::make();
        $first = $stats->kpis();

        // Change the underlying data without clearing the cache.
        Shipment::query()->where('status', 'in-transit')->update(['weight_tonnes' => 999]);

        $this->assertSame($first['freightTonnes'], $stats->kpis()['freightTonnes']);

        // ...and confirm the cache, not the query, was what held it steady.
        $stats->forget();
        $this->assertNotSame($first['freightTonnes'], $stats->kpis()['freightTonnes']);
    }
}
