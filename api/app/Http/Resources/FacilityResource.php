<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FacilityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->code,
            'code' => $this->code,
            'name' => $this->name,
            'city' => $this->city,
            'country' => $this->country,
            'countryCode' => $this->country_code,
            'region' => $this->region,
            'geo' => $this->geo_key,
            'kind' => $this->kind,
            'capacityPct' => (float) $this->capacity_pct,
            'inbound' => $this->inbound,
            'outbound' => $this->outbound,
            'staffOnShift' => $this->staff_on_shift,
            'staffPlanned' => $this->staff_planned,
            'throughputToday' => $this->throughput_today,
            'throughputTarget' => $this->throughput_target,
            'dockDoors' => $this->dock_doors,
            'docksInUse' => $this->docks_in_use,
            'floorArea' => $this->floor_area,
            'palletPositions' => $this->pallet_positions,
            'palletsStored' => $this->pallets_stored,
            'status' => $this->status,
            'shiftPattern' => $this->shift_pattern,
            'manager' => $this->manager,
            'dwellMinutes' => $this->dwell_minutes,
        ];
    }
}
