<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap;

use Gabrielesbaiz\NovaFieldMap\Console\DoctorCommand;
use Gabrielesbaiz\NovaFieldMap\Contracts\Geocoder;
use Gabrielesbaiz\NovaFieldMap\Geocoders\GeocoderManager;
use Gabrielesbaiz\NovaFieldMap\Http\Controllers\AssetController;
use Illuminate\Contracts\Container\Container;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Laravel\Nova\Nova;

class FieldMapServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/nova-field-map.php', 'nova-field-map');

        $this->app->singleton(Geocoder::class, static fn (Container $app): Geocoder => GeocoderManager::make($app));
    }

    public function boot(): void
    {
        $this->publishes([
            __DIR__.'/../config/nova-field-map.php' => config_path('nova-field-map.php'),
        ], 'nova-field-map-config');

        $this->publishes([
            __DIR__.'/../lang' => lang_path('vendor/nova-field-map'),
        ], 'nova-field-map-lang');

        if ($this->app->runningInConsole()) {
            $this->commands([DoctorCommand::class]);
        }

        $this->registerRoutes();

        Nova::serving(function (): void {
            // Later calls win, so application overrides are registered last.
            Nova::translations(__DIR__.'/../lang/en.json');
            Nova::translations(__DIR__.'/../lang/'.app()->getLocale().'.json');
            Nova::translations(lang_path('vendor/nova-field-map/'.app()->getLocale().'.json'));

            // Only the entry bundle is registered here. Leaflet and its
            // plugins are fetched on demand through AssetController, so a
            // Nova page without a map does not download them at all.
            Nova::script('gabrielesbaiz-nova-field-map', __DIR__.'/../dist/js/field.js');
            Nova::style('gabrielesbaiz-nova-field-map', __DIR__.'/../dist/css/field.css');
        });
    }

    protected function registerRoutes(): void
    {
        // No middleware: these chunks are the Leaflet build, identical for
        // every visitor and carrying no application data. Putting them behind
        // Nova's stack would only make a cacheable static file uncacheable.
        Route::get('/nova-vendor/nova-field-map/asset/{file}', AssetController::class)
            ->where('file', '[A-Za-z0-9_\-.]+')
            ->name('nova-field-map.asset');

        $apiMiddleware = config('nova.api_middleware', ['nova:api']);

        Route::middleware(is_array($apiMiddleware) ? $apiMiddleware : ['nova:api'])
            ->prefix('nova-vendor/nova-field-map')
            ->group(__DIR__.'/../routes/api.php');
    }
}
