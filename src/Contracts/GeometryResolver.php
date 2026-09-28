<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Contracts;

/**
 * Converts one accepted attribute shape into a GeoJSON FeatureCollection.
 *
 * Resolvers are tried in registration order and the first that claims the
 * value wins, so narrower resolvers must be registered before broader ones.
 * Applications may append their own through the field's resolver registry.
 */
interface GeometryResolver
{
    public function supports(mixed $value): bool;

    /**
     * @return array{type: string, features: array<int, array<array-key, mixed>>}
     */
    public function toGeoJson(mixed $value): array;
}
