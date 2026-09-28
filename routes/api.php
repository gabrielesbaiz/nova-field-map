<?php

declare(strict_types=1);

use Gabrielesbaiz\NovaFieldMap\Http\Controllers\GeocodeController;
use Illuminate\Support\Facades\Route;

/*
 * Geocoding is proxied through the application rather than called from the
 * browser so provider keys stay server-side and the results can be cached
 * once for every user.
 */
Route::get('/geocode/search', [GeocodeController::class, 'search'])
    ->name('nova-field-map.geocode.search');

Route::get('/geocode/reverse', [GeocodeController::class, 'reverse'])
    ->name('nova-field-map.geocode.reverse');
