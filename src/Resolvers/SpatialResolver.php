<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Resolvers;

use Gabrielesbaiz\NovaFieldMap\Contracts\GeometryResolver;
use Gabrielesbaiz\NovaFieldMap\Support\GeoJson;
use JsonException;
use Throwable;

/**
 * Handles spatial objects cast by the common Laravel spatial packages —
 * matanyadaev/laravel-eloquent-spatial and grimzy/laravel-mysql-spatial.
 *
 * Neither package is a dependency, so this resolver works by duck typing:
 * anything that can produce GeoJSON is accepted, whoever built it.
 */
final class SpatialResolver implements GeometryResolver
{
    public function supports(mixed $value): bool
    {
        return is_object($value) && $this->extract($value) !== null;
    }

    public function toGeoJson(mixed $value): array
    {
        $geometry = is_object($value) ? $this->extract($value) : null;

        return $geometry === null ? GeoJson::EMPTY : GeoJson::collect($geometry);
    }

    private function extract(object $value): mixed
    {
        // toGeoJson() and toJson() are the documented entry points of the two
        // packages; toArray() catches hand-rolled value objects.
        foreach (['toGeoJson', 'toJson', 'toArray'] as $method) {
            if (! method_exists($value, $method)) {
                continue;
            }

            try {
                $result = $value->{$method}();
            } catch (Throwable) {
                continue;
            }

            $decoded = is_string($result) ? $this->decode($result) : $result;

            if (is_array($decoded) && isset($decoded['type'])) {
                return $decoded;
            }
        }

        // A bare value object exposing coordinates, e.g. a spatial Point.
        if (property_exists($value, 'latitude') && property_exists($value, 'longitude')) {
            $latitude = $value->latitude;
            $longitude = $value->longitude;

            if (is_numeric($latitude) && is_numeric($longitude)) {
                return [
                    'type' => 'Point',
                    'coordinates' => [(float) $longitude, (float) $latitude],
                ];
            }
        }

        return null;
    }

    private function decode(string $value): mixed
    {
        try {
            return json_decode($value, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return null;
        }
    }
}
