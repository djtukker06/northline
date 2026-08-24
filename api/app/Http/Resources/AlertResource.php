<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlertResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ref,
            'severity' => $this->severity,
            'category' => $this->category,
            'title' => $this->title,
            'detail' => $this->detail,
            'entityType' => $this->entity_type,
            'entityId' => $this->entity_ref,
            'entityLabel' => $this->entity_label,
            'facilityId' => $this->whenLoaded('facility', fn () => $this->facility?->code),
            'raisedAt' => $this->raised_at?->toIso8601String(),
            'resolvedAt' => $this->resolved_at?->toIso8601String(),
            'owner' => $this->owner,
            'impact' => $this->impact,
        ];
    }
}
