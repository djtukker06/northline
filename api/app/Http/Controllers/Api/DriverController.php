<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DriverResource;
use App\Models\Driver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'in:driving,rest,loading,off-duty'],
            'approaching_limit' => ['sometimes', 'boolean'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $drivers = Driver::query()
            ->when(isset($validated['status']), fn ($q) => $q->where('status', $validated['status']))
            ->when($validated['approaching_limit'] ?? false, fn ($q) => $q->approachingLimit())
            ->orderBy('driving_minutes_left')
            ->limit((int) ($validated['limit'] ?? 70))
            ->get();

        return response()->json(['data' => DriverResource::collection($drivers)]);
    }
}
