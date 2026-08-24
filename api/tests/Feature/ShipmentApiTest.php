<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\Facility;
use App\Models\Route;
use App\Models\Shipment;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShipmentApiTest extends TestCase
{
    use RefreshDatabase;

    private Route $route;

    protected function setUp(): void
    {
        parent::setUp();

        $origin = Facility::factory()->create(['code' => 'RTM-01', 'city' => 'Rotterdam']);
        $destination = Facility::factory()->create(['code' => 'BER-01', 'city' => 'Berlin']);

        $this->route = Route::query()->create([
            'ref' => 'R-218',
            'name' => 'Rotterdam to Berlin',
            'corridor' => 'Rhine-Elbe',
            'origin_facility_id' => $origin->id,
            'destination_facility_id' => $destination->id,
            'distance_km' => 682,
            'planned_minutes' => 486,
            'actual_minutes' => 504,
            'efficiency' => 82.4,
            'status' => 'at-risk',
            'delay_minutes' => 18,
            'cost_per_km' => 1.09,
            'tolls_eur' => 106,
            'co2_per_tonne_km' => 68.3,
        ]);
    }

    private function makeShipment(array $attributes = []): Shipment
    {
        return Shipment::query()->create(array_merge([
            'ref' => 'NL-'.fake()->unique()->numberBetween(40000, 59999),
            'origin_facility_id' => $this->route->origin_facility_id,
            'destination_facility_id' => $this->route->destination_facility_id,
            'route_id' => $this->route->id,
            'vehicle_id' => null,
            'driver_id' => null,
            'carrier' => 'Northline Freight',
            'status' => 'in-transit',
            'priority' => 'normal',
            'departed_at' => now()->subHours(6),
            'eta' => now()->addHours(2),
            'planned_eta' => now()->addHours(2),
            'delivered_at' => null,
            'weight_tonnes' => 18.4,
            'pallets' => 26,
            'cargo' => 'Automotive parts',
            'temperature_controlled' => false,
            'customer' => 'Kestrel Automotive',
            'reference' => 'PO-441882',
            'progress' => 75.7,
            'delay_minutes' => 0,
            'value_eur' => 214600,
        ], $attributes));
    }

    public function test_it_lists_active_shipments_by_default(): void
    {
        $this->makeShipment(['status' => 'in-transit']);
        $this->makeShipment(['status' => 'delivered', 'delivered_at' => now()->subHour()]);

        $response = $this->getJson('/api/v1/shipments', $this->apiHeaders())->assertOk();

        // The delivered one must not appear: the dashboard opens on live work.
        $response->assertJsonCount(1, 'data');
        $this->assertSame('in-transit', $response->json('data.0.status'));
    }

    public function test_it_returns_a_pagination_envelope(): void
    {
        $this->makeShipment();

        $this->getJson('/api/v1/shipments', $this->apiHeaders())
            ->assertOk()
            // The client needs to know the total and how many pages there are, so
            // it can render "1 to 25 of 1,284" without a second request.
            ->assertJsonStructure([
                'data' => [['id', 'status', 'origin' => ['id', 'name', 'city']]],
                'links' => ['first', 'last', 'prev', 'next'],
                'meta' => ['current_page', 'from', 'last_page', 'per_page', 'to', 'total'],
            ]);
    }

    public function test_it_rejects_an_unknown_sort_field(): void
    {
        // The allow-list is the security boundary: without it this value would
        // reach an ORDER BY clause.
        $this->getJson('/api/v1/shipments?sort=id;DROP TABLE shipments', $this->apiHeaders())
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_failed');
    }

    public function test_it_caps_the_page_size(): void
    {
        $this->getJson('/api/v1/shipments?per_page=100000', $this->apiHeaders())
            ->assertStatus(422);
    }

    public function test_it_filters_by_status(): void
    {
        $this->makeShipment(['status' => 'in-transit']);
        $this->makeShipment(['status' => 'delayed', 'delay_minutes' => 45]);

        $this->getJson('/api/v1/shipments?status=delayed', $this->apiHeaders())
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'delayed');
    }

    public function test_it_searches_by_customer(): void
    {
        $this->makeShipment(['customer' => 'Kestrel Automotive']);
        $this->makeShipment(['customer' => 'Halden Pharma']);

        $this->getJson('/api/v1/shipments?search=Halden', $this->apiHeaders())
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_it_returns_one_shipment_with_its_timeline(): void
    {
        $shipment = $this->makeShipment(['ref' => 'NL-48291']);
        $shipment->events()->create([
            'occurred_at' => now()->subHours(6),
            'label' => 'Departed Rotterdam',
            'detail' => 'Vehicle NL-TRK-204',
            'state' => 'completed',
        ]);

        $this->getJson('/api/v1/shipments/NL-48291', $this->apiHeaders())
            ->assertOk()
            ->assertJsonPath('data.id', 'NL-48291')
            ->assertJsonPath('data.timeline.0.label', 'Departed Rotterdam');
    }

    public function test_it_returns_404_for_an_unknown_shipment(): void
    {
        $this->getJson('/api/v1/shipments/NL-00000', $this->apiHeaders())
            ->assertNotFound()
            ->assertJsonPath('error.code', 'not_found');
    }

    public function test_listing_shipments_does_not_trigger_n_plus_one_queries(): void
    {
        Vehicle::factory()->count(3)->create();
        Driver::factory()->count(3)->create();

        foreach (range(1, 15) as $i) {
            $this->makeShipment();
        }

        \DB::enableQueryLog();
        $this->getJson('/api/v1/shipments', $this->apiHeaders())->assertOk();
        $queries = count(\DB::getQueryLog());
        \DB::disableQueryLog();

        /*
         * The exact number matters less than the shape: it must not grow with the
         * number of rows. One count for the paginator, one for the page, one per
         * eager-loaded relation. If someone later removes the ->with() call, the
         * count jumps past this ceiling and the test fails.
         */
        $this->assertLessThanOrEqual(6, $queries, "Expected a constant number of queries, got {$queries}. Something is lazy loading.");
    }
}
