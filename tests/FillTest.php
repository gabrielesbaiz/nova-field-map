<?php

declare(strict_types=1);

use Gabrielesbaiz\NovaFieldMap\FieldMap;
use Gabrielesbaiz\NovaFieldMap\Tests\Fixtures\Place;
use Laravel\Nova\Http\Requests\NovaRequest;

function fill(FieldMap $field, mixed $submitted, ?Place $model = null): Place
{
    $model ??= new Place;

    $request = NovaRequest::create('/', 'POST', ['location' => $submitted]);

    $field->fill($request, $model);

    return $model;
}

it('stores submitted geometry as geojson by default', function (): void {
    $field = FieldMap::make('Location', 'location')->editable();
    $model = fill($field, json_encode(['type' => 'Point', 'coordinates' => [13.7768, 45.6495]]));

    expect(json_decode($model->location, true)['features'][0]['geometry']['coordinates'])
        ->toBe([13.7768, 45.6495]);
});

it('stores submitted geometry as a lat lng string on request', function (): void {
    $field = FieldMap::make('Location', 'location')->editable()->storeAsLatLngString();
    $model = fill($field, json_encode(['type' => 'Point', 'coordinates' => [13.7768, 45.6495]]));

    expect($model->location)->toBe('45.6495,13.7768');
});

it('stores submitted geometry across a column pair', function (): void {
    $field = FieldMap::make('Location', 'location')
        ->coordinates('lat', 'lng')
        ->editable()
        ->storeAsColumns();

    $model = fill($field, json_encode(['type' => 'Point', 'coordinates' => [13.7768, 45.6495]]));

    expect($model->lat)->toBe(45.6495)
        ->and($model->lng)->toBe(13.7768);
});

it('writes nothing when the field only syncs other fields', function (): void {
    // syncTo() leaves the columns to the two number fields that own them.
    $field = FieldMap::make('Location', 'location')->syncTo('lat', 'lng');
    $model = fill($field, json_encode(['type' => 'Point', 'coordinates' => [13.7768, 45.6495]]));

    expect($model->getAttributes())->toBe([]);
});

it('clears the attribute when the map is emptied', function (): void {
    $field = FieldMap::make('Location', 'location')->editable();
    $model = fill($field, '', new Place(['location' => 'previous']));

    expect($model->location)->toBeNull();
});

it('ignores submissions to a field that is not editable', function (): void {
    // A read-only field must not become writable just because a request
    // happens to carry its attribute.
    $field = FieldMap::make('Location', 'location');
    $model = fill($field, json_encode(['type' => 'Point', 'coordinates' => [13.7768, 45.6495]]));

    expect($model->getAttributes())->toBe([]);
});

it('ignores geometry that is not parseable', function (): void {
    $field = FieldMap::make('Location', 'location')->editable();
    $model = fill($field, 'garbage');

    expect($model->location)->toBeNull();
});
