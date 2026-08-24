<?php

namespace Database\Seeders;

use RuntimeException;

/**
 * Reads a JSON fixture from database/data/.
 *
 * The file is streamed and decoded once, then handed back as a plain array. The
 * shipments fixture is about a megabyte, which is small enough to hold in memory
 * but large enough that the inserts below are chunked rather than done row by row.
 */
final class Fixture
{
    public static function load(string $name): array
    {
        $path = database_path("data/{$name}.json");

        if (! is_readable($path)) {
            throw new RuntimeException(
                "Fixture {$name}.json is missing. Regenerate it with:\n".
                "  cd frontend && npx tsx tools/export-dataset.ts"
            );
        }

        $decoded = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        if (! is_array($decoded)) {
            throw new RuntimeException("Fixture {$name}.json did not contain an array.");
        }

        return $decoded;
    }

    /**
     * MySQL accepts a limited number of placeholders per statement, and a single
     * insert of 9,557 rows would exceed it. Chunking keeps each statement inside
     * the limit while still being far faster than one insert per row.
     */
    public static function insertChunked(string $table, array $rows, int $size = 500): void
    {
        foreach (array_chunk($rows, $size) as $chunk) {
            \Illuminate\Support\Facades\DB::table($table)->insert($chunk);
        }
    }

    /** Timestamps in the fixtures are ISO 8601; MySQL wants "Y-m-d H:i:s" in UTC. */
    public static function ts(?string $iso): ?string
    {
        return $iso === null ? null : (new \DateTimeImmutable($iso))
            ->setTimezone(new \DateTimeZone('UTC'))
            ->format('Y-m-d H:i:s');
    }

    public static function now(): string
    {
        return now()->format('Y-m-d H:i:s');
    }
}
