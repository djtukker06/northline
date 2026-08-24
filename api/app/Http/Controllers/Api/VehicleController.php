<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VehicleController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'in:in-transit,loading,idle,maintenance'],
            'class' => ['sometimes', 'string', 'in:tractor,rigid,reefer,van,tanker,electric'],
            'region' => ['sometimes', 'string', 'max:32'],
            'search' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:'.config('northline.pagination.max_per_page')],
        ]);

        $query = Vehicle::query()
            ->with(['driver:id,ref,name', 'homeFacility:id,name'])
            ->when(isset($validated['status']), fn ($q) => $q->where('status', $validated['status']))
            ->when(isset($validated['class']), fn ($q) => $q->where('vehicle_class', $validated['class']))
            ->when(isset($validated['region']), fn ($q) => $q->where('region', $validated['region']))
            ->when(isset($validated['search']), function ($q) use ($validated) {
                $like = '%'.$validated['search'].'%';
                $q->where(fn ($sub) => $sub
                    ->where('ref', 'like', $like)
                    ->orWhere('plate', 'like', $like)
                    ->orWhere('model', 'like', $like)
                    ->orWhere('location_label', 'like', $like)
                    ->orWhereRelation('driver', 'name', 'like', $like));
            })
            ->orderBy('ref');

        return VehicleResource::collection(
            $query->paginate((int) ($validated['per_page'] ?? 20))->withQueryString()
        );
    }

    public function show(string $ref): JsonResponse
    {
        $vehicle = Vehicle::query()
            ->with(['driver', 'homeFacility', 'shipments' => fn ($q) => $q->active()->with('origin:id,code,city', 'destination:id,code,city')])
            ->where('ref', $ref)
            ->firstOrFail();

        return response()->json(['data' => new VehicleResource($vehicle)]);
    }
}
