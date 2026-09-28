<?php

declare(strict_types=1);

use Gabrielesbaiz\NovaFieldMap\Contracts\Geocoder;
use Gabrielesbaiz\NovaFieldMap\Geocoders\CachedGeocoder;
use Gabrielesbaiz\NovaFieldMap\Geocoders\NullGeocoder;

it('publishes its config', function (): void {
    expect(config('nova-field-map.height'))->toBe('300px')
        ->and(config('nova-field-map.cluster.enabled'))->toBeTrue();
});

it('registers the geocoder as a singleton', function (): void {
    expect(app(Geocoder::class))->toBeInstanceOf(CachedGeocoder::class)
        ->and(app(Geocoder::class))->toBe(app(Geocoder::class));
});

it('falls back to a null geocoder when a keyed driver has no key', function (): void {
    config()->set('nova-field-map.geocoder.driver', 'mapbox');
    config()->set('nova-field-map.geocoder.mapbox_key', null);
    config()->set('nova-field-map.geocoder.cache_ttl', 0);
    app()->forgetInstance(Geocoder::class);

    expect(app(Geocoder::class))->toBeInstanceOf(NullGeocoder::class);
});

it('registers the lazy asset route', function (): void {
    expect(route('nova-field-map.asset', ['file' => 'lazy-core.js']))
        ->toContain('/nova-vendor/nova-field-map/asset/lazy-core.js');
});

it('serves a built chunk as javascript', function (): void {
    // The response is Symfony's BinaryFileResponse, not Illuminate's, so the
    // header bag has to be written directly rather than with withHeaders().
    if (! is_file(__DIR__.'/../dist/js/lazy-core.js')) {
        $this->markTestSkipped('Run "npm run build" to exercise asset serving.');
    }

    $this->get('/nova-vendor/nova-field-map/asset/lazy-core.js')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/javascript; charset=utf-8')
        ->assertHeader('X-Content-Type-Options', 'nosniff');
});

it('serves only the chunks the build emits', function (string $file): void {
    // The route parameter reaches the filesystem, so anything outside the
    // build's own output must be refused rather than resolved.
    $this->get('/nova-vendor/nova-field-map/asset/'.$file)->assertNotFound();
})->with([
    'unknown name' => ['secrets.js'],
    'not javascript' => ['field.css'],
    'traversal attempt' => ['..%2F..%2Fcomposer.json'],
]);
