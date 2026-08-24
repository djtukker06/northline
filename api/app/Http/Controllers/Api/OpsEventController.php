<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OpsEventResource;
use App\Models\OpsEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OpsEventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tone' => ['sometimes', 'string', 'in:neutral,positive,warning,critical'],
            'exceptions_only' => ['sometimes', 'boolean'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:200'],
        ]);

        $events = OpsEvent::query()
            ->when(isset($validated['tone']), fn ($q) => $q->where('tone', $validated['tone']))
            ->when($validated['exceptions_only'] ?? false, fn ($q) => $q->whereIn('tone', ['warning', 'critical']))
            ->orderByDesc('occurred_at')
            ->limit((int) ($validated['limit'] ?? 40))
            ->get();

        return response()->json(['data' => OpsEventResource::collection($events)]);
    }
}
