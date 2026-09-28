<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Resolvers;

use Gabrielesbaiz\NovaFieldMap\Contracts\GeometryResolver;
use Gabrielesbaiz\NovaFieldMap\Support\GeoJson;

/**
 * Handles "45.6495,13.7768" and "45.6495 13.7768", the two ways a latitude
 * and longitude most often end up stored in a single string column.
 */
final class LatLngStringResolver implements GeometryResolver
{
    private const PATTERN = '/^\s*(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/';

    public function supports(mixed $value): bool
    {
        return is_string($value)
            && preg_match(self::PATTERN, $value) === 1
            && $this->parse($value) !== null;
    }

    public function toGeoJson(mixed $value): array
    {
        $pair = is_string($value) ? $this->parse($value) : null;

        return $pair === null
            ? GeoJson::EMPTY
            : GeoJson::point($pair[0], $pair[1]);
    }

    /**
     * @return array{0: float, 1: float}|null
     */
    private function parse(string $value): ?array
    {
        if (preg_match(self::PATTERN, $value, $matches) !== 1) {
            return null;
        }

        $latitude = (float) $matches[1];
        $longitude = (float) $matches[2];

        // Out-of-range numbers mean this is not a coordinate pair at all, so
        // decline rather than throwing and let another resolver try.
        if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
            return null;
        }

        return [$latitude, $longitude];
    }
}
