# Changelog

All notable changes to `nova-field-map` will be documented in this file.

## 3.0.0

A rewrite. See [UPGRADE.md](UPGRADE.md) before upgrading.

### Security

- **Popup and tooltip content is now escaped by default.** 2.x passed feature
  properties straight to Leaflet's `bindPopup()`, which renders a string as raw
  HTML, so any user who could write that column could run JavaScript in an
  authenticated administrator's session. Markup now requires an explicit
  `allowHtmlPopups()`, and is still sanitised in the browser unless
  `popups.sanitize` is disabled.
- Geocoding is proxied through the application, so provider keys stay
  server-side.
- The lazy asset route serves a fixed whitelist and verifies the resolved path
  stays inside the package's own `dist/js`.

### Fixed

- The layer control was added twice, rendering two stacked switchers.
- Marker icon options were written to `L.Icon.Default.prototype`, so two fields
  on one page silently shared whichever icon rendered last.
- The map was never removed on unmount, leaking a Leaflet instance, its DOM and
  its handlers on every Inertia navigation.
- A record with no geometry called `fitBounds` on an empty layer and threw
  `Bounds are not valid`.
- A GeoJSON string that failed to parse was passed through to Leaflet anyway,
  producing a blank map with no error.
- The Google layer was constructed before its SDK finished loading, throwing if
  a user switched to it early.

### Added

- The field resolves its own model attribute, detecting GeoJSON, `"lat,lng"`
  strings, positional and keyed arrays, and spatial value objects. Custom
  resolvers can be registered.
- Editable form field: click-to-place, draggable markers, polygon/line/circle/
  rectangle drawing, place search, browser geolocation, manual coordinate
  inputs, arrow-key nudging, and undo/redo.
- `relation()` plots a relation as one marker per related record.
- `fillsAddress()` reverse-geocodes a dropped pin into other Nova fields.
- `syncTo()` drives two existing number fields, so a resource can adopt the map
  with no schema change.
- `linkToResource()` navigates to a record's detail page on marker click.
- `WithinGeofence` validation rule and `MapBoundsFilter` index filter.
- Dark mode that follows Nova's theme, with a tile-provider registry covering
  OpenStreetMap, Carto, Esri, OpenTopoMap, Stadia, Google, Mapbox and MapTiler,
  plus custom providers from config.
- Data visualisation: `choropleth()`, `filterable()`, `timeline()`, `route()`,
  `elevationProfile()`, `legend()`, `heatmap()`, `clusterColorBy()`.
- Quality of life: copy coordinates, open-in deeplinks, GeoJSON and GPX export,
  DMS coordinate formatting, `maxBounds()`, `fullscreen()`, `locateControl()`,
  `scaleControl()`, `accessibleTable()`, `snapshot()`, `thumbnail()`.
- `php artisan nova-field-map:doctor` verifies assets, keys and tile
  reachability.
- Config file and English and Italian translations.

### Changed

- Requires PHP 8.2, Laravel 11–13 and Nova 5. Nova 4 is no longer supported.
- Build moved from laravel-mix to Vite 6, split into an entry bundle and lazily
  fetched chunks. The bundle loaded on every Nova page went from 74 kB gzipped
  to 11 kB; Leaflet is fetched only when a map is about to become visible.
- `FieldMap` and `FieldMapServiceProvider` are the new names. `NovaFieldMap`
  and `NovaFieldMapServiceProvider` remain as deprecated aliases until 4.0.
- Components rewritten as Vue 3 `<script setup>` with scoped styles; the global
  `.leaflet-*` overrides are gone.
- Map containers carry `role="application"` and a label, and are keyboard
  focusable.
- Dropped the unused `vuex`, `@inertiajs/inertia`, `scriptjs`, `lodash` and
  `form-backend-validation` dependencies, and the unused
  `spatie/laravel-package-tools` requirement.

### Removed

- `exportImage()`, `minimap()`, `measure()` and `popupActions()`. Each needed
  either another plugin or an approach that cannot work reliably — canvas
  tainting blocks rasterising most tile providers.

## 1.0.0

- Initial release.
