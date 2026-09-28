<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Geocoders;

use Gabrielesbaiz\NovaFieldMap\Contracts\Geocoder;

/**
 * Used when a driver is configured but its key is missing, so the search box
 * returns nothing instead of erroring on every keystroke.
 */
final class NullGeocoder implements Geocoder
{
    public function search(string $query, int $limit = 5): array
    {
        return [];
    }

    public function reverse(float $latitude, float $longitude): array
    {
        return [];
    }
}
