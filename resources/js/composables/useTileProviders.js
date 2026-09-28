import { loadChunk } from "./useLazyChunks";

/**
 * Builds the layer objects a field's payload describes.
 *
 * The catalogue itself lives in PHP, so a field serializes exactly the
 * layers it offers and an application can add its own from config without
 * rebuilding the bundle.
 */
export function useTileProviders(L, field) {
    const layers = {};
    const pending = [];

    const build = (definition) => {
        if (!definition) {
            return null;
        }

        if (definition.mutant) {
            // Google is drawn by its own SDK. The layer is created only after
            // that SDK resolves, so switching to it early cannot throw.
            const placeholder = L.layerGroup();

            pending.push(
                loadChunk(field, "google")
                    .then(({ loadGoogleMaps }) =>
                        loadGoogleMaps(field.googleApiKey),
                    )
                    .then(() => {
                        placeholder.addLayer(
                            L.gridLayer.googleMutant({
                                type: field.googleMapType || "roadmap",
                            }),
                        );
                    })
                    .catch(() => {
                        // Leave the placeholder empty rather than breaking the
                        // layer switcher for every other provider.
                    }),
            );

            return placeholder;
        }

        return L.tileLayer(definition.url, {
            attribution: definition.attribution,
            maxZoom: definition.maxZoom || 20,
            // Retina tiles are requested through the {r} placeholder the
            // providers that support it expose.
            detectRetina: false,
        });
    };

    (field.tiles || []).forEach((definition) => {
        const layer = build(definition);

        if (layer) {
            layers[definition.label] = layer;
            layer.__novaFieldMapKey = definition.key;
            layer.__novaFieldMapDark = definition.dark;
        }
    });

    let darkLayer = null;

    if (field.darkTile) {
        const existing = Object.values(layers).find(
            (layer) => layer.__novaFieldMapKey === field.darkTile.key,
        );

        darkLayer = existing || build(field.darkTile);

        if (darkLayer && !existing) {
            darkLayer.__novaFieldMapKey = field.darkTile.key;
            darkLayer.__novaFieldMapDark = true;
        }
    }

    return {
        layers,
        darkLayer,
        lightLayer:
            Object.values(layers).find((layer) => !layer.__novaFieldMapDark) ||
            Object.values(layers)[0] ||
            null,
        ready: Promise.all(pending),
    };
}
