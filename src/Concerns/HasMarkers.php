<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Concerns;

use Closure;
use Gabrielesbaiz\NovaFieldMap\Support\Config;

/**
 * Marker appearance, clustering and the heat/choropleth render modes.
 *
 * Icon options are per field instance and travel in the payload. 2.x wrote
 * them onto L.Icon.Default, which is process-global, so two fields on one
 * page silently shared whichever icon rendered last.
 */
trait HasMarkers
{
    protected ?string $markerIcon = null;

    /** @var array{0: int, 1: int}|null */
    protected ?array $markerIconSize = null;

    /** @var array{0: int, 1: int}|null */
    protected ?array $markerIconAnchor = null;

    protected ?Closure $markerCallback = null;

    protected ?bool $clusterEnabled = null;

    protected ?int $clusterDisableAtZoom = null;

    protected ?string $clusterColorProperty = null;

    protected bool $heatmap = false;

    protected ?string $heatmapProperty = null;

    protected ?string $choroplethProperty = null;

    protected string $choroplethScale = 'quantile';

    /**
     * Replace the default marker image.
     *
     * @param  array{0: int, 1: int}|null  $size
     * @param  array{0: int, 1: int}|null  $anchor
     */
    public function markerIcon(string $url, ?array $size = null, ?array $anchor = null): static
    {
        $this->markerIcon = $url;
        $this->markerIconSize = $size;
        $this->markerIconAnchor = $anchor;

        return $this;
    }

    /**
     * Style each marker from its feature.
     *
     * The callback returns any of: icon, iconSize, iconAnchor, color,
     * fillColor, radius, weight, opacity.
     *
     * @param  Closure(array<string, mixed>): array<string, mixed>  $callback
     */
    public function markerUsing(Closure $callback): static
    {
        $this->markerCallback = $callback;

        return $this;
    }

    /**
     * Group nearby markers. Clustering stops below the given zoom, where
     * individual positions matter more than density.
     */
    public function cluster(bool $enabled = true, ?int $disableAtZoom = null): static
    {
        $this->clusterEnabled = $enabled;
        $this->clusterDisableAtZoom = $disableAtZoom;

        return $this;
    }

    public function withoutClustering(): static
    {
        return $this->cluster(false);
    }

    /**
     * Colour cluster bubbles by the dominant value of a feature property.
     */
    public function clusterColorBy(string $property): static
    {
        $this->clusterColorProperty = $property;

        return $this;
    }

    /**
     * Render a heat layer instead of markers, optionally weighted by a
     * numeric feature property.
     */
    public function heatmap(bool $enabled = true, ?string $weightProperty = null): static
    {
        $this->heatmap = $enabled;
        $this->heatmapProperty = $weightProperty;

        return $this;
    }

    /**
     * Colour polygons by a numeric property, with a generated legend.
     *
     * "quantile" gives every bucket the same number of features and suits
     * skewed data; "linear" splits the range evenly.
     */
    public function choropleth(string $property, string $scale = 'quantile'): static
    {
        $this->choroplethProperty = $property;
        $this->choroplethScale = $scale;

        return $this;
    }

    /**
     * Attach per-feature marker styles resolved by the callback.
     *
     * @param  array{type: string, features: array<int, array<array-key, mixed>>}  $collection
     * @return array{type: string, features: array<int, array<array-key, mixed>>}
     */
    protected function prepareMarkers(array $collection): array
    {
        if ($this->markerCallback === null) {
            return $collection;
        }

        foreach ($collection['features'] as $index => $feature) {
            $style = ($this->markerCallback)($feature);

            if ($style !== []) {
                $properties = (array) ($feature['properties'] ?? []);
                $properties['__marker'] = $style;
                $collection['features'][$index]['properties'] = $properties;
            }
        }

        return $collection;
    }

    /**
     * @return array<string, mixed>
     */
    protected function markerMeta(int $featureCount): array
    {
        $clusterEnabled = $this->clusterEnabled
            ?? Config::bool('cluster.enabled', true);

        // Clustering a handful of markers adds a click between the user and
        // the data without making anything more readable.
        if ($featureCount < Config::int('cluster.min_features', 10)) {
            $clusterEnabled = false;
        }

        return [
            'markerIcon' => $this->markerIcon,
            'markerIconSize' => $this->markerIconSize,
            'markerIconAnchor' => $this->markerIconAnchor,
            'cluster' => $clusterEnabled,
            'clusterDisableAtZoom' => $this->clusterDisableAtZoom
                ?? Config::int('cluster.disable_at_zoom', 11),
            'clusterColorProperty' => $this->clusterColorProperty,
            'heatmap' => $this->heatmap,
            'heatmapProperty' => $this->heatmapProperty,
            'choroplethProperty' => $this->choroplethProperty,
            'choroplethScale' => $this->choroplethScale,
            // Past this many features, per-feature popups and SVG paths cost
            // more than they are worth; the browser switches to canvas.
            'useCanvas' => $featureCount > Config::int('canvas_threshold', 1000),
        ];
    }
}
