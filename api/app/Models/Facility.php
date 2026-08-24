<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An Eloquent model is a PHP class that stands for one database table, and an
 * instance of it stands for one row. This pattern is called an ORM, for
 * Object-Relational Mapper: it maps rows to objects so the application works with
 * `$facility->capacity_pct` instead of writing SQL by hand.
 *
 * The convenience has a cost worth knowing about, called the N+1 query problem.
 * See the comment on Shipment::class.
 */
class Facility extends Model
{
    use HasFactory;

    /**
     * Mass assignment protection. Only these columns can be filled from a single
     * array of user input. Without it, a request could smuggle in a column you
     * never meant to expose, such as an is_admin flag.
     */
    protected $fillable = [
        'code', 'name', 'city', 'country', 'country_code', 'region', 'geo_key', 'kind',
        'capacity_pct', 'inbound', 'outbound', 'staff_on_shift', 'staff_planned',
        'throughput_today', 'throughput_target', 'dock_doors', 'docks_in_use',
        'floor_area', 'pallet_positions', 'pallets_stored', 'status',
        'shift_pattern', 'manager', 'dwell_minutes',
    ];

    /**
     * Casts convert raw database values into useful PHP types on the way out.
     * MySQL hands back the string "78.00"; this turns it into the float 78.0, so
     * the JSON response carries a number rather than a string.
     */
    protected function casts(): array
    {
        return [
            'capacity_pct' => 'float',
            'inbound' => 'integer',
            'outbound' => 'integer',
            'staff_on_shift' => 'integer',
            'staff_planned' => 'integer',
            'throughput_today' => 'integer',
            'throughput_target' => 'integer',
            'dock_doors' => 'integer',
            'docks_in_use' => 'integer',
            'floor_area' => 'integer',
            'pallet_positions' => 'integer',
            'pallets_stored' => 'integer',
            'dwell_minutes' => 'integer',
        ];
    }

    public function outboundShipments(): HasMany
    {
        return $this->hasMany(Shipment::class, 'origin_facility_id');
    }

    public function inboundShipments(): HasMany
    {
        return $this->hasMany(Shipment::class, 'destination_facility_id');
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class, 'home_facility_id');
    }
}
