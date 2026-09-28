<?php

declare(strict_types=1);

use Gabrielesbaiz\NovaFieldMap\Enums\CoordinateFormat;
use Gabrielesbaiz\NovaFieldMap\Enums\Tile;
use Gabrielesbaiz\NovaFieldMap\FieldMap;
use Gabrielesbaiz\NovaFieldMap\Tests\Fixtures\Place;
use Gabrielesbaiz\NovaFieldMap\Tests\Fixtures\Stop;

function place(array $attributes = []): Place
{
    return new Place($attributes);
}

it('resolves geometry from its own attribute', function (): void {
    // This is the whole point of 3.0: no ->type(), no ->point(), just an
    // attribute on the model.
    $field = FieldMap::make('Location', 'coordinates');
    $field->resolve(place(['coordinates' => '45.6495,13.7768']));

    expect($field->meta()['latitude'])->toBe(45.6495)
        ->and($field->meta()['longitude'])->toBe(13.7768)
        ->and($field->meta()['featureCount'])->toBe(1);
});

it('resolves geometry from a column pair', function (): void {
    $field = FieldMap::make('Location')->coordinates('lat', 'lng');
    $field->resolve(place(['lat' => 45.6495, 'lng' => 13.7768]));

    expect($field->meta()['latitude'])->toBe(45.6495);
});

it('falls back to the configured center when a record has no geometry', function (): void {
    $field = FieldMap::make('Location', 'coordinates');
    $field->resolve(place(['coordinates' => null]));

    expect($field->meta()['featureCount'])->toBe(0)
        ->and($field->meta()['bounds'])->toBeNull()
        ->and($field->meta()['center'])->toBe([45.6495, 13.7768]);
});

it('plots a relation as one feature per record', function (): void {
    $parent = place(['id' => 1]);
    $parent->setRelation('stops', collect([
        new Stop(['id' => 7, 'coordinates' => '45.0,13.0', 'name' => 'First']),
        new Stop(['id' => 8, 'coordinates' => '46.0,14.0', 'name' => 'Second']),
    ]));

    $field = FieldMap::make('Stops', 'coordinates')->relation('stops');
    $field->resolve($parent);

    $features = $field->meta()['geojson']['features'];

    expect($features)->toHaveCount(2)
        // The record's own attributes travel with the feature so popups can
        // address them by column name.
        ->and($features[0]['properties']['name'])->toBe('First')
        ->and($features[0]['properties']['__key'])->toBe(7);
});

it('reports bounds that span every feature', function (): void {
    $field = FieldMap::make('Area', 'coordinates');
    $field->resolve(place(['coordinates' => json_encode([
        ['type' => 'Point', 'coordinates' => [10.0, 40.0]],
        ['type' => 'Point', 'coordinates' => [14.0, 46.0]],
    ])]));

    expect($field->meta()['bounds'])->toBe([[40.0, 10.0], [46.0, 14.0]]);
});

it('only offers tile providers that are usable', function (): void {
    // Google has no URL of its own and cannot render without a key, so it
    // must not appear in the switcher as a dead entry.
    $field = FieldMap::make('Location')->tiles(Tile::OpenStreetMap, Tile::Google);
    $field->resolve(place());

    expect(array_column($field->meta()['tiles'], 'key'))->toBe(['osm']);

    $withKey = FieldMap::make('Location')
        ->googleApiKey('test-key')
        ->tiles(Tile::OpenStreetMap, Tile::Google);
    $withKey->resolve(place());

    expect(array_column($withKey->meta()['tiles'], 'key'))->toBe(['osm', 'google']);
});

it('never leaves the map without a layer', function (): void {
    $field = FieldMap::make('Location')->tiles(Tile::Mapbox);
    $field->resolve(place());

    expect($field->meta()['tiles'])->toHaveCount(1)
        ->and($field->meta()['tiles'][0]['key'])->toBe('osm');
});

it('skips clustering for a handful of markers', function (): void {
    $field = FieldMap::make('Location', 'coordinates');
    $field->resolve(place(['coordinates' => '45.6495,13.7768']));

    expect($field->meta()['cluster'])->toBeFalse();
});

it('switches to canvas above the feature threshold', function (): void {
    config()->set('nova-field-map.canvas_threshold', 2);

    $field = FieldMap::make('Location', 'coordinates');
    $field->resolve(place(['coordinates' => json_encode([
        ['type' => 'Point', 'coordinates' => [1, 1]],
        ['type' => 'Point', 'coordinates' => [2, 2]],
        ['type' => 'Point', 'coordinates' => [3, 3]],
    ])]));

    expect($field->meta()['useCanvas'])->toBeTrue();
});

it('is hidden from forms until made editable', function (): void {
    $field = FieldMap::make('Location');

    expect($field->showOnUpdate)->toBeFalse()
        ->and($field->showOnCreation)->toBeFalse();

    $field->editable();

    expect($field->showOnUpdate)->toBeTrue()
        ->and($field->showOnCreation)->toBeTrue();
});

it('formats coordinates as degrees minutes seconds on request', function (): void {
    $field = FieldMap::make('Location', 'coordinates')
        ->coordinateFormat(CoordinateFormat::Dms);
    $field->resolve(place(['coordinates' => '45.6495,13.7768']));

    expect($field->meta()['formattedCoordinates'])->toBe('45°38\'58.2"N 13°46\'36.5"E');
});
