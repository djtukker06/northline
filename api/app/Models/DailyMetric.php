<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyMetric extends Model
{
    protected $fillable = [
        'date', 'on_time', 'delayed', 'completed', 'volume',
        'cost_per_shipment', 'utilisation', 'throughput',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'on_time' => 'integer',
            'delayed' => 'integer',
            'completed' => 'integer',
            'volume' => 'integer',
            'throughput' => 'integer',
            'cost_per_shipment' => 'float',
            'utilisation' => 'float',
        ];
    }
}
