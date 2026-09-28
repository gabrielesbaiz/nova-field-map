<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Tests;

use Gabrielesbaiz\NovaFieldMap\FieldMapServiceProvider;
use Gabrielesbaiz\NovaFieldMap\Resolvers\ResolverRegistry;
use Laravel\Nova\NovaCoreServiceProvider;
use Orchestra\Testbench\TestCase as Orchestra;

abstract class TestCase extends Orchestra
{
    protected function setUp(): void
    {
        parent::setUp();

        // The registry is static, so a resolver registered by one test would
        // otherwise leak into every test that follows it.
        ResolverRegistry::flush();
    }

    /**
     * @return array<int, class-string>
     */
    protected function getPackageProviders($app): array
    {
        return [
            NovaCoreServiceProvider::class,
            FieldMapServiceProvider::class,
        ];
    }

    protected function defineEnvironment($app): void
    {
        $app['config']->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
        $app['config']->set('database.default', 'testing');
        $app['config']->set('cache.default', 'array');
    }
}
