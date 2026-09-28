<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Concerns;

use Gabrielesbaiz\NovaFieldMap\Enums\MapType;
use Gabrielesbaiz\NovaFieldMap\Support\PopupContent;

/**
 * The 2.x fluent API, kept working on top of the 3.0 one.
 *
 * 2.x asked the developer to declare the geometry's shape and then hand the
 * data over at make() time. 3.0 reads the attribute and detects the shape, so
 * most of these calls now route straight onto their modern equivalents.
 * Nothing here should grow: new behaviour belongs on the new methods.
 *
 * @deprecated 3.0 Scheduled for removal in 4.0.
 */
trait SupportsLegacyApi
{
    protected ?MapType $legacyType = null;

    /**
     * @deprecated 3.0 The geometry's shape is detected automatically.
     */
    public function type(MapType|string $type): static
    {
        $this->legacyType = $type instanceof MapType
            ? $type
            : MapType::tryFromLoose($type);

        return $this;
    }

    /**
     * Reproduce 2.x's second meaning of popup().
     *
     * Under type('GeoJson') the argument named a feature property, which is
     * what popup() still means. Under type('LatLon') it was the literal popup
     * text for the single marker. Both spellings have to keep working, so the
     * literal case is applied here rather than complicating RendersPopups.
     *
     * @param  array{type: string, features: array<int, array<array-key, mixed>>}  $collection
     * @return array{type: string, features: array<int, array<array-key, mixed>>}
     */
    protected function applyLegacyPopup(array $collection): array
    {
        if ($this->legacyType !== MapType::LatLon || $this->popupProperty === null) {
            return $collection;
        }

        $popup = PopupContent::make($this->popupProperty, $this->allowHtmlPopups);

        if ($popup === null) {
            return $collection;
        }

        foreach ($collection['features'] as $index => $feature) {
            $properties = (array) ($feature['properties'] ?? []);
            $properties['__popup'] = $popup;
            $collection['features'][$index]['properties'] = $properties;
        }

        return $collection;
    }
}
