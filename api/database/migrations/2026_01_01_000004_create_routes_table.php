<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('routes', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 16)->unique();
            $table->string('name', 120);
            $table->string('corridor', 40);
            $table->foreignId('origin_facility_id')->constrained('facilities')->restrictOnDelete();
            $table->foreignId('destination_facility_id')->constrained('facilities')->restrictOnDelete();
            $table->unsignedInteger('distance_km');
            $table->unsignedInteger('planned_minutes');
            $table->unsignedInteger('actual_minutes');
            $table->decimal('efficiency', 5, 2);
            $table->string('status', 16);
            $table->unsignedInteger('delay_minutes');
            $table->decimal('cost_per_km', 6, 2);
            $table->unsignedInteger('tolls_eur');
            $table->decimal('co2_per_tonne_km', 6, 2);
            $table->timestamps();

            $table->index('status');
            $table->index('corridor');
        });

        /*
         * A pivot (or junction) table. A route passes through many facilities and a
         * facility sits on many routes: a many-to-many relationship. Relational
         * databases cannot store a list inside a column, so the pairs live in their
         * own table, with any data about the pairing (here the stop order and its
         * arrival times) stored alongside.
         */
        Schema::create('route_stops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained('routes')->cascadeOnDelete();
            $table->foreignId('facility_id')->constrained('facilities')->restrictOnDelete();
            $table->unsignedTinyInteger('position');
            $table->timestamp('planned_arrival');
            $table->timestamp('actual_arrival')->nullable();
            $table->unsignedInteger('dwell_minutes');
            $table->string('status', 16);
            $table->timestamps();

            // One route cannot have two stops in the same position.
            $table->unique(['route_id', 'position']);
            $table->index('facility_id');
        });

        Schema::create('route_vehicle', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained('routes')->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['route_id', 'vehicle_id']);
        });
    }

    public function down(): void
    {
        // Dropped in reverse order: a table cannot be removed while another still
        // holds a foreign key pointing at it.
        Schema::dropIfExists('route_vehicle');
        Schema::dropIfExists('route_stops');
        Schema::dropIfExists('routes');
    }
};
