<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpsEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ref,
            'at' => $this->occurred_at?->toIso8601String(),
            'kind' => $this->kind,
            'message' => $this->message,
            'entityId' => $this->entity_ref,
            'entityLabel' => $this->entity_label,
            'tone' => $this->tone,
            'href' => $this->href,
        ];
    }
}
