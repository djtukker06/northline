<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An API Resource is the translation layer between a database row and the JSON the
 * client receives. It exists so the two can change independently.
 *
 * Without it, controllers return models directly and every column name becomes
 * part of your public contract: rename `weight_tonnes` in the database and every
 * consumer breaks. Worse, a column added later (an internal cost, a note) is
 * exposed the moment it is created, which is a common way data leaks.
 *
 * You may hear this called a DTO (Data Transfer Object) or a serializer. Same idea.
 *
 * Note `whenLoaded()`. It only includes a relation if the controller eager-loaded
 * it. Without that guard, the resource would lazily fetch the relation per row and
 * quietly reintroduce the N+1 problem the controller worked to avoid.
 */
class ShipmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ref,
            'status' => $this->status,
            'priority' => $this->priority,
            'carrier' => $this->carrier,
            'customer' => $this->customer,
            'reference' => $this->reference,
            'cargo' => $this->cargo,

            'origin' => new FacilitySummaryResource($this->whenLoaded('origin')),
            'destination' => new FacilitySummaryResource($this->whenLoaded('destination')),

            'routeId' => $this->whenLoaded('route', fn () => $this->route->ref),
            'vehicleId' => $this->whenLoaded('vehicle', fn () => $this->vehicle?->ref),
            'driverName' => $this->whenLoaded('driver', fn () => $this->driver?->name),

            'weightTonnes' => (float) $this->weight_tonnes,
            'pallets' => $this->pallets,
            'valueEur' => $this->value_eur,
            'temperatureControlled' => (bool) $this->temperature_controlled,

            'progress' => (float) $this->progress,
            'delayMinutes' => $this->delay_minutes,

            // ISO 8601 with an explicit offset. Never send "18-08-2026 16:42": the
            // client cannot tell the timezone, and every locale reads it differently.
            'departedAt' => $this->departed_at?->toIso8601String(),
            'eta' => $this->eta?->toIso8601String(),
            'plannedEta' => $this->planned_eta?->toIso8601String(),
            'deliveredAt' => $this->delivered_at?->toIso8601String(),

            'timeline' => ShipmentEventResource::collection($this->whenLoaded('events')),
        ];
    }
}
