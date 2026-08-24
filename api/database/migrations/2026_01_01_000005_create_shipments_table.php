<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 24)->unique();

            $table->foreignId('origin_facility_id')->constrained('facilities')->restrictOnDelete();
            $table->foreignId('destination_facility_id')->constrained('facilities')->restrictOnDelete();
            $table->foreignId('route_id')->constrained('routes')->restrictOnDelete();
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();

            $table->string('carrier', 60);
            $table->string('status', 16);
            $table->string('priority', 12);
            $table->timestamp('departed_at');
            $table->timestamp('eta');
            $table->timestamp('planned_eta');
            $table->timestamp('delivered_at')->nullable();
            $table->decimal('weight_tonnes', 8, 2);
            $table->unsignedSmallInteger('pallets');
            $table->string('cargo', 60);
            $table->boolean('temperature_controlled')->default(false);
            $table->string('customer', 80);
            $table->string('reference', 24);
            $table->decimal('progress', 5, 2);
            $table->unsignedInteger('delay_minutes');
            $table->unsignedInteger('value_eur');
            $table->timestamps();

            /*
             * This table holds the most rows and takes the most queries, so its
             * indexes matter most.
             *
             * The composite index below serves the dashboard's default view:
             * "active shipments, soonest arrival first". The database can use one
             * index for both the filter and the sort, which avoids sorting 1,284
             * rows in memory on every page load.
             */
            $table->index(['status', 'eta']);
            $table->index('priority');
            $table->index('carrier');
            $table->index('customer');
            $table->index('origin_facility_id');
            $table->index('destination_facility_id');
            $table->index('route_id');
            $table->index('vehicle_id');
            $table->index('delivered_at');
        });

        Schema::create('shipment_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipment_id')->constrained('shipments')->cascadeOnDelete();
            $table->foreignId('facility_id')->nullable()->constrained('facilities')->nullOnDelete();
            $table->timestamp('occurred_at');
            $table->string('label', 160);
            $table->string('detail', 255)->nullable();
            $table->string('state', 16);
            $table->timestamps();

            $table->index(['shipment_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipment_events');
        Schema::dropIfExists('shipments');
    }
};
