<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RouteResource;
use App\Models\Route;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RouteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'in:on-schedule,at-risk,delayed'],
            'corridor' => ['sometimes', 'string', 'max:40'],
        ]);

        $routes = Route::query()
            ->with(['origin:id,code,city', 'destination:id,code,city', 'vehicles:id,ref'])
            // withCount adds a subquery for the total instead of loading every
            // related row just to call count() on it in PHP.
            ->withCount(['shipments' => fn ($q) => $q->active()])
            ->when(isset($validated['status']), fn ($q) => $q->where('status', $validated['status']))
            ->when(isset($validated['corridor']), fn ($q) => $q->where('corridor', $validated['corridor']))
            ->orderByDesc('delay_minutes')
            ->get();

        return response()->json(['data' => RouteResource::collection($routes)]);
    }

    public function show(string $ref): JsonResponse
    {
        $route = Route::query()
            ->with(['origin', 'destination', 'stops.facility', 'vehicles:id,ref'])
            ->withCount(['shipments' => fn ($q) => $q->active()])
            ->where('ref', $ref)
            ->firstOrFail();

        return response()->json(['data' => new RouteResource($route)]);
    }
}
