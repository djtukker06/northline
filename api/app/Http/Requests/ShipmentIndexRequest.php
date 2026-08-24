<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * A Form Request validates input before the controller runs.
 *
 * Validation is not politeness, it is the security boundary. Everything arriving
 * over HTTP is attacker-controlled until proven otherwise, including values your
 * own frontend "always" sends correctly. If `sort` were passed straight into an
 * ORDER BY clause without this allow-list, that would be SQL injection.
 *
 * Note the shape: `in:...` lists exactly what is acceptable, rather than trying to
 * describe what is forbidden. Allow-lists are safe by default; deny-lists are only
 * as good as your imagination.
 *
 * On failure Laravel answers 422 Unprocessable Entity with a field-by-field list of
 * problems, which is precisely what a form needs to highlight the wrong input.
 */
class ShipmentIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'string', 'in:active,all,in-transit,loading,at-risk,delayed,customs,scheduled,delivered'],
            'priority' => ['sometimes', 'string', 'in:low,normal,high,critical'],
            'carrier' => ['sometimes', 'string', 'max:60'],
            'origin' => ['sometimes', 'string', 'max:16'],
            'destination' => ['sometimes', 'string', 'max:16'],
            'route' => ['sometimes', 'string', 'max:16'],
            'vehicle' => ['sometimes', 'string', 'max:24'],
            'search' => ['sometimes', 'string', 'max:100'],
            'sort' => ['sometimes', 'string', 'in:eta,-eta,ref,-ref,weight,-weight,priority,-priority,status,-status'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:'.config('northline.pagination.max_per_page')],
            'page' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'sort.in' => 'Sort must be one of: eta, ref, weight, priority, status. Prefix with "-" to reverse.',
            'per_page.max' => 'A page may hold at most '.config('northline.pagination.max_per_page').' records.',
        ];
    }
}
