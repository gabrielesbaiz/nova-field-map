<?php

declare(strict_types=1);

it('reports the built assets and the configured geocoder', function (): void {
    $this->artisan('nova-field-map:doctor', ['--skip-network' => true])
        ->expectsOutputToContain('entry bundle')
        ->expectsOutputToContain('Geocoder [nominatim]')
        ->assertSuccessful();
})->skip(
    fn (): bool => ! is_file(__DIR__.'/../dist/js/field.js'),
    'Run "npm run build" first.',
);

it('fails when a keyed geocoder has no key', function (): void {
    config()->set('nova-field-map.geocoder.driver', 'mapbox');
    config()->set('nova-field-map.geocoder.mapbox_key', null);

    $this->artisan('nova-field-map:doctor', ['--skip-network' => true])
        ->expectsOutputToContain('no API key configured')
        ->assertFailed();
});

it('warns that a google key reaches the browser', function (): void {
    // The key is public by necessity; the reminder is to restrict it.
    config()->set('nova-field-map.google.key', 'test-key');

    $this->artisan('nova-field-map:doctor', ['--skip-network' => true])
        ->expectsOutputToContain('restricted by HTTP referrer');
});
