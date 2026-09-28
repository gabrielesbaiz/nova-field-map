<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Geocoders;

use Gabrielesbaiz\NovaFieldMap\Contracts\Geocoder;
use Illuminate\Support\Facades\Cache;

/**
 * Caches lookups around any other driver.
 *
 * Addresses do not move, and the free providers ask not to be hammered, so
 * repeat queries are answered from the cache rather than the network.
 */
final class CachedGeocoder implements Geocoder
{
    public function __construct(
        private readonly Geocoder $geocoder,
        private readonly int $ttl,
    ) {}

    public function search(string $query, int $limit = 5): array
    {
        return Cache::remember(
            $this->key('search', $query.'|'.$limit),
            $this->ttl,
            fn (): array => $this->geocoder->search($query, $limit),
        );
    }

    public function reverse(float $latitude, float $longitude): array
    {
        // Rounded to roughly a metre: finer precision would make every pixel
        // of a marker drag its own cache entry.
        $key = round($latitude, 5).'|'.round($longitude, 5);

        return Cache::remember(
            $this->key('reverse', $key),
            $this->ttl,
            fn (): array => $this->geocoder->reverse($latitude, $longitude),
        );
    }

    private function key(string $operation, string $subject): string
    {
        return 'nova-field-map:geocode:'.$operation.':'.sha1($subject);
    }
}
