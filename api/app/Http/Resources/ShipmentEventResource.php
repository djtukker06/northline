<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShipmentEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'at' => $this->occurred_at?->toIso8601String(),
            'label' => $this->label,
            'detail' => $this->detail,
            'state' => $this->state,
            'facilityId' => $this->whenLoaded('facility', fn () => $this->facility?->code),
        ];
    }
}
