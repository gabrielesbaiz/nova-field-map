<p align="center">
    <img src="art/nova-field-map-logo.png" alt="NovaField Map" width="600">
</p>

# NovaField Map

A Leaflet map field for Laravel Nova 5 — reads the coordinate column your model already has, draws it, and lets an administrator drop the pin themselves.

[![Latest version](https://img.shields.io/packagist/v/gabrielesbaiz/nova-field-map.svg?style=flat-square)](https://packagist.org/packages/gabrielesbaiz/nova-field-map)
[![PHP](https://img.shields.io/packagist/dependency-v/gabrielesbaiz/nova-field-map/php?style=flat-square)](composer.json)
[![Laravel](https://img.shields.io/packagist/dependency-v/gabrielesbaiz/nova-field-map/illuminate%2Fsupport?style=flat-square&label=laravel)](composer.json)
[![Downloads](https://img.shields.io/packagist/dt/gabrielesbaiz/nova-field-map.svg?style=flat-square)](https://packagist.org/packages/gabrielesbaiz/nova-field-map)
[![Stars](https://img.shields.io/github/stars/gabrielesbaiz/nova-field-map?style=flat-square&logo=github)](https://github.com/gabrielesbaiz/nova-field-map/stargazers)
[![Sponsor](https://img.shields.io/github/sponsors/gabrielesbaiz?style=flat-square&label=sponsor&logo=github)](https://github.com/sponsors/gabrielesbaiz)

### 📖 [Read the documentation →](https://gabrielesbaiz.github.io/nova-field-map/)

Every one of the 58 methods with its signature, a playground where you build a
field with controls and watch the chain, the preview and the serialized payload
change together, plus recipes, tile providers and the upgrade path from 2.x.

> [!CAUTION]
> **Upgrading from 2.x?** Read [UPGRADE.md](UPGRADE.md) first. Three things
> changed that your resources will notice: popup content is now **escaped by
> default** (2.x rendered it as raw HTML, which was a stored-XSS hole), the
> field now **resolves its own attribute** instead of being handed data at
> `make()` time, and `minimap()`, `measure()`, `exportImage()` and
> `popupActions()` do not exist. Every other 2.x call still works.

> [!IMPORTANT]
> **Does this save you time?**
> A ⭐ costs you nothing and helps other developers find it.
> [Sponsoring](https://github.com/sponsors/gabrielesbaiz) keeps it compatible
> with every new Nova release.

## What it does

If all you need is to show a latitude and a longitude, **you do not need this
package**. Two `Number` fields do that with less JavaScript and less to go
wrong, and an administrator who knows the coordinates can type them. This
package exists for when the *shape of the place* is the information:

- **Reads the column you already have.** A `"45.6495,13.7768"` string, a `[lat, lng]` array, a keyed array, GeoJSON or a spatial `Point` — detected, not declared.
- **An ordinary Nova field.** It resolves its own attribute, so `dependsOn()`, `resolveUsing()`, filling and validation all work. 2.x could not do any of that.
- **Editable when you ask.** Points, lines, polygons, rectangles and circles, with place search, address filling and an arrow-key nudge.
- **Dense data stays readable.** Clustering, heatmaps, choropleth, category filters, a timeline and a canvas renderer past a thousand features.
- **Popups are escaped in PHP**, and HTML is an explicit opt-in that is still sanitised in the browser.
- **Leaflet is not on every page.** The entry bundle is 11 kB gzipped; the map itself arrives only when one is about to become visible.

The trade is size and honesty about it: a page that renders a map pays roughly
52 kB gzipped for Leaflet. If an index table needs a location column and nothing
more, use `snapshot()` or two numbers rather than a live map per row.

## Requirements

- PHP 8.2 or newer
- Laravel 11, 12 or 13
- Laravel Nova 5 (sold separately)

Nova 4 is not supported. Use 2.x for Nova 4.

## Installation

```bash
composer require gabrielesbaiz/nova-field-map

php artisan vendor:publish --tag=nova-field-map-config
php artisan vendor:publish --tag=nova-field-map-lang

php artisan nova-field-map:doctor
```

The service provider is auto-discovered and the assets ship built: no migrations,
no `nova:publish`, nothing to compile. Both publish steps are optional — the
defaults use OpenStreetMap tiles, which need no key.

**[Full installation guide →](https://gabrielesbaiz.github.io/nova-field-map/#/install)**

## Artisan commands

| Command | Purpose |
|---|---|
| `nova-field-map:doctor` | Verifies the built assets exist, the configured keys are present, and every tile host responds. `--skip-network` skips the outbound requests. |

See the [commands page](https://gabrielesbaiz.github.io/nova-field-map/#/commands).

## Documentation

| | |
|---|---|
| [Documentation site](https://gabrielesbaiz.github.io/nova-field-map/) | Everything: install, configure, operate. |
| [Playground](https://gabrielesbaiz.github.io/nova-field-map/#/play) | Build a field with controls; read the chain, the preview and the payload as they change. |
| [API reference](https://gabrielesbaiz.github.io/nova-field-map/#/api) | All 58 methods, searchable, with signatures. |
| [Recipes](https://gabrielesbaiz.github.io/nova-field-map/#/recipes) | Store locator, delivery zone, address form, GPS track. |
| [Tile providers](https://gabrielesbaiz.github.io/nova-field-map/#/tiles) | The ten built in, which need a key, and adding your own. |
| [Troubleshooting](https://gabrielesbaiz.github.io/nova-field-map/#/troubleshooting) | Blank maps, missing tiles, popups showing as text. |
| [Security](https://gabrielesbaiz.github.io/nova-field-map/#/security) | The threat model and what escaping actually covers. |
| [UPGRADE.md](UPGRADE.md) | Upgrading from 2.x. Read before you start. |
| [CHANGELOG.md](CHANGELOG.md) | What changed, and when. |

## Testing

```bash
composer test        # Pest
composer analyse     # PHPStan
composer format      # Pint

npm run test         # Vitest
npm run build        # Vite, both passes
```

There is no CI. Those commands are the contract, and between them they prove the
parts that are easy to break: 2.x chains still serialize, popup content is
escaped by default and sanitised when allowed, an empty collection never reaches
`fitBounds`, exactly one layer control renders, two fields on one page keep their
own marker icons, and `map.remove()` really runs on unmount.

## Contributing

Pull requests and issues are welcome. Run the five commands above before opening
one — a change that leaves any of them red will be asked for a fix first.

## Security vulnerabilities

Please review [our security policy](../../security/policy) for reporting a
vulnerability. Please do not open a public issue.

## Credits

- [Chad Copeland](https://github.com/iMuMz) — the original
  [NovaFieldMap](https://github.com/iMuMz/NovaFieldMap) this began as
- [Gabriele Sbaiz](https://github.com/gabrielesbaiz)
- [All Contributors](../../contributors)

Built on [Leaflet](https://leafletjs.com),
[Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster),
[Leaflet-Geoman](https://github.com/geoman-io/leaflet-geoman) and
[DOMPurify](https://github.com/cure53/DOMPurify). Geocoding by
[Nominatim](https://nominatim.org) unless configured otherwise.

## Support this package

I maintain this on evenings and weekends, alongside a full-time job writing
insurance software. Keeping it green across new Nova majors is the unglamorous
part, and it is what keeps this installable in your `composer.json` next year
too.

If it is useful to you:

- ⭐ **Star the repo.** Free, thirty seconds, and it is the first signal other developers look at.
- ❤️ **[Become a sponsor](https://github.com/sponsors/gabrielesbaiz).** From $5 a month. Company tiers get your logo right here in this README.
- 🐛 **Open a good issue.** A clear reproduction is worth more than you think.
- 🗣️ **Tell another Laravel developer.** Word of mouth is how packages survive.

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-gabrielesbaiz-ff69b4?style=for-the-badge&logo=github-sponsors)](https://github.com/sponsors/gabrielesbaiz)

## Disclaimer

This package is provided as is. It renders geographic data supplied by your
application and by third-party tile and geocoding providers; the accuracy of
what appears on the map, and the licence terms of the tiles you choose to
serve, are the deploying application's responsibility, not this package's.

## License

MIT. See [LICENSE.md](LICENSE.md). The MIT licence's warranty disclaimer and
limitation of liability apply in full, alongside the section above.
