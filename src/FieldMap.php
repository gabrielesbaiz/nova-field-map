<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap;

use Gabrielesbaiz\NovaFieldMap\Concerns\HasControls;
use Gabrielesbaiz\NovaFieldMap\Concerns\HasMarkers;
use Gabrielesbaiz\NovaFieldMap\Concerns\HasTiles;
use Gabrielesbaiz\NovaFieldMap\Concerns\InteractsWithGeometry;
use Gabrielesbaiz\NovaFieldMap\Concerns\IsEditable;
use Gabrielesbaiz\NovaFieldMap\Concerns\RendersPopups;
use Gabrielesbaiz\NovaFieldMap\Concerns\SupportsLegacyApi;
use Gabrielesbaiz\NovaFieldMap\Support\Config;
use Gabrielesbaiz\NovaFieldMap\Support\Coordinates;
use Gabrielesbaiz\NovaFieldMap\Support\GeoJson;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Traits\Macroable;
use Laravel\Nova\Fields\Field;
use Laravel\Nova\Http\Requests\NovaRequest;
use Laravel\Nova\Nova;

/**
 * A Leaflet map field.
 *
 * Unlike 2.x this is an ordinary Nova field: it resolves its own attribute,
 * detects the shape of what it finds, and can fill it back. Everything else
 * is layered on through the concerns.
 */
class FieldMap extends Field
{
    use HasControls;
    use HasMarkers;
    use HasTiles;
    use InteractsWithGeometry;
    use IsEditable;
    use Macroable;
    use RendersPopups;
    use SupportsLegacyApi;

    public $component = 'nova-field-map';

    /** @var bool|(callable(NovaRequest, array<array-key, mixed>|object): bool) */
    public $showOnIndex = false;

    public $showOnUpdate = false;

    public $showOnCreation = false;

    protected bool $linkToResource = false;

    protected ?string $linkResourceName = null;

    protected bool $thumbnail = false;

    protected bool $snapshot = false;

    /**
     * Navigate to a record's detail page when its marker is clicked.
     *
     * Only useful with relation(), where each marker stands for a record.
     */
    public function linkToResource(?string $resource = null): static
    {
        $this->linkToResource = true;
        $this->linkResourceName = $resource;

        return $this;
    }

    /**
     * Show a live mini-map in the index column.
     *
     * Off by default: a fifty-row table would otherwise build fifty Leaflet
     * instances. Prefer snapshot() for wide tables.
     */
    public function thumbnail(bool $enabled = true): static
    {
        $this->thumbnail = $enabled;
        $this->showOnIndex = $enabled || $this->showOnIndex;

        return $this;
    }

    /**
     * Show a cached static image instead of a live map.
     */
    public function snapshot(bool $enabled = true): static
    {
        $this->snapshot = $enabled;
        $this->showOnIndex = $enabled || $this->showOnIndex;

        return $this;
    }

    /**
     * @param  Model|object|array<array-key, mixed>  $resource
     */
    public function resolve($resource, ?string $attribute = null): void
    {
        parent::resolve($resource, $attribute);

        $collection = $this->resolveGeometry($resource, $this->value);
        $collection = $this->applyLegacyPopup($collection);
        $collection = $this->preparePopups($collection);
        $collection = $this->prepareMarkers($collection);

        if ($this->linkToResource) {
            $collection = $this->attachResourceLinks($collection, $resource);
        }

        $this->withMeta($this->mapMeta($collection));

        // The raw column value is of no use to the component and may be a
        // large GeoJSON blob; the normalized collection replaces it.
        $this->value = $this->firstCoordinateString($collection);
    }

