<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DriverSeeder extends Seeder
{
    public function run(): void
    {
        $now = Fixture::now();

        $rows = array_map(fn (array $d): array => [
            'ref' => $d['id'],
            'name' => $d['name'],
            'initials' => $d['initials'],
            'base' => $d['base'],
            'licence' => $d['licence'],
            'on_time_rate' => $d['onTimeRate'],
            'deliveries' => $d['deliveries'],
            'rating' => $d['rating'],
            'driving_minutes_left' => $d['drivingMinutesLeft'],
            'shift_ends' => Fixture::ts($d['shiftEnds']),
            'years_of_service' => $d['yearsOfService'],
            'status' => $d['status'],
            'created_at' => $now,
            'updated_at' => $now,
        ], Fixture::load('drivers'));

        Fixture::insertChunked('drivers', $rows);

        $this->command->info('  drivers         '.count($rows));
    }
}
