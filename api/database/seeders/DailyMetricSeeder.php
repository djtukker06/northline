<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DailyMetricSeeder extends Seeder
{
    public function run(): void
    {
        $now = Fixture::now();

        $rows = array_map(fn (array $m): array => [
            'date' => $m['date'],
            'on_time' => $m['onTime'],
            'delayed' => $m['delayed'],
            'completed' => $m['completed'],
            'volume' => $m['volume'],
            'cost_per_shipment' => $m['costPerShipment'],
            'utilisation' => $m['utilisation'],
            'throughput' => $m['throughput'],
            'created_at' => $now,
            'updated_at' => $now,
        ], Fixture::load('daily_metrics'));

        Fixture::insertChunked('daily_metrics', $rows);

        $this->command->info('  daily metrics   '.count($rows));
    }
}
