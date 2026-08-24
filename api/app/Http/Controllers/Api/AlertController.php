<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AlertResource;
use App\Models\Alert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'state' => ['sometimes', 'string', 'in:open,resolved,all'],
            'severity' => ['sometimes', 'string', 'in:critical,warning,info,resolved'],
            'category' => ['sometimes', 'string', 'max:24'],
            'facility' => ['sometimes', 'string', 'max:16'],
            'since_hours' => ['sometimes', 'integer', 'min:1', 'max:720'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:200'],
        ]);

        $alerts = Alert::query()
            ->with('facility:id,code,name')
            ->when(($validated['state'] ?? 'all') === 'open', fn ($q) => $q->open())
            ->when(($validated['state'] ?? null) === 'resolved', fn ($q) => $q->where('severity', 'resolved'))
            ->when(isset($validated['severity']), fn ($q) => $q->where('severity', $validated['severity']))
            ->when(isset($validated['category']), fn ($q) => $q->where('category', $validated['category']))
            ->when(isset($validated['facility']), fn ($q) => $q->whereRelation('facility', 'code', $validated['facility']))
            ->when(isset($validated['since_hours']), fn ($q) => $q->where('raised_at', '>=', now()->subHours((int) $validated['since_hours'])))
            ->bySeverity()
            ->limit((int) ($validated['limit'] ?? 100))
            ->get();

        return response()->json(['data' => AlertResource::collection($alerts)]);
    }

    public function show(string $ref): JsonResponse
    {
        $alert = Alert::query()->with('facility')->where('ref', $ref)->firstOrFail();

        return response()->json(['data' => new AlertResource($alert)]);
    }
}
