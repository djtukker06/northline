<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 16)->unique();
            $table->string('name', 120);
            $table->string('initials', 4);
            $table->string('base', 120);
            $table->string('licence', 16);
            $table->decimal('on_time_rate', 5, 2);
            $table->unsignedInteger('deliveries');
            $table->decimal('rating', 3, 2);
            $table->unsignedInteger('driving_minutes_left');
            $table->timestamp('shift_ends')->nullable();
            $table->unsignedInteger('years_of_service');
            $table->string('status', 16);
            $table->timestamps();

            $table->index('status');
            $table->index('on_time_rate');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
