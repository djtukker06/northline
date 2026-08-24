<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DriverResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ref,
            'name' => $this->name,
            'initials' => $this->initials,
            'base' => $this->base,
            'licence' => $this->licence,
            'onTimeRate' => (float) $this->on_time_rate,
            'deliveries' => $this->deliveries,
            'rating' => (float) $this->rating,
            'drivingMinutesLeft' => $this->driving_minutes_left,
            'shiftEnds' => $this->shift_ends?->toIso8601String(),
            'yearsOfService' => $this->years_of_service,
            'status' => $this->status,
        ];
    }
}
