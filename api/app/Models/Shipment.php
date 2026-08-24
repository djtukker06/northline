<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The busiest table in the system, and the one where query cost shows up first.
 *
 * THE N+1 PROBLEM, the single most useful thing to understand here.
 *
 * Listing 25 shipments and printing each one's origin city looks harmless:
 *
 *     foreach (Shipment::limit(25)->get() as $shipment) {
 *         echo $shipment->origin->city;      // one query, per shipment
 *     }
 *
 * That is 1 query for the shipments plus 25 for the origins: 26 queries where 2
 * would do. At 25 rows nobody notices. At 1,000 rows the endpoint takes seconds
 * and the database is the bottleneck.
 *
 * The fix is eager loading: ask for the related rows up front.
 *
 *     Shipment::with('origin')->limit(25)->get();   // 2 queries, always
 *
 * This is why a backend developer asks "which fields do you actually need?" when
 * a frontend developer requests an endpoint. Each relation you display is a join
 * they have to plan for.
 */
class Shipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'ref', 'origin_facility_id', 'destination_facility_id', 'route_id',
        'vehicle_id', 'driver_id', 'carrier', 'status', 'priority', 'departed_at',
        'eta', 'planned_eta', 'delivered_at', 'weight_tonnes', 'pallets', 'cargo',
        'temperature_controlled', 'customer', 'reference', 'progress',
        'delay_minutes', 'value_eur',
    ];

    protected function casts(): array
    {
        return [
            'departed_at' => 'datetime',
            'eta' => 'datetime',
            'planned_eta' => 'datetime',
            'delivered_at' => 'datetime',
            'weight_tonnes' => 'float',
            'progress' => 'float',
            'pallets' => 'integer',
            'delay_minutes' => 'integer',
            'value_eur' => 'integer',
            'temperature_controlled' => 'boolean',
        ];
    }

    /**
     * Relations the list view always needs. Naming them once here keeps the
     * controller from forgetting one and quietly reintroducing an N+1.
     */
    public const LIST_RELATIONS = ['origin:id,code,name,city', 'destination:id,code,name,city'];

    public const DETAIL_RELATIONS = [
        'origin', 'destination', 'route.origin', 'route.destination',
        'route.stops.facility', 'vehicle.driver', 'driver', 'events.facility',
    ];

    public function origin(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'origin_facility_id');
    }

    public function destination(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'destination_facility_id');
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(ShipmentEvent::class)->orderBy('occurred_at');
    }

    /** Everything still on the network: booked, loading, moving or held. */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', '!=', 'delivered');
    }

    /** Freight physically on the road, which is what the tonnage KPI counts. */
    public function scopeMoving(Builder $query): Builder
    {
        return $query->whereIn('status', ['in-transit', 'at-risk', 'delayed', 'customs']);
    }

    public function scopeDelivered(Builder $query): Builder
    {
        return $query->where('status', 'delivered');
    }
}
