<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Concerns;

use Gabrielesbaiz\NovaFieldMap\Enums\GoogleMapType;
use Gabrielesbaiz\NovaFieldMap\Enums\Tile;
use Gabrielesbaiz\NovaFieldMap\Support\Config;

/**
 * Tile provider selection, including dark-mode handling.
 *
 * Providers are serialized fully — url, attribution, max zoom — so the
 * browser never has to carry a second copy of the catalogue and an
 * application can add its own through config without a rebuild.
 */
trait HasTiles
{
    /** @var array<int, Tile|string>|null */
    protected ?array $tiles = null;

    protected Tile|string|null $darkTile = null;

    protected bool $darkModeEnabled = true;

    protected ?string $googleApiKey = null;

    protected GoogleMapType|string|null $googleMapType = null;

    protected ?string $mapboxKey = null;

    protected ?string $maptilerKey = null;

    /**
     * Choose which layers appear in the switcher, in order.
     */
    public function tiles(Tile|string ...$tiles): static
    {
        $this->tiles = array_values($tiles);

        return $this;
    }

    /**
     * Pick the layer used when Nova is in dark mode.
     */
    public function darkTile(Tile|string $tile): static
    {
        $this->darkTile = $tile;

        return $this;
    }

    /**
     * Follow Nova's theme. Disabling keeps the chosen layer in both themes.
     */
    public function darkMode(bool $enabled = true): static
    {
        $this->darkModeEnabled = $enabled;

        return $this;
    }

    /**
     * Enable the Google basemap.
     *
     * The key reaches the browser, as any Maps JavaScript key must. Restrict
     * it by HTTP referrer. Omit the argument to use the configured key.
     */
    public function googleApiKey(?string $key = null): static
    {
        $this->googleApiKey = $key ?? Config::nullableString('google.key');

        return $this;
    }

    public function googleMapType(GoogleMapType|string $type): static
    {
        $this->googleMapType = $type;

        return $this;
    }

    public function mapboxKey(?string $key = null): static
    {
        $this->mapboxKey = $key ?? Config::nullableString('geocoder.mapbox_key');

        return $this;
    }

    public function maptilerKey(?string $key = null): static
    {
        $this->maptilerKey = $key ?? Config::nullableString('geocoder.maptiler_key');

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    protected function tileMeta(): array
    {
        $selected = $this->tiles ?? Config::strings('tiles.providers');

        $providers = [];

        foreach ($selected as $tile) {
            $definition = $this->tileDefinition($tile);

            if ($definition !== null) {
                $providers[] = $definition;
            }
        }

        // A map with no usable layer would render as a grey box, which reads
        // as a bug rather than as a misconfiguration.
        if ($providers === []) {
            $providers[] = $this->tileDefinition(Tile::OpenStreetMap);
        }

        $dark = $this->darkTile ?? Config::nullableString('tiles.dark') ?? Tile::CartoDark->value;

        return [
            'tiles' => $providers,
            'darkTile' => $this->darkModeEnabled ? $this->tileDefinition($dark) : null,
            'darkMode' => $this->darkModeEnabled,
            'googleApiKey' => $this->googleApiKey,
            'googleMapType' => $this->googleMapType instanceof GoogleMapType
                ? $this->googleMapType->value
                : ($this->googleMapType ?? Config::string('google.map_type', 'roadmap')),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function tileDefinition(Tile|string|null $tile): ?array
    {
        if ($tile === null) {
            return null;
        }

        if (is_string($tile)) {
            $custom = Config::array('tiles.custom.'.$tile);

            if ($custom !== []) {
                return [
                    'key' => $tile,
                    'label' => is_string($custom['label'] ?? null) ? $custom['label'] : $tile,
                    'url' => is_string($custom['url'] ?? null) ? $custom['url'] : null,
                    'attribution' => is_string($custom['attribution'] ?? null) ? $custom['attribution'] : '',
                    'maxZoom' => is_numeric($custom['max_zoom'] ?? null) ? (int) $custom['max_zoom'] : 20,
                    'dark' => (bool) ($custom['dark'] ?? false),
                    'mutant' => false,
                ];
            }

            $tile = Tile::tryFrom($tile);

            if ($tile === null) {
                return null;
            }
        }

        $url = match ($tile) {
            Tile::Mapbox => $this->mapboxKey === null
                ? null
                : 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token='.$this->mapboxKey,
            Tile::MapTiler => $this->maptilerKey === null
                ? null
                : 'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key='.$this->maptilerKey,
            default => $tile->url(),
        };

        // Google is drawn by its own SDK and legitimately has no URL; a keyed
        // provider without its key simply cannot be offered.
        if ($url === null && ! $tile->isMutant()) {
            return null;
        }

        if ($tile->isMutant() && $this->googleApiKey === null) {
            return null;
        }

        return [
            'key' => $tile->value,
            'label' => $tile->label(),
            'url' => $url,
            'attribution' => $tile->attribution(),
            'maxZoom' => $tile->maxZoom(),
            'dark' => $tile->isDark(),
            'mutant' => $tile->isMutant(),
        ];
    }
}
