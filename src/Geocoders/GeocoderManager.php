<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Geocoders;

use Gabrielesbaiz\NovaFieldMap\Contracts\Geocoder;
use Gabrielesbaiz\NovaFieldMap\Support\Config;
use Illuminate\Contracts\Container\Container;

final class GeocoderManager
{
    public static function make(Container $app): Geocoder
    {
        $driver = match (Config::string('geocoder.driver', 'nominatim')) {
            'mapbox' => self::keyed(Config::nullableString('geocoder.mapbox_key'), MapboxGeocoder::class),
            'maptiler' => self::keyed(Config::nullableString('geocoder.maptiler_key'), MapTilerGeocoder::class),
            'null' => new NullGeocoder,
            default => new NominatimGeocoder(
                Config::string('geocoder.user_agent', 'nova-field-map'),
            ),
        };

        $ttl = Config::int('geocoder.cache_ttl');

        return $ttl > 0 ? new CachedGeocoder($driver, $ttl) : $driver;
    }

    /**
     * @param  class-string<Geocoder>  $class
     */
    private static function keyed(?string $key, string $class): Geocoder
    {
        return $key === null || $key === '' ? new NullGeocoder : new $class($key);
    }
}
