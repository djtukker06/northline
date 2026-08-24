<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ShipmentIndexRequest;
use App\Http\Resources\ShipmentResource;
use App\Models\Shipment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * A controller's only job is to turn an HTTP request into a query and a response.
 * No business rules live here; anything reusable belongs in a model scope or a
 * service class.
 *
 * REST, briefly. The URL names a *thing* and the HTTP verb says what to do with it:
 *
 *     GET    /api/v1/shipments        list them
 *     GET    /api/v1/shipments/NL-1   fetch one
 *     POST   /api/v1/shipments        create one
 *     PATCH  /api/v1/shipments/NL-1   change part of one
 *     DELETE /api/v1/shipments/NL-1   remove one
 *
 * Nouns in the path, verbs in the method. `/getShipments` is the classic sign of
 * an API that has not thought about this.
 */
class ShipmentController extends Controller
{
    public function index(ShipmentIndexRequest $request): AnonymousResourceCollection
    {
        $query = Shipment::query()
            // Eager loading. Two extra queries here instead of 50 inside the loop.
            ->with(Shipment::LIST_RELATIONS);

        $this->applyFilters($query, $request);
        $this->applySort($query, $request->string('sort', 'eta')->toString());

        $perPage = (int) $request->integer('per_page', config('northline.pagination.default_per_page'));

        /*
         * PAGINATION
         *
         * Never return an unbounded list. 1,924 shipments today is fine; 2 million
         * next year is an outage. Pagination caps what any one request can cost.
         *
         * This is offset pagination (LIMIT/OFFSET): simple, allows jumping to page
         * 50, but slows down on very deep pages because the database still walks
         * past every skipped row. The alternative, cursor pagination, is fast at any
         * depth but only moves forwards and backwards. Offset is right here.
         */
        return ShipmentResource::collection($query->paginate($perPage)->withQueryString());
    }

    public function show(string $ref): JsonResponse
    {
        $shipment = Shipment::query()
            ->with(Shipment::DETAIL_RELATIONS)
            ->where('ref', $ref)
            // firstOrFail throws a ModelNotFoundException, which the exception
            // handler turns into a clean 404 rather than a 500.
            ->firstOrFail();

        return response()->json(['data' => new ShipmentResource($shipment)]);
    }

    private function applyFilters(Builder $query, ShipmentIndexRequest $request): void
    {
        $status = $request->string('status', 'active')->toString();

        match ($status) {
            'active' => $query->active(),
            'all' => null,
            default => $query->where('status', $status),
        };

        $query
            ->when($request->filled('priority'), fn (Builder $q) => $q->where('priority', $request->string('priority')))
            ->when($request->filled('carrier'), fn (Builder $q) => $q->where('carrier', $request->string('carrier')))
            ->when($request->filled('origin'), fn (Builder $q) => $q->whereRelation('origin', 'code', $request->string('origin')))
            ->when($request->filled('destination'), fn (Builder $q) => $q->whereRelation('destination', 'code', $request->string('destination')))
            ->when($request->filled('route'), fn (Builder $q) => $q->whereRelation('route', 'ref', $request->string('route')))
            ->when($request->filled('vehicle'), fn (Builder $q) => $q->whereRelation('vehicle', 'ref', $request->string('vehicle')));

        if ($request->filled('search')) {
            $term = $request->string('search')->toString();

            /*
             * The term is bound as a parameter, never concatenated into SQL. That
             * is what makes it injection-safe: the database receives the query and
             * the value separately and can never confuse one for the other.
             *
             * A LIKE '%term%' cannot use an index, so this scans. Fine at this size;
             * at millions of rows you would reach for a full-text index or a search
             * engine such as Meilisearch or Elasticsearch.
             */
            $query->where(function (Builder $q) use ($term): void {
                $like = '%'.$term.'%';
                $q->where('ref', 'like', $like)
                    ->orWhere('reference', 'like', $like)
                    ->orWhere('customer', 'like', $like)
                    ->orWhere('cargo', 'like', $like);
            });
        }
    }

    private function applySort(Builder $query, string $sort): void
    {
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');

        // Mapping the public sort name to a column keeps the database schema out of
        // the API contract, and guarantees only these five columns are ever sorted on.
        $column = match ($field) {
            'ref' => 'ref',
            'weight' => 'weight_tonnes',
            'priority' => 'priority',
            'status' => 'status',
            default => 'eta',
        };

        $query->orderBy($column, $descending ? 'desc' : 'asc')
            // A tiebreaker on a unique column makes paging deterministic. Without
            // it, rows with equal ETAs can shuffle between pages and the user sees
            // the same shipment twice, or never.
            ->orderBy('id');
    }
}
