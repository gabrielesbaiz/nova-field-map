<?php

declare(strict_types=1);

use Gabrielesbaiz\NovaFieldMap\Filters\MapBoundsFilter;
use Gabrielesbaiz\NovaFieldMap\Tests\Fixtures\Place;
use Laravel\Nova\Http\Requests\NovaRequest;

function applyBounds(mixed $value): string
{
    $query = Place::query();

    (new MapBoundsFilter('lat', 'lng'))->apply(
        NovaRequest::create('/'),
        $query,
        $value,
    );

    return $query->toRawSql();
}

it('constrains both axes to the drawn box', function (): void {
    $sql = applyBounds('40,10,47,15');

    expect($sql)->toContain('"lat" between 40 and 47')
        ->and($sql)->toContain('"lng" between 10 and 15');
});

it('normalizes a box drawn bottom to top', function (): void {
    expect(applyBounds('47,10,40,15'))->toContain('"lat" between 40 and 47');
});

it('splits a box that crosses the antimeridian', function (): void {
    // West of east is impossible unless the box wraps, in which case a single
    // between() would select the entire rest of the world instead.
    $sql = applyBounds('40,170,47,-170');

    expect($sql)->toContain('between 170 and 180')
        ->and($sql)->toContain('between -180 and -170');
});

it('ignores a value it cannot parse', function (mixed $value): void {
    expect(applyBounds($value))->not->toContain('between');
})->with([
    'empty' => [''],
    'null' => [null],
    'too few parts' => ['40,10,47'],
    'not numeric' => ['40,10,47,north'],
    'out of range' => ['40,10,120,15'],
]);
