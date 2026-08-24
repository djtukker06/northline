<?php

namespace Database\Seeders;

use App\Models\Driver;
use App\Models\Facility;
use Illuminate\Database\Seeder;

class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        $now = Fixture::now();

        /*
         * The fixtures reference other records by their business identifier
         * ("DRV-1040"), but the database joins on numeric primary keys. These two
         * lookups translate between the two, in one query each rather than one
         * query per row.
         */
        $driverIds = Driver::pluck('id', 'ref');
        $facilityIds = Facility::pluck('id', 'name');

        $rows = array_map(fn (array $v): array => [
            'ref' => $v['id'],
            'plate' => $v['plate'],
            'model' => $v['model'],
            'vehicle_class' => $v['vehicleClass'],
            'status' => $v['status'],
            'driver_id' => $v['driverId'] ? ($driverIds[$v['driverId']] ?? null) : null,
            'home_facility_id' => $facilityIds[$v['homeBase']] ?? null,
            'location_label' => $v['locationLabel'],
            'geo_key' => $v['geo'],
            'region' => $v['region'],
            'utilisation' => $v['utilisation'],
            'fuel_per_100km' => $v['fuelPer100km'],
            'odometer' => $v['odometer'],
            'payload_capacity' => $v['payloadCapacity'],
            'current_load' => $v['currentLoad'],
            'next_service_km' => $v['nextServiceKm'],
            'next_service_date' => substr($v['nextServiceDate'], 0, 10),
            'health_score' => $v['healthScore'],
            'telemetry_speed' => $v['telemetrySpeed'],
            'year_registered' => $v['yearRegistered'],
            'created_at' => $now,
            'updated_at' => $now,
        ], Fixture::load('vehicles'));

        Fixture::insertChunked('vehicles', $rows);

        $this->command->info('  vehicles        '.count($rows));
    }
}
