<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ref,
            'plate' => $this->plate,
            'model' => $this->model,
            'vehicleClass' => $this->vehicle_class,
            'status' => $this->status,
            'driverId' => $this->whenLoaded('driver', fn () => $this->driver?->ref),
            'driverName' => $this->whenLoaded('driver', fn () => $this->driver?->name),
            'locationLabel' => $this->location_label,
            'geo' => $this->geo_key,
            'region' => $this->region,
            'utilisation' => (float) $this->utilisation,
            'fuelPer100km' => (float) $this->fuel_per_100km,
            'odometer' => $this->odometer,
            'payloadCapacity' => (float) $this->payload_capacity,
            'currentLoad' => (float) $this->current_load,
            'nextServiceKm' => $this->next_service_km,
            'nextServiceDate' => $this->next_service_date?->toIso8601String(),
            'healthScore' => $this->health_score,
            'telemetrySpeed' => $this->telemetry_speed,
            'homeBase' => $this->whenLoaded('homeFacility', fn () => $this->homeFacility?->name),
            'yearRegistered' => $this->year_registered,
        ];
    }
}
