<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Enums;

/**
 * The legacy 2.x geometry hint.
 *
 * 3.0 detects the shape of a resolved value instead of being told, so this
 * only exists to keep type() working for resources that have not migrated.
 */
enum MapType: string
{
    case GeoJson = 'GeoJson';

    case LatLon = 'LatLon';

    public static function tryFromLoose(?string $value): ?self
    {
        if ($value === null) {
            return null;
        }

        foreach (self::cases() as $case) {
            if (strcasecmp($case->value, $value) === 0) {
                return $case;
            }
        }

        return null;
    }
}
