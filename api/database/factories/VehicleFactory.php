<?php

namespace Database\Factories;

use App\Models\Driver;
use App\Models\Facility;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A factory describes how to build one plausible record. Seeders load the fixed
 * demo dataset; factories generate throwaway records on demand, which is what
 * tests want: a test that needs "a vehicle in maintenance" should not depend on
 * whether the demo data happens to contain one.
 *
 *     Vehicle::factory()->count(5)->inMaintenance()->create();
 *
 * The `state` methods below (inMaintenance, onRoad) are named after business
 * situations, so a test reads as a sentence rather than a wall of field assignments.
 */
class VehicleFactory extends Factory
{
    protected $model = Vehicle::class;

    public function definition(): array
    {
        $capacity = $this->faker->randomFloat(1, 10, 26);

        return [
            'ref' => 'NL-TRK-'.$this->faker->unique()->numberBetween(900, 9999),
            'plate' => strtoupper($this->faker->bothify('??-##-??')),
            'model' => $this->faker->randomElement([
                'Volvo FH16 500', 'Scania R450', 'DAF XF 480', 'MAN TGX 18.510',
            ]),
            'vehicle_class' => $this->faker->randomElement(['tractor', 'rigid', 'reefer', 'van']),
            'status' => 'in-transit',
            'driver_id' => Driver::factory(),
            'home_facility_id' => Facility::query()->inRandomOrder()->value('id'),
            'location_label' => 'A'.$this->faker->numberBetween(1, 61).' near '.$this->faker->city(),
            'geo_key' => 'rotterdam',
            'region' => $this->faker->randomElement(['benelux', 'dach', 'france']),
            'utilisation' => $this->faker->randomFloat(1, 60, 99),
            'fuel_per_100km' => $this->faker->randomFloat(1, 20, 34),
            'odometer' => $this->faker->numberBetween(40_000, 780_000),
            'payload_capacity' => $capacity,
            'current_load' => $this->faker->randomFloat(1, 0, $capacity),
            'next_service_km' => $this->faker->numberBetween(-2_000, 28_000),
            'next_service_date' => $this->faker->dateTimeBetween('-1 week', '+3 months'),
            'health_score' => $this->faker->numberBetween(40, 99),
            'telemetry_speed' => $this->faker->numberBetween(0, 89),
            'year_registered' => $this->faker->numberBetween(2018, 2026),
        ];
    }

    public function inMaintenance(): static
    {
        return $this->state(fn (): array => [
            'status' => 'maintenance',
            'driver_id' => null,
            'telemetry_speed' => 0,
            'current_load' => 0,
            'health_score' => $this->faker->numberBetween(34, 60),
        ]);
    }

    public function onRoad(): static
    {
        return $this->state(fn (): array => [
            'status' => 'in-transit',
            'telemetry_speed' => $this->faker->numberBetween(58, 89),
        ]);
    }
}
