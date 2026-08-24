<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A deliberately small view of a facility, for use inside other payloads.
 *
 * Shipping the full facility object inside all 25 shipments on a page would send
 * the same 24 fields 25 times. Two shapes for one entity, a summary and a full
 * detail, is a normal and useful API design decision.
 */
class FacilitySummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->code,
            'name' => $this->name,
            'city' => $this->city,
        ];
    }
}
