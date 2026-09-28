<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Enums;

enum CoordinateFormat: string
{
    /** Decimal degrees, e.g. 45.6495, 13.7768. */
    case Decimal = 'decimal';

    /** Degrees, minutes, seconds, e.g. 45°38'58"N 13°46'36"E. */
    case Dms = 'dms';
}
