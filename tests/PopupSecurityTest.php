<?php

declare(strict_types=1);

use Gabrielesbaiz\NovaFieldMap\FieldMap;
use Gabrielesbaiz\NovaFieldMap\Tests\Fixtures\Place;
use Illuminate\Support\HtmlString;

/**
 * Leaflet's bindPopup() renders a string as raw HTML. 2.x handed it the value
 * of a feature property untouched, so anyone able to write that column could
 * run script in an authenticated admin's session.
 */
function placeWithPopup(string $popup): Place
{
    return new Place(['coordinates' => json_encode([
        'type' => 'Feature',
        'geometry' => ['type' => 'Point', 'coordinates' => [13.7768, 45.6495]],
        'properties' => ['description' => $popup],
    ])]);
}

it('escapes popup content by default', function (): void {
    $field = FieldMap::make('Location', 'coordinates')->popup('description');
    $field->resolve(placeWithPopup('<img src=x onerror=alert(1)>'));

    $popup = $field->meta()['geojson']['features'][0]['properties']['__popup'];

    expect($popup['html'])->toBeFalse()
        ->and($popup['content'])->not->toContain('<img')
        ->and($popup['content'])->toContain('&lt;img');
});

it('marks content as html only when explicitly allowed', function (): void {
    $field = FieldMap::make('Location', 'coordinates')
        ->popup('description')
        ->allowHtmlPopups();
    $field->resolve(placeWithPopup('<b>Warehouse</b>'));

    $popup = $field->meta()['geojson']['features'][0]['properties']['__popup'];

    expect($popup['html'])->toBeTrue()
        ->and($popup['content'])->toBe('<b>Warehouse</b>');
});

it('tells the browser to sanitize allowed html', function (): void {
    $field = FieldMap::make('Location', 'coordinates')->allowHtmlPopups();
    $field->resolve(placeWithPopup('x'));

    expect($field->meta()['sanitizePopups'])->toBeTrue();
});

it('escapes callback output that is a plain string', function (): void {
    $field = FieldMap::make('Location', 'coordinates')
        ->popupUsing(fn (array $feature): string => $feature['properties']['description']);
    $field->resolve(placeWithPopup('<script>alert(1)</script>'));

    $popup = $field->meta()['geojson']['features'][0]['properties']['__popup'];

    expect($popup['html'])->toBeFalse()
        ->and($popup['content'])->not->toContain('<script>');
});

it('trusts callback output that the application marked as html', function (): void {
    // A view or an HtmlString was authored server-side, so it is markup the
    // developer wrote rather than data a user supplied.
    $field = FieldMap::make('Location', 'coordinates')
        ->popupUsing(fn (): HtmlString => new HtmlString('<b>Trusted</b>'));
    $field->resolve(placeWithPopup('ignored'));

    $popup = $field->meta()['geojson']['features'][0]['properties']['__popup'];

    expect($popup['html'])->toBeTrue()
        ->and($popup['content'])->toBe('<b>Trusted</b>');
});

it('always escapes tooltips', function (): void {
    $field = FieldMap::make('Location', 'coordinates')
        ->tooltip('description')
        ->allowHtmlPopups();
    $field->resolve(placeWithPopup('<img src=x onerror=alert(1)>'));

    expect($field->meta()['geojson']['features'][0]['properties']['__tooltip'])
        ->not->toContain('<img');
});

it('does not expose a google key that was never configured', function (): void {
    $field = FieldMap::make('Location');
    $field->resolve(new Place);

    expect($field->meta()['googleApiKey'])->toBeNull();
});
