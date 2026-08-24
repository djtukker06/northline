<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class OpsEventSeeder extends Seeder
{
    public function run(): void
    {
        $now = Fixture::now();

        $rows = array_map(fn (array $e): array => [
            'ref' => $e['id'],
            'occurred_at' => Fixture::ts($e['at']),
            'kind' => $e['kind'],
            'message' => $e['message'],
            'entity_ref' => $e['entityId'],
            'entity_label' => $e['entityLabel'],
            'tone' => $e['tone'],
            'href' => $e['href'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ], Fixture::load('ops_events'));

        Fixture::insertChunked('ops_events', $rows);

        $this->command->info('  ops events      '.count($rows));
    }
}
