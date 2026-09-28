<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Http\Controllers;

use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serves the lazily loaded map chunks.
 *
 * Nova::script injects every script it is given into every page, which is
 * exactly what the lazy build exists to avoid, so these files get their own
 * route instead. Only the names the build is known to emit are served, and
 * the resolved path is checked to be inside dist/js, so a crafted name can
 * never walk out of the asset directory.
 */
final class AssetController
{
    private const ALLOWED = [
        'lazy-core.js',
        'lazy-draw.js',
        'lazy-heat.js',
        'lazy-google.js',
        'lazy-sanitize.js',
    ];

    public function __invoke(string $file): BinaryFileResponse|Response
    {
        $directory = realpath(__DIR__.'/../../../dist/js');

        if ($directory === false || ! $this->allowed($file)) {
            return new Response('Not found', 404);
        }

        $path = realpath($directory.DIRECTORY_SEPARATOR.$file);

        if ($path === false || ! str_starts_with($path, $directory.DIRECTORY_SEPARATOR)) {
            return new Response('Not found', 404);
        }

        $response = new BinaryFileResponse($path);

        // BinaryFileResponse is Symfony's, not Illuminate's: it has no
        // withHeaders(), so the bag is written directly.
        $response->headers->set('Content-Type', 'application/javascript; charset=utf-8');
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        return $response->setPublic()->setMaxAge(31536000);
    }

    private function allowed(string $file): bool
    {
        // Shared chunks are named by Rollup and cannot be listed ahead of
        // time, so they are matched by the prefix the build config pins.
        return in_array($file, self::ALLOWED, true)
            || preg_match('/^lazy-shared-[A-Za-z0-9_-]+\.js$/', $file) === 1;
    }
}
