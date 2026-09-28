<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Concerns;

use Closure;
use Gabrielesbaiz\NovaFieldMap\Support\Config;
use Gabrielesbaiz\NovaFieldMap\Support\PopupContent;

/**
 * Popup configuration and the server-side preparation of popup bodies.
 *
 * Bodies are prepared here, not in the browser, so escaping decisions are
 * made once in PHP where the trust boundary is visible.
 */
trait RendersPopups
{
    protected ?string $popupProperty = null;

    protected ?Closure $popupCallback = null;

    protected bool $allowHtmlPopups = false;

    protected ?string $tooltipProperty = null;

    /**
     * Bind a popup built from the named feature property.
     *
     * The value is escaped. Call allowHtmlPopups() to render it as markup.
     */
    public function popup(string $property): static
    {
        $this->popupProperty = $property;

        return $this;
    }

    /**
     * Build each popup body server-side.
     *
     * The callback receives the feature array and may return a string, a
     * view, or any Htmlable. Views and Htmlables are treated as trusted
     * markup; plain strings are escaped unless allowHtmlPopups() is set.
     *
     * @param  Closure(array<string, mixed>): mixed  $callback
     */
    public function popupUsing(Closure $callback): static
    {
        $this->popupCallback = $callback;

        return $this;
    }

    /**
     * Render popup strings as raw HTML.
     *
     * Only do this when the content is authored by trusted users. The browser
     * still sanitizes it unless nova-field-map.popups.sanitize is disabled.
     */
    public function allowHtmlPopups(bool $allow = true): static
    {
        $this->allowHtmlPopups = $allow;

        return $this;
    }

    /**
     * Show the named property as a hover tooltip. Always escaped.
     */
    public function tooltip(string $property): static
    {
        $this->tooltipProperty = $property;

        return $this;
    }

    /**
     * Attach prepared popup and tooltip bodies to every feature.
     *
     * @param  array{type: string, features: array<int, array<array-key, mixed>>}  $collection
     * @return array{type: string, features: array<int, array<array-key, mixed>>}
     */
    protected function preparePopups(array $collection): array
    {
        if ($this->popupProperty === null && $this->popupCallback === null && $this->tooltipProperty === null) {
            return $collection;
        }

        foreach ($collection['features'] as $index => $feature) {
            $properties = (array) ($feature['properties'] ?? []);

            $popup = PopupContent::make(
                $this->popupCallback !== null
                    ? ($this->popupCallback)($feature)
                    : ($properties[$this->popupProperty] ?? null),
                $this->allowHtmlPopups,
            );

            if ($popup !== null) {
                $properties['__popup'] = $popup;
            }

            if ($this->tooltipProperty !== null) {
                // Tooltips are never HTML: there is no use case that justifies
                // the extra surface.
                $tooltip = PopupContent::make($properties[$this->tooltipProperty] ?? null, false);

                if ($tooltip !== null) {
                    $properties['__tooltip'] = $tooltip['content'];
                }
            }

            $collection['features'][$index]['properties'] = $properties;
        }

        return $collection;
    }

    /**
     * @return array<string, mixed>
     */
    protected function popupMeta(): array
    {
        return [
            'popupProperty' => $this->popupProperty,
            'allowHtmlPopups' => $this->allowHtmlPopups,
            'sanitizePopups' => Config::bool('popups.sanitize', true),
        ];
    }
}
