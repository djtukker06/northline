<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpsEvent extends Model
{
    protected $fillable = [
        'ref', 'occurred_at', 'kind', 'message', 'entity_ref', 'entity_label', 'tone', 'href',
    ];

    protected function casts(): array
    {
        return ['occurred_at' => 'datetime'];
    }
}
