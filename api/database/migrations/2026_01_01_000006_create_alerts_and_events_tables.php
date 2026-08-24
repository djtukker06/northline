<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 16)->unique();
            $table->string('severity', 16);
            $table->string('category', 24);
            $table->string('title', 200);
            $table->text('detail');

            /*
             * A polymorphic reference: an alert can point at a shipment, a vehicle,
             * a facility, a route or a driver. Rather than five nullable foreign
             * keys, the type and the identifier are stored as plain columns.
             *
             * The trade-off is real: the database can no longer guarantee the target
             * exists, because a foreign key can only point at one table. Convenient,
             * but integrity moves from the database into the application.
             */
            $table->string('entity_type', 24);
            $table->string('entity_ref', 32);
            $table->string('entity_label', 120);

            $table->foreignId('facility_id')->nullable()->constrained('facilities')->nullOnDelete();
            $table->timestamp('raised_at');
            $table->timestamp('resolved_at')->nullable();
            $table->string('owner', 80);
            $table->string('impact', 120);
            $table->timestamps();

            $table->index(['severity', 'raised_at']);
            $table->index('category');
            $table->index('resolved_at');
            $table->index(['entity_type', 'entity_ref']);
        });

        Schema::create('ops_events', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 16)->unique();
            $table->timestamp('occurred_at');
            $table->string('kind', 24);
            $table->string('message', 255);
            $table->string('entity_ref', 32);
            $table->string('entity_label', 120);
            $table->string('tone', 16);
            $table->string('href', 160)->nullable();
            $table->timestamps();

            $table->index('occurred_at');
            $table->index('tone');
        });

        // One row per day of network history, feeding the charts.
        Schema::create('daily_metrics', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->unsignedInteger('on_time');
            $table->unsignedInteger('delayed');
            $table->unsignedInteger('completed');
            $table->unsignedInteger('volume');
            $table->decimal('cost_per_shipment', 8, 2);
            $table->decimal('utilisation', 5, 2);
            $table->unsignedInteger('throughput');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_metrics');
        Schema::dropIfExists('ops_events');
        Schema::dropIfExists('alerts');
    }
};
