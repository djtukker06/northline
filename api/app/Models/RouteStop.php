<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RouteStop extends Model
{
    protected $fillable = [
        'route_id', 'facility_id', 'position', 'planned_arrival',
        'actual_arrival', 'dwell_minutes', 'status',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'dwell_minutes' => 'integer',
            'planned_arrival' => 'datetime',
            'actual_arrival' => 'datetime',
        ];
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }
}
