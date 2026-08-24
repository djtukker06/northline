<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Route extends Model
{
    use HasFactory;

    protected $fillable = [
        'ref', 'name', 'corridor', 'origin_facility_id', 'destination_facility_id',
        'distance_km', 'planned_minutes', 'actual_minutes', 'efficiency', 'status',
        'delay_minutes', 'cost_per_km', 'tolls_eur', 'co2_per_tonne_km',
    ];

    protected function casts(): array
    {
        return [
            'distance_km' => 'integer',
            'planned_minutes' => 'integer',
            'actual_minutes' => 'integer',
            'delay_minutes' => 'integer',
            'tolls_eur' => 'integer',
            'efficiency' => 'float',
            'cost_per_km' => 'float',
            'co2_per_tonne_km' => 'float',
        ];
    }

    public function origin(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'origin_facility_id');
    }

    public function destination(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'destination_facility_id');
    }

    public function stops(): HasMany
    {
        return $this->hasMany(RouteStop::class)->orderBy('position');
    }

    public function vehicles(): BelongsToMany
    {
        return $this->belongsToMany(Vehicle::class, 'route_vehicle');
    }

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }
}
