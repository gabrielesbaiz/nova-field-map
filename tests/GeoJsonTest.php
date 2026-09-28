<?php

declare(strict_types=1);

use Gabrielesbaiz\NovaFieldMap\Support\GeoJson;

it('wraps a bare geometry into a feature collection', function (): void {
    $collection = GeoJson::collect(['type' => 'Point', 'coordinates' => [13.7768, 45.6495]]);

    expect($collection['type'])->toBe('FeatureCollection')
        ->and($collection['features'])->toHaveCount(1)
        ->and($collection['features'][0]['geometry']['coordinates'])->toBe([13.7768, 45.6495]);
});

it('returns an empty collection for unparseable strings', function (): void {
    // 2.x pushed the raw string through to Leaflet, which then rendered
    // nothing and logged no error.
    expect(GeoJson::collect('not json at all'))->toBe(GeoJson::EMPTY)
        ->and(GeoJson::collect(null))->toBe(GeoJson::EMPTY)
        ->and(GeoJson::collect(''))->toBe(GeoJson::EMPTY);
});

it('drops features that carry no geometry', function (): void {
    $collection = GeoJson::collect([
        'type' => 'FeatureCollection',
        'features' => [
            ['type' => 'Feature', 'properties' => ['name' => 'orphan']],
            ['type' => 'Feature', 'geometry' => ['type' => 'Point', 'coordinates' => [1, 2]]],
        ],
    ]);

    expect($collection['features'])->toHaveCount(1);
});

it('builds a point with longitude first', function (): void {
    $collection = GeoJson::point(45.6495, 13.7768);

    expect($collection['features'][0]['geometry']['coordinates'])->toBe([13.7768, 45.6495]);
});

it('rejects out of range coordinates', function (): void {
    GeoJson::point(91.0, 0.0);
})->throws(InvalidArgumentException::class, 'Latitude must be between -90 and 90');

it('returns null bounds for an empty collection', function (): void {
    // Leaflet throws "Bounds are not valid" when asked to fit an empty
    // layer, which is what 2.x did on any record without geometry.
    expect(GeoJson::bounds(GeoJson::EMPTY))->toBeNull();
});

it('computes bounds across mixed geometry types', function (): void {
    $collection = GeoJson::collect([
        ['type' => 'Point', 'coordinates' => [10.0, 40.0]],
        ['type' => 'Polygon', 'coordinates' => [[[12.0, 44.0], [14.0, 44.0], [14.0, 46.0], [12.0, 44.0]]]],
    ]);

    expect(GeoJson::bounds($collection))->toBe([[40.0, 10.0], [46.0, 14.0]]);
});

it('reads the first coordinate as latitude and longitude', function (): void {
    $collection = GeoJson::collect(['type' => 'Point', 'coordinates' => [13.7768, 45.6495]]);

    expect(GeoJson::firstCoordinate($collection))->toBe([45.6495, 13.7768]);
});

it('flattens geometry collections when computing bounds', function (): void {
    $collection = GeoJson::collect([
        'type' => 'GeometryCollection',
        'geometries' => [
            ['type' => 'Point', 'coordinates' => [1.0, 2.0]],
            ['type' => 'Point', 'coordinates' => [3.0, 4.0]],
        ],
    ]);

    expect(GeoJson::bounds($collection))->toBe([[2.0, 1.0], [4.0, 3.0]]);
});
