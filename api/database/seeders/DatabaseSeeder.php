<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A seeder fills the database with data. Two kinds are worth telling apart:
 *
 *   Reference data  - rows the application needs to work at all, such as the list
 *                     of facilities. These are seeded in every environment.
 *   Demo data       - realistic volume for development and demos. Never in
 *                     production, where real data arrives from the business.
 *
 * The dataset here comes from JSON fixtures in database/data/, generated once by
 * the frontend's tools/export-dataset.ts. Seeding from committed fixtures means
 * every developer, every CI run and every demo shows byte-identical numbers, which
 * is exactly what you want when a screenshot has to match a bug report.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding NORTHLINE dataset...');

        // Foreign keys are checked on every insert. Switching them off for the
        // load lets the tables be filled in any order and makes truncation
        // possible; they go straight back on afterwards.
        Schema::disableForeignKeyConstraints();

        foreach ([
            'shipment_events', 'shipments', 'route_vehicle', 'route_stops',
            'routes', 'vehicles', 'drivers', 'alerts', 'ops_events',
            'daily_metrics', 'facilities',
        ] as $table) {
            DB::table($table)->truncate();
        }

        Schema::enableForeignKeyConstraints();

        // Order matters: a table can only reference rows that already exist.
        $this->call([
            FacilitySeeder::class,
            DriverSeeder::class,
            VehicleSeeder::class,
            RouteSeeder::class,
            ShipmentSeeder::class,
            AlertSeeder::class,
            OpsEventSeeder::class,
            DailyMetricSeeder::class,
        ]);

        $this->command->info('Done.');
    }
}
