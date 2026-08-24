<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alert extends Model
{
    use HasFactory;

    protected $fillable = [
        'ref', 'severity', 'category', 'title', 'detail', 'entity_type',
        'entity_ref', 'entity_label', 'facility_id', 'raised_at', 'resolved_at',
        'owner', 'impact',
    ];

    protected function casts(): array
    {
        return [
            'raised_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('severity', '!=', 'resolved');
    }

    /**
     * Sort by how much the alert matters, then by how recent it is. MySQL has no
     * natural ordering for these words, so the ranking is spelled out.
     */
    public function scopeBySeverity(Builder $query): Builder
    {
        return $query
            ->orderByRaw("FIELD(severity, 'critical', 'warning', 'info', 'resolved')")
            ->orderByDesc('raised_at');
    }
}
