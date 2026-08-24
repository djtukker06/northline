<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RouteStopResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'facilityId' => $this->whenLoaded('facility', fn () => $this->facility->code),
            'plannedArrival' => $this->planned_arrival?->toIso8601String(),
            'actualArrival' => $this->actual_arrival?->toIso8601String(),
            'dwellMinutes' => $this->dwell_minutes,
            'status' => $this->status,
        ];
    }
}
