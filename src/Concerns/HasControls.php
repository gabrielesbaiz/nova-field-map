<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Concerns;

use Gabrielesbaiz\NovaFieldMap\Enums\CoordinateFormat;
use Gabrielesbaiz\NovaFieldMap\Support\Config;
use Gabrielesbaiz\NovaFieldMap\Support\GeoJson;

/**
 * Viewport, controls and the surrounding chrome.
 */
trait HasControls
{
    protected ?string $height = null;

    /** @var array{0: float, 1: float}|null */
    protected ?array $center = null;

    protected ?int $zoom = null;

    protected int $fitPadding = 24;

    protected ?int $fitMaxZoom = 16;

    /** @var array{0: array{0: float, 1: float}, 1: array{0: float, 1: float}}|null */
    protected ?array $maxBounds = null;

    protected bool $fullscreen = false;

    protected bool $scaleControl = false;

    protected bool $locateControl = false;

    protected bool $exportData = false;

    protected bool $legend = false;

    protected bool $accessibleTable = false;

    protected bool $copyable = true;

    protected bool $deeplinks = false;

    protected bool $scrollWheelZoom = true;

    protected ?string $filterProperty = null;

    protected ?string $timelineProperty = null;

    protected bool $route = false;

    protected bool $elevationProfile = false;

    protected CoordinateFormat $coordinateFormat = CoordinateFormat::Decimal;

    public function height(string $height): static
    {
        $this->height = $height;

        return $this;
    }

    /**
     * The view used when a record has no geometry at all.
     */
    public function center(float $latitude, float $longitude): static
    {
        GeoJson::assertValidCoordinates($latitude, $longitude);

        $this->center = [$latitude, $longitude];

        return $this;
    }

    public function zoom(int $zoom): static
    {
        $this->zoom = $zoom;

        return $this;
    }

    /**
     * Tune how the map frames its geometry.
     *
     * A max zoom matters for a single point, where fitting bounds exactly
     * would zoom to street level and lose all context.
     */
    public function fit(int $padding = 24, ?int $maxZoom = 16): static
    {
        $this->fitPadding = $padding;
        $this->fitMaxZoom = $maxZoom;

        return $this;
    }

    /**
     * Stop the map being panned outside the given box.
     */
    public function maxBounds(float $southLat, float $westLng, float $northLat, float $eastLng): static
    {
        $this->maxBounds = [[$southLat, $westLng], [$northLat, $eastLng]];

        return $this;
    }

    public function fullscreen(bool $enabled = true): static
    {
        $this->fullscreen = $enabled;

        return $this;
    }

    public function scaleControl(bool $enabled = true): static
    {
        $this->scaleControl = $enabled;

        return $this;
    }

    public function locateControl(bool $enabled = true): static
    {
        $this->locateControl = $enabled;

        return $this;
    }

    /**
     * Offer GeoJSON, GPX and KML downloads of the field's geometry.
     */
    public function exportData(bool $enabled = true): static
    {
        $this->exportData = $enabled;

        return $this;
    }

    public function legend(bool $enabled = true): static
    {
        $this->legend = $enabled;

        return $this;
    }

    /**
     * Render a visually hidden table of features and coordinates.
     *
     * A Leaflet map is opaque to a screen reader; this gives one an
     * equivalent, readable view of the same data.
     */
    public function accessibleTable(bool $enabled = true): static
    {
        $this->accessibleTable = $enabled;

        return $this;
    }

    public function copyable(bool $enabled = true): static
    {
        $this->copyable = $enabled;

        return $this;
    }

    /**
     * Show links that open the location in Google Maps, Apple Maps, OSM
     * and Waze.
     */
    public function deeplinks(bool $enabled = true): static
    {
        $this->deeplinks = $enabled;

        return $this;
    }

    /**
     * Scroll-wheel zoom is convenient on a dedicated map and hostile inside
     * a long form, where it hijacks page scrolling.
     */
    public function scrollWheelZoom(bool $enabled = true): static
    {
        $this->scrollWheelZoom = $enabled;

        return $this;
    }

    /**
     * Emit a layer checkbox per distinct value of the given property.
     */
    public function filterable(string $property): static
    {
        $this->filterProperty = $property;

        return $this;
    }

    /**
     * Add a time slider driven by a timestamp feature property.
     */
    public function timeline(string $property): static
    {
        $this->timelineProperty = $property;

        return $this;
    }

    /**
     * Join the points into a path with playback and a distance readout.
     */
    public function route(bool $enabled = true): static
    {
        $this->route = $enabled;

        return $this;
    }

    /**
     * Chart the Z coordinates of the geometry beneath the map.
     */
    public function elevationProfile(bool $enabled = true): static
    {
        $this->elevationProfile = $enabled;

        return $this;
    }

    public function coordinateFormat(CoordinateFormat $format): static
    {
        $this->coordinateFormat = $format;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    protected function controlMeta(): array
    {
        return [
            'height' => $this->height ?? Config::string('height', '300px'),
            'center' => $this->center ?? [
                Config::float('center.latitude'),
                Config::float('center.longitude'),
            ],
            'zoom' => $this->zoom ?? Config::int('zoom', 12),
            'fitPadding' => $this->fitPadding,
            'fitMaxZoom' => $this->fitMaxZoom,
            'maxBounds' => $this->maxBounds,
            'fullscreen' => $this->fullscreen,
            'scaleControl' => $this->scaleControl,
            'locateControl' => $this->locateControl,
            'exportData' => $this->exportData,
            'legend' => $this->legend,
            'accessibleTable' => $this->accessibleTable,
            'copyable' => $this->copyable,
            'deeplinks' => $this->deeplinks,
            'scrollWheelZoom' => $this->scrollWheelZoom,
            'filterProperty' => $this->filterProperty,
            'timelineProperty' => $this->timelineProperty,
            'route' => $this->route,
            'elevationProfile' => $this->elevationProfile,
            'coordinateFormat' => $this->coordinateFormat->value,
        ];
    }
}
