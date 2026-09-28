<?php

declare(strict_types=1);

arch('it will not use debugging functions')
    ->expect(['dd', 'dump', 'ray', 'var_dump', 'die'])
    ->each->not->toBeUsed();

arch('source files declare strict types')
    ->expect('Gabrielesbaiz\NovaFieldMap')
    ->toUseStrictTypes();

arch('contracts are interfaces')
    ->expect('Gabrielesbaiz\NovaFieldMap\Contracts')
    ->toBeInterfaces();

arch('enums are enums')
    ->expect('Gabrielesbaiz\NovaFieldMap\Enums')
    ->toBeEnums();

arch('resolvers implement the contract')
    ->expect('Gabrielesbaiz\NovaFieldMap\Resolvers')
    ->classes()
    ->toImplement('Gabrielesbaiz\NovaFieldMap\Contracts\GeometryResolver')
    ->ignoring('Gabrielesbaiz\NovaFieldMap\Resolvers\ResolverRegistry');

arch('geocoders implement the contract')
    ->expect('Gabrielesbaiz\NovaFieldMap\Geocoders')
    ->classes()
    ->toImplement('Gabrielesbaiz\NovaFieldMap\Contracts\Geocoder')
    ->ignoring('Gabrielesbaiz\NovaFieldMap\Geocoders\GeocoderManager');

arch('support classes stay free of framework facades')
    ->expect('Gabrielesbaiz\NovaFieldMap\Support\GeoJson')
    ->not->toUse(['Illuminate\Support\Facades\DB', 'Illuminate\Support\Facades\Http']);
