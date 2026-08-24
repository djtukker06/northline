<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * A migration is a versioned change to the database schema, written in code.
 *
 * Why not just hand-write SQL once? Because every developer and every environment
 * needs the same schema, in the same order. Migrations are committed alongside the
 * code, run in sequence, and recorded in a `migrations` table so each one runs
 * exactly once. Deploying then means "run the new migrations", not "remember to
 * ask someone to add a column on production".
 *
 * `up()` applies the change. `down()` reverses it, which is what makes a bad
 * deploy recoverable.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facilities', function (Blueprint $table) {
            // A surrogate primary key: an integer with no business meaning, used
            // for joins. Business identifiers like the site code get their own
            // column, because business values change and keys should not.
            $table->id();

            $table->string('code', 16)->unique();
            $table->string('name', 120);
            $table->string('city', 80);
            $table->string('country', 80);
            $table->string('country_code', 2);
            $table->string('region', 32);
            $table->string('geo_key', 40);
            $table->string('kind', 24);

            // Percentages are stored as decimals rather than floats. A float cannot
            // represent 0.1 exactly, which is fine for physics and wrong for money
            // and reporting.
            $table->decimal('capacity_pct', 5, 2);
            $table->unsignedInteger('inbound');
            $table->unsignedInteger('outbound');
            $table->unsignedInteger('staff_on_shift');
            $table->unsignedInteger('staff_planned');
            $table->unsignedInteger('throughput_today');
            $table->unsignedInteger('throughput_target');
            $table->unsignedInteger('dock_doors');
            $table->unsignedInteger('docks_in_use');
            $table->unsignedInteger('floor_area');
            $table->unsignedInteger('pallet_positions');
            $table->unsignedInteger('pallets_stored');
            $table->string('status', 24);
            $table->string('shift_pattern', 40);
            $table->string('manager', 80);
            $table->unsignedInteger('dwell_minutes');

            // created_at and updated_at, maintained automatically. Knowing when a
            // row last changed is worth the two columns almost every time.
            $table->timestamps();

            // An index is a lookup structure the database keeps beside the table.
            // Without one, filtering by region means reading every row; with one,
            // the database jumps straight to the matching rows. Index the columns
            // you filter and sort on, not every column: each index costs disk and
            // slows down writes.
            $table->index('region');
            $table->index('status');
            $table->index('capacity_pct');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facilities');
    }
};
