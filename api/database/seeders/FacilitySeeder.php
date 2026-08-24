<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FacilitySeeder extends Seeder
{
    public function run(): void
    {
        $now = Fixture::now();

        $rows = array_map(fn (array $f): array => [
            'code' => $f['code'],
            'name' => $f['name'],
            'city' => $f['city'],
            'country' => $f['country'],
            'country_code' => $f['countryCode'],
            'region' => $f['region'],
            'geo_key' => $f['geo'],
            'kind' => $f['kind'],
            'capacity_pct' => $f['capacityPct'],
            'inbound' => $f['inbound'],
            'outbound' => $f['outbound'],
            'staff_on_shift' => $f['staffOnShift'],
            'staff_planned' => $f['staffPlanned'],
            'throughput_today' => $f['throughputToday'],
            'throughput_target' => $f['throughputTarget'],
            'dock_doors' => $f['dockDoors'],
            'docks_in_use' => $f['docksInUse'],
            'floor_area' => $f['floorArea'],
            'pallet_positions' => $f['palletPositions'],
            'pallets_stored' => $f['palletsStored'],
            'status' => $f['status'],
            'shift_pattern' => $f['shiftPattern'],
            'manager' => $f['manager'],
            'dwell_minutes' => $f['dwellMinutes'],
            'created_at' => $now,
            'updated_at' => $now,
        ], Fixture::load('facilities'));

        Fixture::insertChunked('facilities', $rows);

        $this->command->info('  facilities      '.count($rows));
    }
}
