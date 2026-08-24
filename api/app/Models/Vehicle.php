<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'ref', 'plate', 'model', 'vehicle_class', 'status', 'driver_id',
        'home_facility_id', 'location_label', 'geo_key', 'region', 'utilisation',
        'fuel_per_100km', 'odometer', 'payload_capacity', 'current_load',
        'next_service_km', 'next_service_date', 'health_score', 'telemetry_speed',
        'year_registered',
    ];

    protected function casts(): array
    {
        return [
            'utilisation' => 'float',
            'fuel_per_100km' => 'float',
            'payload_capacity' => 'float',
            'current_load' => 'float',
            'odometer' => 'integer',
            'next_service_km' => 'integer',
            'health_score' => 'integer',
            'telemetry_speed' => 'integer',
            'year_registered' => 'integer',
            'next_service_date' => 'date',
        ];
    }

    /** belongsTo: this table holds the foreign key pointing at the other one. */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function homeFacility(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'home_facility_id');
    }

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    /** belongsToMany reads through the route_vehicle pivot table. */
    public function routes(): BelongsToMany
    {
        return $this->belongsToMany(Route::class, 'route_vehicle');
    }

    public function scopeOnRoad(Builder $query): Builder
    {
        return $query->where('status', 'in-transit');
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', '!=', 'maintenance');
    }
}
