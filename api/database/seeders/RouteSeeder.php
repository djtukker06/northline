<?php

namespace Database\Seeders;

use App\Models\Facility;
use App\Models\Route;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class RouteSeeder extends Seeder
{
    public function run(): void
    {
        $now = Fixture::now();
        $facilityIds = Facility::pluck('id', 'code');
        $fixtures = Fixture::load('routes');

        // "FAC-RTM-01" in the fixtures maps to the facility whose code is "RTM-01".
        $facilityId = fn (string $ref): ?int => $facilityIds[str_replace('FAC-', '', $ref)] ?? null;

        $rows = array_map(fn (array $r): array => [
            'ref' => $r['id'],
            'name' => $r['name'],
            'corridor' => $r['corridor'],
            'origin_facility_id' => $facilityId($r['originId']),
            'destination_facility_id' => $facilityId($r['destinationId']),
            'distance_km' => $r['distanceKm'],
            'planned_minutes' => $r['plannedMinutes'],
            'actual_minutes' => $r['actualMinutes'],
            'efficiency' => $r['efficiency'],
            'status' => $r['status'],
            'delay_minutes' => $r['delayMinutes'],
            'cost_per_km' => $r['costPerKm'],
            'tolls_eur' => $r['tollsEur'],
            'co2_per_tonne_km' => $r['co2PerTonneKm'],
            'created_at' => $now,
            'updated_at' => $now,
        ], $fixtures);

        Fixture::insertChunked('routes', $rows);

        $routeIds = Route::pluck('id', 'ref');
        $vehicleIds = Vehicle::pluck('id', 'ref');

        $stops = [];
        $links = [];

        foreach ($fixtures as $r) {
            $routeId = $routeIds[$r['id']];

            foreach ($r['stops'] as $position => $stop) {
                $stops[] = [
                    'route_id' => $routeId,
                    'facility_id' => $facilityId($stop['facilityId']),
                    'position' => $position,
                    'planned_arrival' => Fixture::ts($stop['plannedArrival']),
                    'actual_arrival' => Fixture::ts($stop['actualArrival']),
                    'dwell_minutes' => $stop['dwellMinutes'],
                    'status' => $stop['status'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach ($r['vehicleIds'] as $vehicleRef) {
                if (isset($vehicleIds[$vehicleRef])) {
                    $links[] = [
                        'route_id' => $routeId,
                        'vehicle_id' => $vehicleIds[$vehicleRef],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
        }

        Fixture::insertChunked('route_stops', $stops);
        Fixture::insertChunked('route_vehicle', $links);

        $this->command->info('  routes          '.count($rows).' ('.count($stops).' stops, '.count($links).' vehicle links)');
    }
}
