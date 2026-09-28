<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Geocoders;

use Gabrielesbaiz\NovaFieldMap\Contracts\Geocoder;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * OpenStreetMap's Nominatim.
 *
 * Needs no key, which makes it the sensible default, but its usage policy
 * requires an identifying User-Agent and discourages bulk traffic — hence
 * the caching in CachedGeocoder around it.
 */
final class NominatimGeocoder implements Geocoder
{
    public function __construct(private readonly string $userAgent) {}

    public function search(string $query, int $limit = 5): array
    {
        $response = $this->get('https://nominatim.openstreetmap.org/search', [
            'q' => $query,
            'format' => 'jsonv2',
            'addressdetails' => 1,
            'limit' => $limit,
        ]);

        $results = is_array($response) ? array_filter($response, 'is_array') : [];

        return array_values(array_map(fn (array $result): array => [
            'label' => $this->text($result, 'display_name'),
            'latitude' => $this->number($result, 'lat'),
            'longitude' => $this->number($result, 'lon'),
            'components' => $this->components($result),
        ], $results));
    }

    public function reverse(float $latitude, float $longitude): array
    {
        $response = $this->get('https://nominatim.openstreetmap.org/reverse', [
            'lat' => $latitude,
            'lon' => $longitude,
            'format' => 'jsonv2',
            'addressdetails' => 1,
        ]);

        return is_array($response) ? $this->components($response) : [];
    }

    /**
     * @param  array<string, mixed>  $parameters
     */
    private function get(string $url, array $parameters): mixed
    {
        try {
            $response = Http::withHeaders(['User-Agent' => $this->userAgent])
                ->timeout(8)
                ->get($url, $parameters);

            return $response->successful() ? $response->json() : null;
        } catch (Throwable) {
            // A geocoding outage should degrade the search box, not break
            // the form it sits on.
            return null;
        }
    }

    /**
     * @param  array<array-key, mixed>  $result
     * @return array<string, string>
     */
    private function components(array $result): array
    {
        $address = $result['address'] ?? [];
        $address = is_array($address) ? $address : [];

        $first = fn (string ...$keys): string => (string) (array_values(array_filter(
            array_map(fn (string $key): string => $this->text($address, $key), $keys),
            static fn (string $value): bool => $value !== '',
        ))[0] ?? '');

        return array_filter([
            'label' => $this->text($result, 'display_name'),
            'street' => $first('road', 'pedestrian'),
            'house_number' => $this->text($address, 'house_number'),
            // Nominatim varies the key by settlement size, so all of the
            // plausible spellings have to be tried.
            'city' => $first('city', 'town', 'village', 'municipality'),
            'postcode' => $this->text($address, 'postcode'),
            'state' => $this->text($address, 'state'),
            'country' => $this->text($address, 'country'),
            'country_code' => strtoupper($this->text($address, 'country_code')),
        ], static fn (string $value): bool => $value !== '');
    }

    /**
     * @param  array<array-key, mixed>  $source
     */
    private function text(array $source, string $key): string
    {
        $value = $source[$key] ?? null;

        return is_scalar($value) ? (string) $value : '';
    }

    /**
     * @param  array<array-key, mixed>  $source
     */
    private function number(array $source, string $key): float
    {
        $value = $source[$key] ?? null;

        return is_numeric($value) ? (float) $value : 0.0;
    }
}
