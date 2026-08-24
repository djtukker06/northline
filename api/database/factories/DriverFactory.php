<?php

namespace Database\Factories;

use App\Models\Driver;
use Illuminate\Database\Eloquent\Factories\Factory;

class DriverFactory extends Factory
{
    protected $model = Driver::class;

    public function definition(): array
    {
        $name = $this->faker->name();

        return [
            'ref' => 'DRV-'.$this->faker->unique()->numberBetween(2000, 9999),
            'name' => $name,
            'initials' => strtoupper(substr($name, 0, 1).substr(strrchr($name, ' ') ?: 'X', 1, 1)),
            'base' => $this->faker->city(),
            'licence' => 'NL-C+E',
            'on_time_rate' => $this->faker->randomFloat(1, 86, 99.4),
            'deliveries' => $this->faker->numberBetween(210, 1840),
            'rating' => $this->faker->randomFloat(2, 4.1, 4.95),
            'driving_minutes_left' => $this->faker->numberBetween(15, 540),
            'shift_ends' => $this->faker->dateTimeBetween('+40 minutes', '+8 hours'),
            'years_of_service' => $this->faker->numberBetween(1, 17),
            'status' => $this->faker->randomElement(['driving', 'rest', 'loading', 'off-duty']),
        ];
    }

    /** Used by the compliance test: a driver about to hit their legal limit. */
    public function approachingLimit(): static
    {
        return $this->state(fn (): array => [
            'status' => 'driving',
            'driving_minutes_left' => $this->faker->numberBetween(5, 55),
        ]);
    }
}
