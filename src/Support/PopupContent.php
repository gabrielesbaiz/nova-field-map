<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Support;

use Illuminate\Contracts\Support\Htmlable;
use Stringable;

/**
 * Popup body preparation.
 *
 * Leaflet's bindPopup() renders a string as raw HTML. In 2.x the value of a
 * feature property was handed to it untouched, so anyone able to write that
 * column could run script in an authenticated admin's session. Popup text is
 * therefore escaped here by default, and the "html" flag is only set when a
 * field has explicitly opted in — the browser still sanitizes that case
 * unless sanitization is disabled in config.
 */
final class PopupContent
{
    /**
     * @return array{content: string, html: bool}|null
     */
    public static function make(mixed $value, bool $allowHtml): ?array
    {
        if ($value === null) {
            return null;
        }

        // Anything already marked as renderable HTML by the application —
        // a view, an Htmlable — is trusted as authored server-side.
        if ($value instanceof Htmlable) {
            return ['content' => $value->toHtml(), 'html' => true];
        }

        if ($value instanceof Stringable || is_object($value) && method_exists($value, '__toString')) {
            $value = (string) $value;
        }

        if (is_bool($value)) {
            $value = $value ? '1' : '0';
        }

        if (! is_scalar($value)) {
            return null;
        }

        $content = (string) $value;

        if ($content === '') {
            return null;
        }

        return $allowHtml
            ? ['content' => $content, 'html' => true]
            : ['content' => e($content), 'html' => false];
    }
}
