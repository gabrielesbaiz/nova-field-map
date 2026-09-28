<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Console;

use Gabrielesbaiz\NovaFieldMap\Enums\Tile;
use Gabrielesbaiz\NovaFieldMap\Support\Config;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Checks that the package can actually do its job in this installation:
 * assets built, keys present, tile hosts reachable.
 *
 * Most map problems are configuration problems, and a blank grey box is a
 * uniquely unhelpful way to learn that.
 */
final class DoctorCommand extends Command
{
    protected $signature = 'nova-field-map:doctor {--skip-network : Do not make outbound tile requests}';

    protected $description = 'Diagnose the nova-field-map installation';

    public function handle(): int
    {
        $this->components->info('nova-field-map diagnostics');

        $failures = [
            $this->checkAssets(),
            $this->checkKeys(),
            $this->option('skip-network') ? false : $this->checkTiles(),
        ];

        $failed = in_array(true, $failures, true);

        if ($failed) {
            $this->newLine();
            $this->components->error('One or more checks failed.');

            return self::FAILURE;
        }

        $this->newLine();
        $this->components->info('All checks passed.');

        return self::SUCCESS;
    }

    private function checkAssets(): bool
    {
        $base = __DIR__.'/../../dist';

        $required = [
            'js/field.js' => 'entry bundle',
            'css/field.css' => 'stylesheet',
            'js/lazy-core.js' => 'lazy Leaflet chunk',
        ];

        $failed = false;

        foreach ($required as $path => $label) {
            if (is_file($base.'/'.$path)) {
                $this->components->twoColumnDetail($label, '<fg=green>found</>');

                continue;
            }

            $this->components->twoColumnDetail($label, '<fg=red>missing</>');
            $failed = true;
        }

        if ($failed) {
            $this->components->warn('Run "npm install && npm run build" in the package directory.');
        }

        return $failed;
    }

    private function checkKeys(): bool
    {
        $providers = Config::strings('tiles.providers');
        $failed = false;

        if (in_array(Tile::Google->value, $providers, true) && Config::nullableString('google.key') === null) {
            $this->components->twoColumnDetail('Google tiles', '<fg=red>no API key configured</>');
            $failed = true;
        }

        if (Config::nullableString('google.key') !== null) {
            $this->components->twoColumnDetail(
                'Google API key',
                '<fg=yellow>present — confirm it is restricted by HTTP referrer</>',
            );
        }

        $driver = Config::string('geocoder.driver', 'nominatim');

        $missingKey = match ($driver) {
            'mapbox' => Config::nullableString('geocoder.mapbox_key') === null,
            'maptiler' => Config::nullableString('geocoder.maptiler_key') === null,
            default => false,
        };

        if ($missingKey) {
            $this->components->twoColumnDetail("Geocoder [{$driver}]", '<fg=red>no API key configured</>');
            $failed = true;
        } else {
            $this->components->twoColumnDetail("Geocoder [{$driver}]", '<fg=green>ok</>');
        }

        return $failed;
    }

    private function checkTiles(): bool
    {
        $failed = false;

        foreach (Config::strings('tiles.providers') as $key) {
            $tile = Tile::tryFrom($key);
            $url = $tile?->url();

            if ($url === null) {
                continue;
            }

            // A single real tile: {s} subdomains and a known-good position so
            // the request exercises the same host the browser will hit.
            $probe = strtr($url, ['{s}' => 'a', '{z}' => '1', '{x}' => '1', '{y}' => '1', '{r}' => '']);

            try {
                $status = Http::timeout(8)->get($probe)->status();
            } catch (Throwable $e) {
                $this->components->twoColumnDetail($tile->label(), '<fg=red>'.$e->getMessage().'</>');
                $failed = true;

                continue;
            }

            $ok = $status >= 200 && $status < 400;
            $this->components->twoColumnDetail(
                $tile->label(),
                $ok ? '<fg=green>reachable</>' : "<fg=red>HTTP {$status}</>",
            );

            $failed = $failed || ! $ok;
        }

        return $failed;
    }
}
