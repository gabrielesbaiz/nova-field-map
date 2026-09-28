<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Support;

use Gabrielesbaiz\NovaFieldMap\Enums\CoordinateFormat;

final class Coordinates
{
    public static function format(float $latitude, float $longitude, CoordinateFormat $format): string
    {
        return match ($format) {
            CoordinateFormat::Decimal => sprintf('%.6F, %.6F', $latitude, $longitude),
            CoordinateFormat::Dms => self::toDms($latitude, 'N', 'S').' '.self::toDms($longitude, 'E', 'W'),
        };
    }

    private static function toDms(float $value, string $positive, string $negative): string
    {
        $hemisphere = $value >= 0 ? $positive : $negative;
        $value = abs($value);

        $degrees = (int) floor($value);
        $minutesDecimal = ($value - $degrees) * 60;
        $minutes = (int) floor($minutesDecimal);
        $seconds = ($minutesDecimal - $minutes) * 60;

        // Rounding seconds can carry into minutes and then degrees; doing it
        // here keeps 59.999" from rendering as 60".
        if (round($seconds, 1) >= 60.0) {
            $seconds = 0.0;
            $minutes++;
        }

        if ($minutes >= 60) {
            $minutes = 0;
            $degrees++;
        }

        return sprintf('%d°%02d\'%04.1F"%s', $degrees, $minutes, $seconds, $hemisphere);
    }
}
