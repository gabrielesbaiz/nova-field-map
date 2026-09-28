<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Concerns;

use Closure;
use Gabrielesbaiz\NovaFieldMap\Resolvers\ResolverRegistry;
use Gabrielesbaiz\NovaFieldMap\Support\GeoJson;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;

/**
 * How a field turns a model into geometry.
 *
 * The default path is the one 2.x never had: read the field's own attribute
 * off the model and let the resolver chain work out its shape. Explicit
 * overrides remain for cases where the geometry does not live in a single
 * column.
 */
trait InteractsWithGeometry
{
    /** @var array{type: string, features: array<int, array<array-key, mixed>>}|null */
    protected ?array $geometry = null;

    protected ?string $latitudeColumn = null;

    protected ?string $longitudeColumn = null;

    protected ?string $relationName = null;

    protected ?string $relationAttribute = null;

    protected ?Closure $geometryCallback = null;

    /**
     * Read the latitude and longitude from two separate columns.
     *
     * Use this when the model predates the field and splitting was never
     * worth a migration.
     */
    public function coordinates(string $latitudeColumn, string $longitudeColumn): static
    {
        $this->latitudeColumn = $latitudeColumn;
        $this->longitudeColumn = $longitudeColumn;

        return $this;
    }

    /**
     * Plot a relation, one marker per related record.
     *
     * The related attribute defaults to this field's own attribute name, so
     * a Store with a "coordinates" column needs only the relation name.
     */
    public function relation(string $relation, ?string $attribute = null): static
    {
        $this->relationName = $relation;
        $this->relationAttribute = $attribute;

        return $this;
    }

    /**
     * Build the geometry yourself.
     *
     * The callback receives the model and may return anything the resolver
     * chain accepts.
     *
     * @param  Closure(Model|object): mixed  $callback
     */
    public function geometryUsing(Closure $callback): static
    {
        $this->geometryCallback = $callback;

        return $this;
    }

    /**
     * Set geometry directly, bypassing any model lookup.
     */
    public function geoJson(mixed $geoJson): static
    {
        $this->geometry = ResolverRegistry::resolve($geoJson);

        return $this;
    }

    /**
     * Set a single point directly, bypassing any model lookup.
     *
     * @param  array<string, mixed>  $properties
     */
    public function point(float|int|string|null $latitude, float|int|string|null $longitude, array $properties = []): static
    {
        if (! is_numeric($latitude) || ! is_numeric($longitude)) {
            // A record with no coordinates yet is normal, not an error; the
            // map falls back to the configured center.
            $this->geometry = GeoJson::EMPTY;

            return $this;
        }

        $this->geometry = GeoJson::point((float) $latitude, (float) $longitude, $properties);

        return $this;
    }

    /**
     * Resolve the geometry for a record, in precedence order.
     *
     * @return array{type: string, features: array<int, array<array-key, mixed>>}
     */
    protected function resolveGeometry(mixed $resource, mixed $value): array
    {
        if ($this->geometry !== null) {
            return $this->geometry;
        }

        if ($this->geometryCallback !== null && is_object($resource)) {
            return ResolverRegistry::resolve(($this->geometryCallback)($resource));
        }

        if ($this->relationName !== null && $resource instanceof Model) {
            return $this->resolveRelationGeometry($resource);
        }

        if ($this->latitudeColumn !== null && $this->longitudeColumn !== null && is_object($resource)) {
            return $this->resolveColumnPairGeometry($resource);
        }

        return ResolverRegistry::resolve($value);
    }

    /**
     * @return array{type: string, features: array<int, array<array-key, mixed>>}
     */
    protected function resolveRelationGeometry(Model $resource): array
    {
        $relation = $this->relationName;

        if ($relation === null || ! method_exists($resource, $relation)) {
            return GeoJson::EMPTY;
        }

        $related = $resource->{$relation};

        if ($related instanceof Relation) {
            $related = $related->getResults();
        }

        $records = match (true) {
            $related instanceof Model => [$related],
            is_iterable($related) => $related,
            default => [],
        };

        $attribute = $this->relationAttribute ?? $this->attribute;

        if (! is_string($attribute)) {
            return GeoJson::EMPTY;
        }

        $features = [];

        foreach ($records as $record) {
            if (! $record instanceof Model) {
                continue;
            }

            $collection = ResolverRegistry::resolve($record->getAttribute($attribute));

            foreach ($collection['features'] as $feature) {
                $properties = (array) ($feature['properties'] ?? []);

                // Carry the record's own attributes so popups, tooltips and
                // per-feature styling can address them by column name.
                $properties += $record->attributesToArray();
                $properties['__key'] = $record->getKey();

                $feature['properties'] = $properties;
                $features[] = $feature;
            }
        }

        return ['type' => 'FeatureCollection', 'features' => $features];
    }

    /**
     * @return array{type: string, features: array<int, array<array-key, mixed>>}
     */
    protected function resolveColumnPairGeometry(object $resource): array
    {
        $latitudeColumn = $this->latitudeColumn;
        $longitudeColumn = $this->longitudeColumn;

        if ($latitudeColumn === null || $longitudeColumn === null) {
            return GeoJson::EMPTY;
        }

        $latitude = $resource instanceof Model
            ? $resource->getAttribute($latitudeColumn)
            : ($resource->{$latitudeColumn} ?? null);

        $longitude = $resource instanceof Model
            ? $resource->getAttribute($longitudeColumn)
            : ($resource->{$longitudeColumn} ?? null);

        if (! is_numeric($latitude) || ! is_numeric($longitude)) {
            return GeoJson::EMPTY;
        }

        $latitude = (float) $latitude;
        $longitude = (float) $longitude;

        if (abs($latitude) > 90 || abs($longitude) > 180) {
            return GeoJson::EMPTY;
        }

        return GeoJson::point($latitude, $longitude);
    }
}
