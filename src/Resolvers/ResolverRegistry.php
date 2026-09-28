<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Resolvers;

use Gabrielesbaiz\NovaFieldMap\Contracts\GeometryResolver;
use Gabrielesbaiz\NovaFieldMap\Support\GeoJson;

/**
 * The ordered chain of geometry resolvers.
 *
 * Order matters: GeoJsonResolver claims anything with a "type" key, so the
 * narrower coordinate resolvers sit either side of it deliberately. Custom
 * resolvers registered by an application are tried first, letting them
 * override built-in behaviour for their own value objects.
 */
final class ResolverRegistry
{
    /** @var array<int, GeometryResolver> */
    private static array $custom = [];

    /** @var array<int, GeometryResolver>|null */
    private static ?array $resolved = null;

    public static function register(GeometryResolver $resolver): void
    {
        self::$custom[] = $resolver;
        self::$resolved = null;
    }

    /**
     * Reset to the built-in chain. Intended for tests.
     */
    public static function flush(): void
    {
        self::$custom = [];
        self::$resolved = null;
    }

    /**
     * @return array{type: string, features: array<int, array<array-key, mixed>>}
     */
    public static function resolve(mixed $value): array
    {
        foreach (self::all() as $resolver) {
            if ($resolver->supports($value)) {
                return $resolver->toGeoJson($value);
            }
        }

        return GeoJson::EMPTY;
    }

    /**
     * @return array<int, GeometryResolver>
     */
    public static function all(): array
    {
        return self::$resolved ??= array_merge(self::$custom, [
            new SpatialResolver,
            new GeoJsonResolver,
            new LatLngStringResolver,
            new ArrayResolver,
        ]);
    }
}
