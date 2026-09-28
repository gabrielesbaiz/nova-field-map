<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Contracts;

/**
 * Forward and reverse geocoding, used by the form field's search box and by
 * fillsAddress().
 */
interface Geocoder
{
    /**
     * @return array<int, array{label: string, latitude: float, longitude: float, components: array<string, string>}>
     */
    public function search(string $query, int $limit = 5): array;

    /**
     * Resolve a point to its address components.
     *
     * Keys are normalized across drivers: street, house_number, city,
     * postcode, state, country, country_code, label.
     *
     * @return array<string, string>
     */
    public function reverse(float $latitude, float $longitude): array;
}
