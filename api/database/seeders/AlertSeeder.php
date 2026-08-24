<?php

namespace Database\Seeders;

use App\Models\Facility;
use Illuminate\Database\Seeder;

class AlertSeeder extends Seeder
{
    public function run(): void
    {
        $now = Fixture::now();
        $facilityIds = Facility::pluck('id', 'code');
        $facilityId = fn (?string $ref): ?int => $ref
            ? ($facilityIds[str_replace('FAC-', '', $ref)] ?? null)
            : null;

        $rows = array_map(fn (array $a): array => [
            'ref' => $a['id'],
            'severity' => $a['severity'],
            'category' => $a['category'],
            'title' => $a['title'],
            'detail' => $a['detail'],
            'entity_type' => $a['entityType'],
            'entity_ref' => $a['entityId'],
            'entity_label' => $a['entityLabel'],
            'facility_id' => $facilityId($a['facilityId'] ?? null),
            'raised_at' => Fixture::ts($a['raisedAt']),
            'resolved_at' => Fixture::ts($a['resolvedAt']),
            'owner' => $a['owner'],
            'impact' => $a['impact'],
            'created_at' => $now,
            'updated_at' => $now,
        ], Fixture::load('alerts'));

        Fixture::insertChunked('alerts', $rows);

        $this->command->info('  alerts          '.count($rows));
    }
}
