<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Rules;

use Closure;
use Gabrielesbaiz\NovaFieldMap\Resolvers\ResolverRegistry;
use Gabrielesbaiz\NovaFieldMap\Support\GeoJson;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates that every point of the submitted geometry falls inside a
 * permitted area — a delivery zone, a campus, a country.
 *
 * The ray-casting test runs in PHP rather than in the database so the rule
 * works the same on any connection, spatial extensions or not.
 */
final class WithinGeofence implements ValidationRule
{
    /** @var array<int, array<int, array<int, array{0: float, 1: float}>>> */
    private array $polygons;

    public function __construct(mixed $area, private readonly ?string $message = null)
    {
        $this->polygons = $this->extractPolygons(ResolverRegistry::resolve($area));
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $collection = ResolverRegistry::resolve($value);

        if (GeoJson::isEmpty($collection) || $this->polygons === []) {
            // An empty submission is the business of "required", and an
            // unusable fence should not silently reject every value.
            return;
        }

        foreach ($collection['features'] as $feature) {
            foreach (GeoJson::positions($feature['geometry'] ?? null) as $position) {
                if (! $this->contains($position[0], $position[1])) {
                    $fail($this->message ?? __('The :attribute must fall inside the permitted area.'));

                    return;
                }
            }
        }
    }

    private function contains(float $longitude, float $latitude): bool
    {
        foreach ($this->polygons as $polygon) {
            // A polygon's first ring is its outline; the rest are holes.
            if (! $this->inRing($polygon[0] ?? [], $longitude, $latitude)) {
                continue;
            }

            foreach (array_slice($polygon, 1) as $hole) {
                if ($this->inRing($hole, $longitude, $latitude)) {
                    continue 2;
                }
            }

            return true;
        }

        return false;
    }

    /**
     * Standard ray casting: count the ring edges crossed by a ray going east
     * from the point. An odd count means the point is inside.
     *
     * @param  array<int, array{0: float, 1: float}>  $ring
     */
    private function inRing(array $ring, float $longitude, float $latitude): bool
    {
        $inside = false;
        $count = count($ring);

        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            [$xi, $yi] = $ring[$i];
            [$xj, $yj] = $ring[$j];

            $straddles = ($yi > $latitude) !== ($yj > $latitude);

            if ($straddles && $longitude < ($xj - $xi) * ($latitude - $yi) / ($yj - $yi) + $xi) {
                $inside = ! $inside;
            }
        }

        return $inside;
    }

    /**
     * @param  array{type: string, features: array<int, array<array-key, mixed>>}  $collection
     * @return array<int, array<int, array<int, array{0: float, 1: float}>>>
     */
    private function extractPolygons(array $collection): array
    {
        $polygons = [];

        foreach ($collection['features'] as $feature) {
            $geometry = $feature['geometry'] ?? null;

            if (! is_array($geometry)) {
                continue;
            }

            $coordinates = $geometry['coordinates'] ?? [];

            if (($geometry['type'] ?? null) === 'Polygon') {
                $polygons[] = $this->rings($coordinates);

                continue;
            }

            if (($geometry['type'] ?? null) !== 'MultiPolygon') {
                continue;
            }

            foreach (is_array($coordinates) ? $coordinates : [] as $polygon) {
                $polygons[] = $this->rings($polygon);
            }
        }

        return array_values(array_filter($polygons));
    }

    /**
     * @return array<int, array<int, array{0: float, 1: float}>>
     */
    private function rings(mixed $coordinates): array
    {
        if (! is_array($coordinates)) {
            return [];
        }

        return array_values(array_map(
            static fn (mixed $ring): array => array_values(array_map(
                static fn (mixed $position): array => is_array($position)
                    && is_numeric($position[0] ?? null)
                    && is_numeric($position[1] ?? null)
                        ? [(float) $position[0], (float) $position[1]]
                        : [0.0, 0.0],
                is_array($ring) ? $ring : [],
            )),
            $coordinates,
        ));
    }
}
