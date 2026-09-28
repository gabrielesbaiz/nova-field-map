<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Resolvers;

use Gabrielesbaiz\NovaFieldMap\Contracts\GeometryResolver;
use Gabrielesbaiz\NovaFieldMap\Support\GeoJson;
use JsonException;

/**
 * Handles anything already shaped like GeoJSON: a JSON string, a decoded
 * array, or an object that serializes to one.
 */
final class GeoJsonResolver implements GeometryResolver
{
    public function supports(mixed $value): bool
    {
        if ($value instanceof \JsonSerializable) {
            $value = $value->jsonSerialize();
        }

        if (is_string($value)) {
            $value = $this->decode($value);
        }

        if (! is_array($value)) {
            return false;
        }

        if (array_is_list($value)) {
            // A list only counts as GeoJSON when its members are; a plain
            // [lat, lng] pair belongs to ArrayResolver.
            return $value !== [] && ! is_numeric($value[0]) && $this->supports($value[0]);
        }

        return isset($value['type']) && is_string($value['type']);
    }

    public function toGeoJson(mixed $value): array
    {
        return GeoJson::collect($value);
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
