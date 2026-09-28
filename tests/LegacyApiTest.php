<?php

declare(strict_types=1);

use Gabrielesbaiz\NovaFieldMap\FieldMap;
use Gabrielesbaiz\NovaFieldMap\FieldMapServiceProvider;
use Gabrielesbaiz\NovaFieldMap\NovaFieldMap;
use Gabrielesbaiz\NovaFieldMap\NovaFieldMapServiceProvider;
use Gabrielesbaiz\NovaFieldMap\Tests\Fixtures\Place;

/**
 * A 2.x resource must keep working untouched after the upgrade. Each test
 * here is a chain copied from the 2.x README.
 */
it('keeps the old class name working', function (): void {
    expect(new NovaFieldMap('Location'))->toBeInstanceOf(FieldMap::class);
});

it('keeps the old provider name working', function (): void {
    expect(is_subclass_of(NovaFieldMapServiceProvider::class, FieldMapServiceProvider::class))
        ->toBeTrue();
});

it('renders a legacy LatLon chain', function (): void {
    $field = NovaFieldMap::make('Location')
        ->type('LatLon')
        ->point(45.6495, 13.7768)
        ->height('400px');

    $field->resolve(new Place);

    expect($field->meta()['latitude'])->toBe(45.6495)
        ->and($field->meta()['longitude'])->toBe(13.7768)
        ->and($field->meta()['height'])->toBe('400px');
});

it('treats a legacy LatLon popup as literal text', function (): void {
    // Under type('LatLon') the argument to popup() was the popup's text, not
    // the name of a property. Under type('GeoJson') it named a property.
    $field = NovaFieldMap::make('Location')
        ->type('LatLon')
        ->point(45.6495, 13.7768)
        ->popup('I am a Popup');

    $field->resolve(new Place);

    expect($field->meta()['geojson']['features'][0]['properties']['__popup']['content'])
        ->toBe('I am a Popup');
});

it('treats a legacy GeoJson popup as a property name', function (): void {
    $field = NovaFieldMap::make('Area')
        ->type('GeoJson')
        ->geoJson(json_encode([
            'type' => 'Feature',
            'geometry' => ['type' => 'Point', 'coordinates' => [13.7768, 45.6495]],
            'properties' => ['popup' => 'Warehouse'],
        ]))
        ->popup('popup');

    $field->resolve(new Place);

    expect($field->meta()['geojson']['features'][0]['properties']['__popup']['content'])
        ->toBe('Warehouse');
});

it('escapes a legacy popup that carries markup', function (): void {
    $field = NovaFieldMap::make('Location')
        ->type('LatLon')
        ->point(45.6495, 13.7768)
        ->popup('<img src=x onerror=alert(1)>');

    $field->resolve(new Place);

    expect($field->meta()['geojson']['features'][0]['properties']['__popup']['content'])
        ->not->toContain('<img');
});

it('survives a legacy point with missing coordinates', function (): void {
    // A record whose columns are still null was a fatal blank map in 2.x.
    $field = NovaFieldMap::make('Location')->type('LatLon')->point(null, null);
    $field->resolve(new Place);

    expect($field->meta()['featureCount'])->toBe(0);
});

it('keeps the legacy marker icon chain working', function (): void {
    $field = NovaFieldMap::make('Location')
        ->markerIcon('/images/marker-icon.png', [100, 100], [50, 50]);

    $field->resolve(new Place);

    expect($field->meta()['markerIcon'])->toBe('/images/marker-icon.png')
        ->and($field->meta()['markerIconSize'])->toBe([100, 100])
        ->and($field->meta()['markerIconAnchor'])->toBe([50, 50]);
});

it('keeps the legacy google chain working', function (): void {
    $field = NovaFieldMap::make('Location')
        ->googleApiKey('legacy-key')
        ->googleMapType('satellite');

    $field->resolve(new Place);

    expect($field->meta()['googleApiKey'])->toBe('legacy-key')
        ->and($field->meta()['googleMapType'])->toBe('satellite');
});

it('fails loudly on methods that 3.0 removed', function (string $method): void {
    // Silently ignoring a removed call would leave a resource looking
    // configured while doing nothing.
    NovaFieldMap::make('Location')->{$method}();
})->with(['exportImage', 'minimap', 'measure', 'popupActions'])
    ->throws(BadMethodCallException::class);