    protected function fillAttributeFromRequest(NovaRequest $request, string $requestAttribute, object $model, string $attribute): void
    {
        if (! $this->editable || ! $request->exists($requestAttribute)) {
            return;
        }

        $submitted = $request->input($requestAttribute);
        $collection = GeoJson::collect($submitted === '' ? null : $submitted);

        match ($this->storeAs) {
            // syncTo() leaves the columns to the two number fields that own
            // them, so the map writes nothing at all.
            'none' => null,
            'columns' => $this->fillColumns($model, $collection),
            'latlng' => $this->writeAttribute($model, $attribute, $this->latLngString($collection)),
            default => $this->writeAttribute(
                $model,
                $attribute,
                GeoJson::isEmpty($collection) ? null : json_encode($collection),
            ),
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return array_merge(parent::jsonSerialize(), [
            'assetBaseUrl' => URL::to('/nova-vendor/nova-field-map/asset'),
        ]);
    }

    /**
     * @param  array{type: string, features: array<int, array<array-key, mixed>>}  $collection
     * @return array<string, mixed>
     */
    protected function mapMeta(array $collection): array
    {
        $featureCount = GeoJson::countFeatures($collection);
        $coordinate = GeoJson::firstCoordinate($collection);

        return array_merge(
            $this->controlMeta(),
            $this->tileMeta(),
            $this->markerMeta($featureCount),
            $this->popupMeta(),
            $this->editableMeta(),
            [
                'geojson' => $collection,
                'featureCount' => $featureCount,
                'bounds' => GeoJson::bounds($collection),
                'latitude' => $coordinate[0] ?? null,
                'longitude' => $coordinate[1] ?? null,
                'formattedCoordinates' => $coordinate === null
                    ? null
                    : Coordinates::format($coordinate[0], $coordinate[1], $this->coordinateFormat),
                'linkToResource' => $this->linkToResource,
                'thumbnail' => $this->thumbnail,
                'snapshotUrl' => $this->snapshot && $coordinate !== null
                    ? $this->snapshotUrl($coordinate[0], $coordinate[1])
                    : null,
            ],
        );
    }

    /**
     * @param  array{type: string, features: array<int, array<array-key, mixed>>}  $collection
     * @return array{type: string, features: array<int, array<array-key, mixed>>}
     */
    protected function attachResourceLinks(array $collection, mixed $resource): array
    {
        $resourceName = $this->linkResourceName
            ?? ($resource instanceof Model ? $this->relationResourceName($resource) : null);

        if ($resourceName === null) {
            return $collection;
        }

        foreach ($collection['features'] as $index => $feature) {
            $properties = (array) ($feature['properties'] ?? []);
            $key = $properties['__key'] ?? null;

            if ($key === null) {
                continue;
            }

            $properties['__link'] = ['resource' => $resourceName, 'id' => $key];
            $collection['features'][$index]['properties'] = $properties;
        }

        return $collection;
    }

    protected function relationResourceName(Model $resource): ?string
    {
        $relation = $this->relationName;

        if ($relation === null || ! method_exists($resource, $relation)) {
            return null;
        }

        $related = $resource->{$relation}();

        if (! $related instanceof Relation) {
            return null;
        }

        $resourceClass = Nova::resourceForModel($related->getRelated());

        return $resourceClass === null ? null : $resourceClass::uriKey();
    }

    protected function snapshotUrl(float $latitude, float $longitude): string
    {
        return strtr(Config::string('snapshot.url'), [
            '{lat}' => (string) $latitude,
            '{lng}' => (string) $longitude,
            '{zoom}' => (string) Config::int('snapshot.zoom', 12),
            '{width}' => (string) Config::int('snapshot.width', 160),
            '{height}' => (string) Config::int('snapshot.height', 90),
        ]);
    }

    /**
     * @param  array{type: string, features: array<int, array<array-key, mixed>>}  $collection
     */
    protected function firstCoordinateString(array $collection): ?string
    {
        $coordinate = GeoJson::firstCoordinate($collection);

        return $coordinate === null
            ? null
            : $coordinate[0].','.$coordinate[1];
    }

    /**
     * @param  array{type: string, features: array<int, array<array-key, mixed>>}  $collection
     */
    protected function latLngString(array $collection): ?string
    {
        return $this->firstCoordinateString($collection);
    }

    /**
     * @param  array{type: string, features: array<int, array<array-key, mixed>>}  $collection
     */
    protected function fillColumns(object $model, array $collection): void
    {
        if ($this->latitudeColumn === null || $this->longitudeColumn === null) {
            return;
        }

        $coordinate = GeoJson::firstCoordinate($collection);
        $latitudeColumn = $this->latitudeColumn;
        $longitudeColumn = $this->longitudeColumn;

        $this->writeAttribute($model, $latitudeColumn, $coordinate[0] ?? null);
        $this->writeAttribute($model, $longitudeColumn, $coordinate[1] ?? null);
    }

    /**
     * Nova fills a Model on a resource form but a Fluent on an action, and
     * only the former has setAttribute().
     */
    protected function writeAttribute(object $model, string $attribute, mixed $value): void
    {
        if ($model instanceof Model) {
            $model->setAttribute($attribute, $value);

            return;
        }

        $model->{$attribute} = $value;
    }
}
