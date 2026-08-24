<?php

namespace Database\Factories;

use App\Models\Facility;
use Illuminate\Database\Eloquent\Factories\Factory;

class FacilityFactory extends Factory
{
    protected $model = Facility::class;

    public function definition(): array
    {
        $positions = $this->faker->numberBetween(20_000, 120_000);
        $capacity = $this->faker->randomFloat(2, 45, 95);

        return [
            'code' => strtoupper($this->faker->unique()->lexify('???')).'-01',
            'name' => $this->faker->city().' DC',
            'city' => $this->faker->city(),
            'country' => 'Netherlands',
            'country_code' => 'NL',
            'region' => 'benelux',
            'geo_key' => 'rotterdam',
            'kind' => $this->faker->randomElement(['distribution', 'hub', 'cross-dock', 'port']),
            'capacity_pct' => $capacity,
            'inbound' => $this->faker->numberBetween(20, 90),
            'outbound' => $this->faker->numberBetween(30, 110),
            'staff_on_shift' => $this->faker->numberBetween(40, 180),
            'staff_planned' => $this->faker->numberBetween(50, 190),
            'throughput_today' => $this->faker->numberBetween(60, 200),
            'throughput_target' => $this->faker->numberBetween(80, 220),
            'dock_doors' => $this->faker->numberBetween(18, 64),
            'docks_in_use' => $this->faker->numberBetween(5, 40),
            'floor_area' => $this->faker->numberBetween(16_000, 84_000),
            'pallet_positions' => $positions,
            'pallets_stored' => (int) round($positions * $capacity / 100),
            'status' => 'operational',
            'shift_pattern' => '2 shift · 24/5',
            'manager' => $this->faker->name(),
            'dwell_minutes' => $this->faker->numberBetween(40, 200),
        ];
    }

    public function nearCapacity(): static
    {
        return $this->state(fn (): array => [
            'capacity_pct' => $this->faker->randomFloat(2, 88, 96),
            'status' => 'near-capacity',
        ]);
    }
}
