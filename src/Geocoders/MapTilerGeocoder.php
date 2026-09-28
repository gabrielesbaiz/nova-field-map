<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Geocoders;

use Gabrielesbaiz\NovaFieldMap\Contracts\Geocoder;
use Illuminate\Support\Facades\Http;
use Throwable;

final class MapTilerGeocoder implements Geocoder
{
    public function __construct(private readonly string $key) {}

    public function search(string $query, int $limit = 5): array
    {
        return array_values(array_map(fn (array $feature): array => [
            'label' => $this->text($feature, 'place_name'),
            'latitude' => $this->center($feature)[0],
            'longitude' => $this->center($feature)[1],
            'components' => $this->components($feature),
        ], $this->get($query, ['limit' => $limit])));
    }

    public function reverse(float $latitude, float $longitude): array
    {
        $features = $this->get($longitude.','.$latitude, ['limit' => 1]);

        return $features === [] ? [] : $this->components($features[0]);
    }

    /**
     * @param  array<string, mixed>  $parameters
     * @return array<int, array<array-key, mixed>>
     */
    private function get(string $subject, array $parameters): array
    {
        try {
            $response = Http::timeout(8)->get(
                'https://api.maptiler.com/geocoding/'.rawurlencode($subject).'.json',
                $parameters + ['key' => $this->key],
            );

            $features = $response->successful() ? $response->json('features', []) : [];

            return is_array($features)
                ? array_values(array_filter($features, 'is_array'))
                : [];
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @param  array<array-key, mixed>  $feature
     * @return array<string, string>
     */
    private function components(array $feature): array
    {
        $components = ['label' => $this->text($feature, 'place_name')];

        $context = $feature['context'] ?? [];

        foreach (is_array($context) ? $context : [] as $entry) {
            if (! is_array($entry)) {
                continue;
            }

            $id = $this->text($entry, 'id');
            $text = $this->text($entry, 'text');

            match (true) {
                str_starts_with($id, 'postal_code') => $components['postcode'] = $text,
                str_starts_with($id, 'municipality'), str_starts_with($id, 'place') => $components['city'] = $text,
                str_starts_with($id, 'region') => $components['state'] = $text,
                str_starts_with($id, 'country') => $components['country'] = $text,
                default => null,
            };
        }

        return array_filter($components, static fn (string $value): bool => $value !== '');
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
     * A GeoJSON centre, read as [latitude, longitude].
     *
     * @param  array<array-key, mixed>  $feature
     * @return array{0: float, 1: float}
     */
    private function center(array $feature): array
    {
        $center = $feature['center'] ?? null;

        // GeoJSON positions are longitude first.
        return is_array($center) && is_numeric($center[0] ?? null) && is_numeric($center[1] ?? null)
            ? [(float) $center[1], (float) $center[0]]
            : [0.0, 0.0];
    }
}
