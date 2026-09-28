<?php

declare(strict_types=1);

use Gabrielesbaiz\NovaFieldMap\Rules\WithinGeofence;
use Illuminate\Support\Facades\Validator;

function square(float $west, float $south, float $east, float $north): array
{
    return [
        'type' => 'Polygon',
        'coordinates' => [[
            [$west, $south], [$east, $south], [$east, $north], [$west, $north], [$west, $south],
        ]],
    ];
}

function validateAgainst(mixed $fence, mixed $value): bool
{
    return Validator::make(
        ['location' => $value],
        ['location' => [new WithinGeofence($fence)]],
    )->passes();
}

it('accepts a point inside the fence', function (): void {
    expect(validateAgainst(square(10, 40, 15, 47), '45.0,13.0'))->toBeTrue();
});

it('rejects a point outside the fence', function (): void {
    expect(validateAgainst(square(10, 40, 15, 47), '20.0,13.0'))->toBeFalse();
});

it('rejects a point inside a hole', function (): void {
    $donut = [
        'type' => 'Polygon',
        'coordinates' => [
            [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
            [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
        ],
    ];

    expect(validateAgainst($donut, '5.0,5.0'))->toBeFalse()
        ->and(validateAgainst($donut, '2.0,2.0'))->toBeTrue();
});

it('accepts a point in any part of a multipolygon', function (): void {
    $fence = [
        'type' => 'MultiPolygon',
        'coordinates' => [
            [[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]]],
            [[[20, 20], [25, 20], [25, 25], [20, 25], [20, 20]]],
        ],
    ];

    expect(validateAgainst($fence, '22.0,22.0'))->toBeTrue()
        ->and(validateAgainst($fence, '12.0,12.0'))->toBeFalse();
});

it('rejects when any part of the geometry escapes the fence', function (): void {
    $line = [
        'type' => 'LineString',
        'coordinates' => [[11.0, 41.0], [30.0, 41.0]],
    ];

    expect(validateAgainst(square(10, 40, 15, 47), $line))->toBeFalse();
});

it('passes an empty submission through to the required rule', function (): void {
    // Emptiness is "required"'s business; this rule only judges placement.
    expect(validateAgainst(square(10, 40, 15, 47), null))->toBeTrue();
});

it('does not reject everything when the fence is unusable', function (): void {
    expect(validateAgainst('not a polygon', '45.0,13.0'))->toBeTrue();
});
