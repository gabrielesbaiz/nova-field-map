<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Support;

use InvalidArgumentException;
use JsonException;

/**
 * Normalization helpers for GeoJSON payloads.
 *
 * Everything the field sends to the browser passes through here, so the Vue
 * side can assume a well-formed FeatureCollection and never has to guess at a
 * half-parsed string. In 2.x that guessing happened in the component and a
 * malformed value silently produced a blank map.
 */
final class GeoJson
{
    public const EMPTY = ['type' => 'FeatureCollection', 'features' => []];

    /**
     * Wrap any accepted GeoJSON shape into a FeatureCollection.
     *
     * Accepts a FeatureCollection, a single Feature, a bare geometry, or an
     * array of any of those. Returns an empty collection for null.
     *
     * @return array{type: string, features: array<int, array<array-key, mixed>>}
     */
    public static function collect(mixed $value): array
    {
        if ($value === null || $value === '' || $value === []) {
            return self::EMPTY;
        }

        $decoded = is_string($value) ? self::decode($value) : $value;

        if ($decoded instanceof \JsonSerializable) {
            $decoded = $decoded->jsonSerialize();
        }

        if (! is_array($decoded)) {
            return self::EMPTY;
        }

        // A list of things rather than a single GeoJSON object. A list can
        // never carry a 'type' key, so array_is_list() settles it alone.
        if (array_is_list($decoded)) {
            $features = [];

            foreach ($decoded as $item) {
                $features = array_merge($features, self::collect($item)['features']);
            }

            return ['type' => 'FeatureCollection', 'features' => $features];
        }

        return match ($decoded['type'] ?? null) {
            'FeatureCollection' => [
                'type' => 'FeatureCollection',
                'features' => self::features($decoded['features'] ?? []),
            ],
            'Feature' => ['type' => 'FeatureCollection', 'features' => [$decoded]],
            null => self::EMPTY,
            default => [
                'type' => 'FeatureCollection',
                'features' => [[
                    'type' => 'Feature',
                    'geometry' => $decoded,
                    'properties' => new \stdClass,
                ]],
            ],
        };
    }

    /**
     * Build a single-point FeatureCollection.
     *
     * @param  array<string, mixed>  $properties
     * @return array{type: string, features: array<int, array<array-key, mixed>>}
     */
    public static function point(float $latitude, float $longitude, array $properties = []): array
    {
        self::assertValidCoordinates($latitude, $longitude);

        return [
            'type' => 'FeatureCollection',
            'features' => [[
                'type' => 'Feature',
                // GeoJSON is longitude-first; getting this backwards is the
                // single most common mistake when hand-building a payload.
                'geometry' => ['type' => 'Point', 'coordinates' => [$longitude, $latitude]],
                'properties' => $properties,
            ]],
        ];
    }

    /**
     * Keep only well-formed features, discarding anything without geometry.
     *
     * @return array<int, array<array-key, mixed>>
     */
    private static function features(mixed $features): array
    {
        if (! is_array($features)) {
            return [];
        }

        $kept = [];

        foreach ($features as $feature) {
            if (is_array($feature) && isset($feature['geometry'])) {
                $kept[] = $feature;
            }
        }

        return $kept;
    }

    public static function isEmpty(mixed $collection): bool
    {
        return ! is_array($collection) || ($collection['features'] ?? []) === [];
    }

    public static function countFeatures(mixed $collection): int
    {
        return is_array($collection) ? count(self::features($collection['features'] ?? [])) : 0;
    }

    /**
     * The first coordinate pair in the collection, as [latitude, longitude].
     *
     * Used for index chips, snapshots and deeplinks, where a single
     * representative point is all that can be shown.
     *
     * @return array{0: float, 1: float}|null
     */
    public static function firstCoordinate(mixed $collection): ?array
    {
        if (! is_array($collection)) {
            return null;
        }

        foreach (self::features($collection['features'] ?? []) as $feature) {
            $position = self::firstPosition($feature['geometry'] ?? null);

            if ($position !== null) {
                return [$position[1], $position[0]];
            }
        }

        return null;
    }

    /**
     * Bounding box as [[southLat, westLng], [northLat, eastLng]].
     *
     * Returns null for an empty collection rather than an impossible box, so
     * callers fall back to a configured center instead of asking Leaflet to
     * fit invalid bounds.
     *
     * @return array{0: array{0: float, 1: float}, 1: array{0: float, 1: float}}|null
     */
    public static function bounds(mixed $collection): ?array
    {
        if (! is_array($collection)) {
            return null;
        }

        $positions = [];

        foreach (self::features($collection['features'] ?? []) as $feature) {
            $positions = array_merge($positions, self::positions($feature['geometry'] ?? null));
        }

        if ($positions === []) {
            return null;
        }

        $lngs = array_column($positions, 0);
        $lats = array_column($positions, 1);

        return [
            [(float) min($lats), (float) min($lngs)],
            [(float) max($lats), (float) max($lngs)],
        ];
    }

    /**
     * Flatten a geometry to its list of [lng, lat] positions.
     *
     * @return array<int, array{0: float, 1: float}>
     */
    public static function positions(mixed $geometry): array
    {
        if (! is_array($geometry)) {
            return [];
        }

        if (($geometry['type'] ?? null) === 'GeometryCollection') {
            $positions = [];

            $children = $geometry['geometries'] ?? [];

            foreach (is_array($children) ? $children : [] as $child) {
                $positions = array_merge($positions, self::positions($child));
            }

            return $positions;
        }

        return self::flattenCoordinates($geometry['coordinates'] ?? []);
    }

    public static function assertValidCoordinates(float $latitude, float $longitude): void
    {
        if ($latitude < -90 || $latitude > 90) {
            throw new InvalidArgumentException(
                "Latitude must be between -90 and 90, {$latitude} given."
            );
        }

        if ($longitude < -180 || $longitude > 180) {
            throw new InvalidArgumentException(
                "Longitude must be between -180 and 180, {$longitude} given."
            );
        }
    }

    /**
     * @return array<int, array{0: float, 1: float}>
     */
    private static function flattenCoordinates(mixed $coordinates): array
    {
        if (! is_array($coordinates) || $coordinates === []) {
            return [];
        }

        // A position is a flat list of two or three numbers; anything else is
        // a nesting level that still has to be unwrapped.
        if (is_numeric($coordinates[0] ?? null)) {
            return is_numeric($coordinates[1] ?? null)
                ? [[(float) $coordinates[0], (float) $coordinates[1]]]
                : [];
        }

        $positions = [];

        foreach ($coordinates as $child) {
            $positions = array_merge($positions, self::flattenCoordinates($child));
        }

        return $positions;
    }

    /**
     * @return array{0: float, 1: float}|null
     */
    private static function firstPosition(mixed $geometry): ?array
    {
        return self::positions($geometry)[0] ?? null;
    }

    private static function decode(string $value): mixed
    {
        try {
            return json_decode($value, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            // A string that is not JSON is not recoverable geometry. 2.x
            // pushed it through to Leaflet anyway and broke the map.
            return null;
        }
    }
}
