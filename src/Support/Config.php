<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Support;

/**
 * Typed reads of the package's configuration.
 *
 * config() returns mixed, and a published config file is an editable text
 * file: a typo turns into a TypeError deep inside a Leaflet payload rather
 * than at the point the value was read. Every read goes through here so the
 * wrong type falls back to the documented default instead.
 */
final class Config
{
    public static function string(string $key, string $default = ''): string
    {
        $value = config('nova-field-map.'.$key, $default);

        return is_string($value) ? $value : $default;
    }

    public static function nullableString(string $key): ?string
    {
        $value = config('nova-field-map.'.$key);

        return is_string($value) && $value !== '' ? $value : null;
    }

    public static function int(string $key, int $default = 0): int
    {
        $value = config('nova-field-map.'.$key, $default);

        return is_numeric($value) ? (int) $value : $default;
    }

    public static function float(string $key, float $default = 0.0): float
    {
        $value = config('nova-field-map.'.$key, $default);

        return is_numeric($value) ? (float) $value : $default;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $value = config('nova-field-map.'.$key, $default);

        return is_bool($value) ? $value : $default;
    }

    /**
     * @return array<array-key, mixed>
     */
    public static function array(string $key): array
    {
        $value = config('nova-field-map.'.$key, []);

        return is_array($value) ? $value : [];
    }

    /**
     * A list of provider keys, with anything that is not a string dropped.
     *
     * @return array<int, string>
     */
    public static function strings(string $key): array
    {
        return array_values(array_filter(self::array($key), 'is_string'));
    }
}
