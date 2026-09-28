<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Resolvers;

use Gabrielesbaiz\NovaFieldMap\Contracts\GeometryResolver;
use Gabrielesbaiz\NovaFieldMap\Support\GeoJson;

/**
 * Handles [lat, lng] and ['lat' => .., 'lng' => ..], including the longer
 * spellings and the casts Laravel produces for a JSON column.
 */
final class ArrayResolver implements GeometryResolver
{
    private const LATITUDE_KEYS = ['lat', 'latitude'];

    private const LONGITUDE_KEYS = ['lng', 'lon', 'long', 'longitude'];

    public function supports(mixed $value): bool
    {
        return is_array($value) && $this->parse($value) !== null;
    }

    public function toGeoJson(mixed $value): array
    {
        $pair = is_array($value) ? $this->parse($value) : null;

        return $pair === null
            ? GeoJson::EMPTY
            : GeoJson::point($pair[0], $pair[1]);
    }

    /**
     * @param  array<array-key, mixed>  $value
     * @return array{0: float, 1: float}|null
     */
    private function parse(array $value): ?array
    {
        if (array_is_list($value)) {
            // A positional pair is read latitude-first, matching Leaflet's
            // LatLng rather than GeoJSON's longitude-first positions.
            return count($value) === 2 && is_numeric($value[0]) && is_numeric($value[1])
                ? $this->validated((float) $value[0], (float) $value[1])
                : null;
        }

        $latitude = $this->pluck($value, self::LATITUDE_KEYS);
        $longitude = $this->pluck($value, self::LONGITUDE_KEYS);

        return $latitude === null || $longitude === null
            ? null
            : $this->validated($latitude, $longitude);
    }

    /**
     * @param  array<array-key, mixed>  $value
     * @param  array<int, string>  $keys
     */
    private function pluck(array $value, array $keys): ?float
    {
        foreach ($keys as $key) {
            foreach ([$key, ucfirst($key), strtoupper($key)] as $candidate) {
                if (isset($value[$candidate]) && is_numeric($value[$candidate])) {
                    return (float) $value[$candidate];
                }
            }
        }

        return null;
    }

    /**
     * @return array{0: float, 1: float}|null
     */
    private function validated(float $latitude, float $longitude): ?array
    {
        return $latitude >= -90 && $latitude <= 90 && $longitude >= -180 && $longitude <= 180
            ? [$latitude, $longitude]
            : null;
    }
}
