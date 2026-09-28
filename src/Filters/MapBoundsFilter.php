<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Filters;

use Gabrielesbaiz\NovaFieldMap\Support\Config;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Laravel\Nova\Filters\Filter;
use Laravel\Nova\Http\Requests\NovaRequest;

/**
 * Filters an index by a box drawn on a small map.
 *
 * The filter value is the bounding box as "south,west,north,east", which
 * survives Nova's query-string round trip and is cheap to constrain on.
 * Only column-pair storage can be filtered in SQL; a GeoJSON column would
 * need a spatial index this package cannot assume exists.
 */
class MapBoundsFilter extends Filter
{
    public $component = 'nova-field-map-bounds-filter';

    public function __construct(
        protected string $latitudeColumn = 'latitude',
        protected string $longitudeColumn = 'longitude',
    ) {}

    public function name(): string
    {
        return __('Locations');
    }

    public function key(): string
    {
        return 'nova-field-map-bounds-'.$this->latitudeColumn.'-'.$this->longitudeColumn;
    }

    public function apply(NovaRequest $request, Builder $query, mixed $value)
    {
        $box = $this->parse($value);

        if ($box === null) {
            return $query;
        }

        [$south, $west, $north, $east] = $box;

        $query->whereBetween($this->latitudeColumn, [$south, $north]);

        // A box dragged across the antimeridian has its west edge east of its
        // east edge, so the longitude test becomes a union of two ranges.
        return $west <= $east
            ? $query->whereBetween($this->longitudeColumn, [$west, $east])
            : $query->where(function (EloquentBuilder $query) use ($west, $east): void {
                $query->whereBetween($this->longitudeColumn, [$west, 180])
                    ->orWhereBetween($this->longitudeColumn, [-180, $east]);
            });
    }

    /**
     * @return array<string, mixed>
     */
    public function options(NovaRequest $request): array
    {
        return [];
    }

    /**
     * @return array<string, mixed>
     */
    public function meta(): array
    {
        return array_merge(parent::meta(), [
            'tiles' => Config::strings('tiles.providers'),
            'center' => [
                Config::float('center.latitude'),
                Config::float('center.longitude'),
            ],
            'zoom' => Config::int('zoom', 12),
        ]);
    }

    /**
     * @return array{0: float, 1: float, 2: float, 3: float}|null
     */
    protected function parse(mixed $value): ?array
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        $parts = array_map('trim', explode(',', $value));

        if (count($parts) !== 4) {
            return null;
        }

        foreach ($parts as $part) {
            if (! is_numeric($part)) {
                return null;
            }
        }

        [$south, $west, $north, $east] = array_map('floatval', $parts);

        return abs($south) > 90 || abs($north) > 90 || abs($west) > 180 || abs($east) > 180
            ? null
            : [min($south, $north), $west, max($south, $north), $east];
    }
}
