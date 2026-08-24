<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FacilityResource;
use App\Models\Facility;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FacilityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'region' => ['sometimes', 'string', 'max:32'],
            'kind' => ['sometimes', 'string', 'in:distribution,hub,cross-dock,port,rail'],
        ]);

        $facilities = Facility::query()
            ->when(isset($validated['region']), fn ($q) => $q->where('region', $validated['region']))
            ->when(isset($validated['kind']), fn ($q) => $q->where('kind', $validated['kind']))
            ->orderByDesc('capacity_pct')
            ->get();

        // Only 18 rows, so no pagination. Worth stating explicitly: an endpoint
        // over a bounded reference list does not need the same guards as one over
        // a table that grows with the business.
        return response()->json(['data' => FacilityResource::collection($facilities)]);
    }

    public function show(string $code): JsonResponse
    {
        $facility = Facility::query()->where('code', $code)->firstOrFail();

        return response()->json(['data' => new FacilityResource($facility)]);
    }
}
