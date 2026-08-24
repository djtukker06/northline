<?php

namespace Database\Seeders;

use App\Models\Driver;
use App\Models\Facility;
use App\Models\Route;
use App\Models\Shipment;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class ShipmentSeeder extends Seeder
{
    public function run(): void
    {
        $now = Fixture::now();

        $facilityIds = Facility::pluck('id', 'code');
        $routeIds = Route::pluck('id', 'ref');
        $vehicleIds = Vehicle::pluck('id', 'ref');
        $driverIds = Driver::pluck('id', 'ref');

        $facilityId = fn (string $ref): ?int => $facilityIds[str_replace('FAC-', '', $ref)] ?? null;

        $rows = array_map(fn (array $s): array => [
            'ref' => $s['id'],
            'origin_facility_id' => $facilityId($s['originId']),
            'destination_facility_id' => $facilityId($s['destinationId']),
            'route_id' => $routeIds[$s['routeId']] ?? null,
            'vehicle_id' => $s['vehicleId'] ? ($vehicleIds[$s['vehicleId']] ?? null) : null,
            'driver_id' => $s['driverId'] ? ($driverIds[$s['driverId']] ?? null) : null,
            'carrier' => $s['carrier'],
            'status' => $s['status'],
            'priority' => $s['priority'],
            'departed_at' => Fixture::ts($s['departedAt']),
            'eta' => Fixture::ts($s['eta']),
            'planned_eta' => Fixture::ts($s['plannedEta']),
            'delivered_at' => Fixture::ts($s['deliveredAt']),
            'weight_tonnes' => $s['weightTonnes'],
            'pallets' => $s['pallets'],
            'cargo' => $s['cargo'],
            'temperature_controlled' => $s['temperatureControlled'],
            'customer' => $s['customer'],
            'reference' => $s['reference'],
            'progress' => $s['progress'],
            'delay_minutes' => $s['delayMinutes'],
            'value_eur' => $s['valueEur'],
            'created_at' => $now,
            'updated_at' => $now,
        ], Fixture::load('shipments'));

        Fixture::insertChunked('shipments', $rows);

        // The timeline rows reference shipments by their business ref.
        $shipmentIds = Shipment::pluck('id', 'ref');

        $events = [];
        foreach (Fixture::load('shipment_events') as $e) {
            $shipmentId = $shipmentIds[$e['shipmentRef']] ?? null;
            if ($shipmentId === null) {
                continue;
            }

            $events[] = [
                'shipment_id' => $shipmentId,
                'facility_id' => $e['facilityId'] ? $facilityId($e['facilityId']) : null,
                'occurred_at' => Fixture::ts($e['at']),
                'label' => $e['label'],
                'detail' => $e['detail'],
                'state' => $e['state'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        Fixture::insertChunked('shipment_events', $events);

        $this->command->info('  shipments       '.count($rows).' ('.count($events).' timeline events)');
    }
}
