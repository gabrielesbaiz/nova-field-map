<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Http\Controllers;

use Gabrielesbaiz\NovaFieldMap\Contracts\Geocoder;
use Illuminate\Http\JsonResponse;
use Laravel\Nova\Http\Requests\NovaRequest;

/**
 * Proxies geocoding for the form field.
 *
 * Going through the application keeps provider keys off the client and lets
 * one cache entry serve every user who searches the same place.
 */
final class GeocodeController
{
    public function search(NovaRequest $request, Geocoder $geocoder): JsonResponse
    {
        $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:255'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:10'],
        ]);

        return response()->json([
            'results' => $geocoder->search(
                $request->string('query')->toString(),
                $request->integer('limit', 5),
            ),
        ]);
    }

    public function reverse(NovaRequest $request, Geocoder $geocoder): JsonResponse
    {
        $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        return response()->json([
            'components' => $geocoder->reverse(
                $request->float('latitude'),
                $request->float('longitude'),
            ),
        ]);
    }
}
