<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Enums;

/**
 * The built-in tile providers.
 *
 * Definitions live here rather than in JavaScript so a field can serialize
 * exactly the layers it offers, and so an application can reorder or drop
 * providers from config without touching the bundle.
 */
enum Tile: string
{
    case OpenStreetMap = 'osm';

    case CartoLight = 'carto-light';

    case CartoDark = 'carto-dark';

    case CartoVoyager = 'carto-voyager';

    case Satellite = 'satellite';

    case Topo = 'topo';

    case Google = 'google';

    case Mapbox = 'mapbox';

    case MapTiler = 'maptiler';

    case StadiaDark = 'stadia-dark';

    public function label(): string
    {
        return match ($this) {
            self::OpenStreetMap => 'OpenStreetMap',
            self::CartoLight => 'Light',
            self::CartoDark => 'Dark',
            self::CartoVoyager => 'Voyager',
            self::Satellite => 'Satellite',
            self::Topo => 'Topographic',
            self::Google => 'Google',
            self::Mapbox => 'Mapbox',
            self::MapTiler => 'MapTiler',
            self::StadiaDark => 'Stadia Dark',
        };
    }

    /**
     * Whether this provider is a dark-styled basemap.
     */
    public function isDark(): bool
    {
        return in_array($this, [self::CartoDark, self::StadiaDark], true);
    }

    /**
     * Providers rendered by a third-party SDK rather than by a plain XYZ
     * tile layer. These need their own loader in the browser.
     */
    public function isMutant(): bool
    {
        return $this === self::Google;
    }

    public function url(): ?string
    {
        return match ($this) {
            self::OpenStreetMap => 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            self::CartoLight => 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            self::CartoDark => 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            self::CartoVoyager => 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            self::Satellite => 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            self::Topo => 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            self::StadiaDark => 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
            // Keyed and SDK-driven providers get their URL assembled at
            // serialization time, once the key is known.
            self::Google, self::Mapbox, self::MapTiler => null,
        };
    }

    public function attribution(): string
    {
        return match ($this) {
            self::OpenStreetMap => '&copy; <a target="_blank" rel="noopener" href="https://osm.org/copyright">OpenStreetMap</a> contributors',
            self::CartoLight, self::CartoDark, self::CartoVoyager => '&copy; <a target="_blank" rel="noopener" href="https://osm.org/copyright">OpenStreetMap</a> contributors &copy; <a target="_blank" rel="noopener" href="https://carto.com/attributions">CARTO</a>',
            self::Satellite => 'Tiles &copy; Esri',
            self::Topo => '&copy; <a target="_blank" rel="noopener" href="https://opentopomap.org">OpenTopoMap</a>',
            self::Google => '&copy; Google',
            self::Mapbox => '&copy; <a target="_blank" rel="noopener" href="https://www.mapbox.com/about/maps/">Mapbox</a>',
            self::MapTiler => '&copy; <a target="_blank" rel="noopener" href="https://www.maptiler.com/copyright/">MapTiler</a>',
            self::StadiaDark => '&copy; <a target="_blank" rel="noopener" href="https://stadiamaps.com/">Stadia Maps</a>',
        };
    }

    public function maxZoom(): int
    {
        return match ($this) {
            self::Topo => 17,
            self::Satellite => 19,
            default => 20,
        };
    }
}
