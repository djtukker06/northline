<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Driver extends Model
{
    use HasFactory;

    protected $fillable = [
        'ref', 'name', 'initials', 'base', 'licence', 'on_time_rate', 'deliveries',
        'rating', 'driving_minutes_left', 'shift_ends', 'years_of_service', 'status',
    ];

    protected function casts(): array
    {
        return [
            'on_time_rate' => 'float',
            'rating' => 'float',
            'deliveries' => 'integer',
            'driving_minutes_left' => 'integer',
            'years_of_service' => 'integer',
            'shift_ends' => 'datetime',
        ];
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    /**
     * A query scope is a reusable fragment of a query, named after the business
     * rule it expresses. The controller then reads `Driver::approachingLimit()`
     * rather than repeating the threshold in several places, and the rule can be
     * changed in one spot.
     */
    public function scopeApproachingLimit(Builder $query, int $minutes = 60): Builder
    {
        return $query->where('status', 'driving')
            ->where('driving_minutes_left', '<=', $minutes);
    }
}
