import { vi } from "vitest";

/**
 * Serves the lazy chunks straight from source.
 *
 * At runtime these are fetched over HTTP from the package's asset route,
 * which has no equivalent in a test process, so the loader is replaced with
 * one that returns the real modules. Everything below the loader — Leaflet
 * itself, the cluster group, the icons — is the genuine article.
 */
export function mockChunks() {
    vi.mock("../../resources/js/composables/useLazyChunks.js", async () => {
        const core = await import("../../resources/js/lazy/core.js");

        const chunks = {
            core,
            sanitize: {
                sanitizeHtml: (html) =>
                    html.replace(/ on\w+="[^"]*"/gi, "").replace(/<script[\s\S]*?<\/script>/gi, ""),
            },
            draw: {},
            heat: {},
            google: { loadGoogleMaps: () => Promise.resolve({}) },
        };

        return {
            loadChunk: (field, name) => Promise.resolve(chunks[name] || {}),
            loadCore: () => Promise.resolve(core),
        };
    });
}

/**
 * A field payload shaped like the one FieldMap serializes.
 */
export function makeField(overrides = {}) {
    return {
        name: "Location",
        attribute: "location",
        height: "300px",
        center: [45.6495, 13.7768],
        zoom: 12,
        fitPadding: 24,
        fitMaxZoom: 16,
        maxBounds: null,
        scrollWheelZoom: true,
        darkMode: true,
        cluster: false,
        clusterDisableAtZoom: 11,
        useCanvas: false,
        heatmap: false,
        copyable: false,
        deeplinks: false,
        exportData: false,
        accessibleTable: false,
        sanitizePopups: true,
        editable: false,
        shapes: [],
        singleShape: true,
        storeAs: "geojson",
        assetBaseUrl: "/nova-vendor/nova-field-map/asset",
        tiles: [
            {
                key: "osm",
                label: "OpenStreetMap",
                url: "https://tile.example.test/{z}/{x}/{y}.png",
                attribution: "test",
                maxZoom: 20,
                dark: false,
                mutant: false,
            },
        ],
        darkTile: null,
        geojson: { type: "FeatureCollection", features: [] },
        bounds: null,
        featureCount: 0,
        latitude: null,
        longitude: null,
        ...overrides,
    };
}

export function pointFeature(lng, lat, properties = {}) {
    return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties,
    };
}

export function collectionOf(...features) {
    return { type: "FeatureCollection", features };
}

/**
 * Vue's unmount and Leaflet's teardown both run in microtasks.
 */
export function tick(times = 3) {
    return Array.from({ length: times }).reduce(
        (promise) => promise.then(() => Promise.resolve()),
        Promise.resolve(),
    );
}
