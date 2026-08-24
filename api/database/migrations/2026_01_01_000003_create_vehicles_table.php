<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 24)->unique();
            $table->string('plate', 24);
            $table->string('model', 80);
            $table->string('vehicle_class', 16);
            $table->string('status', 16);

            /*
             * A foreign key. It stores the id of a row in another table and asks the
             * database to guarantee that row exists. That guarantee is called
             * referential integrity: it makes it impossible to point a vehicle at a
             * driver who was deleted.
             *
             * nullOnDelete() says: if the driver is removed, set this to NULL rather
             * than deleting the vehicle. The alternatives are cascadeOnDelete()
             * (delete the vehicle too) and restrictOnDelete() (refuse the deletion).
             * Which one is right is a business decision, not a technical one.
             */
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->foreignId('home_facility_id')->nullable()->constrained('facilities')->nullOnDelete();

            $table->string('location_label', 120);
            $table->string('geo_key', 40);
            $table->string('region', 32);
            $table->decimal('utilisation', 5, 2);
            $table->decimal('fuel_per_100km', 6, 2);
            $table->unsignedInteger('odometer');
            $table->decimal('payload_capacity', 6, 2);
            $table->decimal('current_load', 6, 2);
            $table->integer('next_service_km');
            $table->date('next_service_date');
            $table->unsignedTinyInteger('health_score');
            $table->unsignedSmallInteger('telemetry_speed');
            $table->unsignedSmallInteger('year_registered');
            $table->timestamps();

            $table->index('status');
            $table->index('region');
            $table->index('vehicle_class');
            // A composite index serves queries that filter on both columns together.
            // Column order matters: this helps "status = x AND region = y" and
            // "status = x" alone, but not "region = y" alone.
            $table->index(['status', 'region']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
