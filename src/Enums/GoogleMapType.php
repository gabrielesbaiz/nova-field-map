<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Enums;

enum GoogleMapType: string
{
    case Roadmap = 'roadmap';

    case Satellite = 'satellite';

    case Terrain = 'terrain';

    case Hybrid = 'hybrid';
}
