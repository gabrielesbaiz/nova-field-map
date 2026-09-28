<?php

declare(strict_types=1);

use Gabrielesbaiz\NovaFieldMap\Contracts\GeometryResolver;
use Gabrielesbaiz\NovaFieldMap\Resolvers\ResolverRegistry;
use Gabrielesbaiz\NovaFieldMap\Support\GeoJson;

it('detects a geojson string', function (): void {
    $collection = ResolverRegistry::resolve('{"type":"Point","coordinates":[13.7768,45.6495]}');

    expect(GeoJson::firstCoordinate($collection))->toBe([45.6495, 13.7768]);
});

it('detects a comma separated coordinate string', function (): void {
    expect(GeoJson::firstCoordinate(ResolverRegistry::resolve('45.6495,13.7768')))
        ->toBe([45.6495, 13.7768]);
});

it('detects a space separated coordinate string', function (): void {
    expect(GeoJson::firstCoordinate(ResolverRegistry::resolve('45.6495 13.7768')))
        ->toBe([45.6495, 13.7768]);
});

it('declines a coordinate string that is out of range', function (): void {
    // 145 is not a latitude, so this is some other kind of pair and must not
    // be silently plotted at the wrong place.
    expect(ResolverRegistry::resolve('145.0,13.7'))->toBe(GeoJson::EMPTY);
});

it('detects a positional array as latitude first', function (): void {
    expect(GeoJson::firstCoordinate(ResolverRegistry::resolve([45.6495, 13.7768])))
        ->toBe([45.6495, 13.7768]);
});

it('detects keyed arrays in every common spelling', function (array $value): void {
    expect(GeoJson::firstCoordinate(ResolverRegistry::resolve($value)))
        ->toBe([45.6495, 13.7768]);
})->with([
    'short' => [['lat' => 45.6495, 'lng' => 13.7768]],
    'long' => [['latitude' => 45.6495, 'longitude' => 13.7768]],
    'lon' => [['lat' => 45.6495, 'lon' => 13.7768]],
    'cased' => [['Lat' => 45.6495, 'Lng' => 13.7768]],
]);

it('detects a spatial object exposing latitude and longitude', function (): void {
    $point = new class
    {
        public float $latitude = 45.6495;

        public float $longitude = 13.7768;
    };

    expect(GeoJson::firstCoordinate(ResolverRegistry::resolve($point)))
        ->toBe([45.6495, 13.7768]);
});

it('detects a spatial object exposing toGeoJson', function (): void {
    $point = new class
    {
        public function toGeoJson(): string
        {
            return '{"type":"Point","coordinates":[13.7768,45.6495]}';
        }
    };

    expect(GeoJson::firstCoordinate(ResolverRegistry::resolve($point)))
        ->toBe([45.6495, 13.7768]);
});

it('returns an empty collection for values it cannot read', function (mixed $value): void {
    expect(ResolverRegistry::resolve($value))->toBe(GeoJson::EMPTY);
})->with([
    'null' => [null],
    'empty string' => [''],
    'prose' => ['somewhere near the coast'],
    'number' => [42],
]);

it('prefers a custom resolver over the built in chain', function (): void {
    ResolverRegistry::register(new class implements GeometryResolver
    {
        public function supports(mixed $value): bool
        {
            return $value === 'home';
        }

        public function toGeoJson(mixed $value): array
        {
            return GeoJson::point(45.6495, 13.7768);
        }
    });

    expect(GeoJson::firstCoordinate(ResolverRegistry::resolve('home')))
        ->toBe([45.6495, 13.7768]);
});
