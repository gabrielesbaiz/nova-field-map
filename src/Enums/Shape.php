<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Enums;

/**
 * Geometry a user may draw on an editable field.
 *
 * Values match Leaflet-Geoman's control names so the payload can be handed to
 * the draw toolbar without translation.
 */
enum Shape: string
{
    case Point = 'Marker';

    case Line = 'Line';

    case Polygon = 'Polygon';

    case Rectangle = 'Rectangle';

    case Circle = 'Circle';

    case CircleMarker = 'CircleMarker';
}
