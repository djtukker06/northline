<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RouteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ref,
            'name' => $this->name,
            'corridor' => $this->corridor,
            'originId' => $this->whenLoaded('origin', fn () => $this->origin->code),
            'destinationId' => $this->whenLoaded('destination', fn () => $this->destination->code),
            'distanceKm' => $this->distance_km,
            'plannedMinutes' => $this->planned_minutes,
            'actualMinutes' => $this->actual_minutes,
            'efficiency' => (float) $this->efficiency,
            'status' => $this->status,
            'delayMinutes' => $this->delay_minutes,
            'costPerKm' => (float) $this->cost_per_km,
            'tollsEur' => $this->tolls_eur,
            'co2PerTonneKm' => (float) $this->co2_per_tonne_km,
            // withCount() puts the total in shipments_count without loading the rows.
            'shipmentCount' => $this->whenCounted('shipments'),
            'vehicleIds' => $this->whenLoaded('vehicles', fn () => $this->vehicles->pluck('ref')),
            'stops' => RouteStopResource::collection($this->whenLoaded('stops')),
        ];
    }
}
