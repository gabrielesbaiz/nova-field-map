<?php

declare(strict_types=1);

use Gabrielesbaiz\NovaFieldMap\Enums\Tile;

return [

    /*
    |--------------------------------------------------------------------------
    | Map Defaults
    |--------------------------------------------------------------------------
    |
    | These values are applied to every field that does not override them with
    | its own fluent call. The center and zoom are only used when a record has
    | no geometry at all, since anything else would leave an unusable map.
    |
    */

    'height' => '300px',

    'center' => [
        'latitude' => 45.6495,
        'longitude' => 13.7768,
    ],

    'zoom' => 12,

    /*
    |--------------------------------------------------------------------------
    | Tile Providers
    |--------------------------------------------------------------------------
    |
    | "providers" lists the layers offered in the layer switcher, in order. The
    | "dark" entry is swapped in automatically when Nova is in dark mode and
    | the field has not disabled that behaviour.
    |
    | Extra entries may be added under "custom" and referenced by their key.
    | Each needs a url template and an attribution string.
    |
    */

    'tiles' => [
        'providers' => [
            Tile::OpenStreetMap->value,
            Tile::CartoLight->value,
        ],

        'dark' => Tile::CartoDark->value,

        'custom' => [
            // 'company' => [
            //     'label' => 'Company Tiles',
            //     'url' => 'https://tiles.example.com/{z}/{x}/{y}.png',
            //     'attribution' => '&copy; Example',
            //     'dark' => false,
            // ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Clustering
    |--------------------------------------------------------------------------
    |
    | Marker clustering keeps dense datasets readable. Clustering is skipped
    | entirely below "min_features", where it only adds indirection.
    |
    */

    'cluster' => [
        'enabled' => true,
        'disable_at_zoom' => 11,
        'min_features' => 10,
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Guard
    |--------------------------------------------------------------------------
    |
    | Above this many features the field switches Leaflet to the canvas
    | renderer and binds a single shared popup instead of one per feature.
    |
    */

    'canvas_threshold' => 1000,

    /*
    |--------------------------------------------------------------------------
    | Popups
    |--------------------------------------------------------------------------
    |
    | Popup content is escaped by default. Fields may opt into raw HTML with
    | allowHtmlPopups(), in which case the browser still sanitizes it unless
    | "sanitize" is disabled here. Disabling sanitization allows any user who
    | can write the underlying column to run scripts in an admin's session.
    |
    */

    'popups' => [
        'sanitize' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Google Maps
    |--------------------------------------------------------------------------
    |
    | The API key is serialized into the field payload and is therefore
    | visible to every user who can view the resource. Use a browser key
    | restricted by HTTP referrer, never a server key.
    |
    */

    'google' => [
        'key' => env('NOVA_FIELD_MAP_GOOGLE_KEY'),
        'map_type' => 'roadmap',
    ],

    /*
    |--------------------------------------------------------------------------
    | Geocoding
    |--------------------------------------------------------------------------
    |
    | Used by the form field's search box and by fillsAddress(). Nominatim
    | requires no key but asks that you identify your application and stay
    | within its usage policy.
    |
    */

    'geocoder' => [
        'driver' => 'nominatim',
        'user_agent' => env('APP_NAME', 'Laravel').' (nova-field-map)',
        'mapbox_key' => env('NOVA_FIELD_MAP_MAPBOX_KEY'),
        'maptiler_key' => env('NOVA_FIELD_MAP_MAPTILER_KEY'),
        'cache_ttl' => 86400,
    ],

    /*
    |--------------------------------------------------------------------------
    | Static Snapshots
    |--------------------------------------------------------------------------
    |
    | snapshot() renders a static image instead of a live map, for index tables
    | and anywhere a Leaflet instance cannot run. The URL template receives
    | {lat}, {lng}, {zoom}, {width} and {height}.
    |
    */

    'snapshot' => [
        'url' => 'https://staticmap.openstreetmap.de/staticmap.php?center={lat},{lng}&zoom={zoom}&size={width}x{height}&markers={lat},{lng},red-pushpin',
        'width' => 160,
        'height' => 90,
        'zoom' => 12,
        'cache_ttl' => 86400,
    ],

];
