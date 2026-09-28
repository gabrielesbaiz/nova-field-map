import { onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { useLocalization } from "laravel-nova";
import { loadChunk, loadCore } from "./useLazyChunks";
import { buildGeoJsonLayer, hasFeatures } from "./useGeometry";
import { categoryColor, formatDistance, haversine } from "../support/scales";
import { useTileProviders } from "./useTileProviders";
import { useDarkMode } from "./useDarkMode";

/**
 * Owns a Leaflet instance for the lifetime of one component.
 *
 * Three things here are deliberate responses to how 2.x behaved:
 *
 *  - Leaflet is imported only once the container is about to be seen, so a
 *    Nova page with no map pays nothing for one.
 *  - Every listener, observer and the map itself are released on unmount.
 *    Nova is an Inertia SPA, so without this each navigation left a live map
 *    and its handlers attached to detached DOM.
 *  - The layer control is added exactly once. 2.x ran the same
 *    L.control.layers(...).addTo(map) twice and rendered two switchers.
 */
export function useLeafletMap(field, options = {}) {
    const { __ } = useLocalization();

    const container = ref(null);
    const map = shallowRef(null);
    const leaflet = shallowRef(null);
    const geoLayer = shallowRef(null);
    const error = ref(null);
    const ready = ref(false);

    const { isDark } = useDarkMode(field.darkMode !== false);

    let iconFactory = null;
    let visibleFeatures = null;
    let observer = null;
    let resizeObserver = null;
    let destroyed = false;
    let tiles = null;

    const teardown = () => {
        destroyed = true;

        observer?.disconnect();
        observer = null;

        resizeObserver?.disconnect();
        resizeObserver = null;

        if (map.value) {
            map.value.off();
            map.value.remove();
            map.value = null;
        }

        geoLayer.value = null;
        iconFactory = null;
        tiles = null;
    };

    onBeforeUnmount(teardown);

    const frame = (instance) => {
        const bounds = field.bounds;

        if (!bounds || !hasFeatures(field)) {
            // No geometry: fitBounds would throw, so fall back to the
            // configured view instead of erroring.
            instance.setView(field.center, field.zoom);

            return;
        }

        instance.fitBounds(bounds, {
            padding: [field.fitPadding ?? 24, field.fitPadding ?? 24],
            maxZoom: field.fitMaxZoom ?? undefined,
        });
    };

    const build = async () => {
        if (destroyed || map.value || !container.value) {
            return;
        }

        let core;

        try {
            core = await loadCore(field);
        } catch {
            error.value = true;

            return;
        }

        // The component may have been torn down while the chunk was in
        // flight, in which case there is nothing left to attach to.
        if (destroyed || !container.value) {
            return;
        }

        const { L, createIcon } = core;
        leaflet.value = L;
        iconFactory = createIcon;

        const instance = L.map(container.value, {
            zoomControl: true,
            scrollWheelZoom: field.scrollWheelZoom !== false,
            maxBounds: field.maxBounds || undefined,
            maxBoundsViscosity: field.maxBounds ? 1 : 0,
            attributionControl: true,
        });

        map.value = instance;

        tiles = useTileProviders(L, field);
        const initial =
            (isDark.value && tiles.darkLayer) || tiles.lightLayer || null;
        initial?.addTo(instance);

        const named = { ...tiles.layers };

        if (
            tiles.darkLayer &&
            !Object.values(named).includes(tiles.darkLayer)
        ) {
            named[field.darkTile.label] = tiles.darkLayer;
        }

        // Added once. A second identical control was the most visible bug in
        // the 2.x detail field.
        if (Object.keys(named).length > 1) {
            L.control
                .layers(named, null, { position: "topright" })
                .addTo(instance);
        }

        if (field.scaleControl) {
            L.control.scale({ imperial: false }).addTo(instance);
        }

        if (field.locateControl) {
            addLocateControl(L, instance);
        }

        if (field.fullscreen) {
            addFullscreenControl(L, instance);
        }

        await options.beforeRender?.({ L, map: instance, createIcon });

        if (destroyed) {
            return;
        }

        renderGeometry(L, instance, createIcon);
        frame(instance);

        ready.value = true;
        options.onReady?.({ L, map: instance, createIcon });

        Nova.$emit?.("nova-field-map:ready", { field, map: instance });
    };

    const renderGeometry = (L, instance, createIcon) => {
        if (geoLayer.value) {
            instance.removeLayer(geoLayer.value);
            geoLayer.value = null;
        }

        if (!hasFeatures(field)) {
            return;
        }

        if (field.heatmap) {
            renderHeat(L, instance);

            return;
        }

        const layer = buildGeoJsonLayer(L, field, {
            createIcon,
            onFeatureClick: options.onFeatureClick,
            features: visibleFeatures,
        });

        if (field.route) {
            drawRoute(L, instance);
        }

        if (field.cluster) {
            const cluster = L.markerClusterGroup({
                disableClusteringAtZoom: field.clusterDisableAtZoom || 11,
                chunkedLoading: true,
                iconCreateFunction: field.clusterColorProperty
                    ? (group) => clusterIcon(L, group)
                    : undefined,
            });

            cluster.addLayer(layer);
            cluster.addTo(instance);
            geoLayer.value = cluster;

            return;
        }

        layer.addTo(instance);
        geoLayer.value = layer;
    };

    /**
     * Colours a cluster bubble by the value that dominates it, so a dense
     * map still shows where each category concentrates.
     */
    const clusterIcon = (L, group) => {
        const counts = new Map();

        group.getAllChildMarkers().forEach((marker) => {
            const value = String(
                marker.feature?.properties?.[field.clusterColorProperty] ?? "",
            );

            counts.set(value, (counts.get(value) || 0) + 1);
        });

        const categories = [...counts.keys()].sort();
        const dominant = categories.reduce(
            (best, value) =>
                counts.get(value) > (counts.get(best) || 0) ? value : best,
            categories[0],
        );

        // The colour travels as a custom property so the bubble's own
        // stylesheet keeps ownership of everything else about it.
        const color = categoryColor(categories.indexOf(dominant));

        return L.divIcon({
            html: `<span style="--cluster-color:${color}">${group.getChildCount()}</span>`,
            className: "nova-field-map__cluster",
            iconSize: [36, 36],
        });
    };

    /**
     * Joins the points into a path in the order they arrived, and reports the
     * total great-circle distance.
     */
    const drawRoute = (L, instance) => {
        const positions = (visibleFeatures || field.geojson?.features || [])
            .filter((feature) => feature.geometry?.type === "Point")
            .map((feature) => [
                feature.geometry.coordinates[1],
                feature.geometry.coordinates[0],
            ]);

        if (positions.length < 2) {
            return;
        }

        L.polyline(positions, { color: "#2563eb", weight: 3, opacity: 0.8 })
            .addTo(instance)
            .bindTooltip(
                formatDistance(
                    positions.reduce(
                        (total, position, index) =>
                            index === 0
                                ? 0
                                : total +
                                  haversine(positions[index - 1], position),
                        0,
                    ),
                ),
                { sticky: true },
            );
    };

    const renderHeat = (L, instance) => {
        loadChunk(field, "heat")
            .then(() => {
                if (destroyed) {
                    return;
                }

                const points = (field.geojson?.features || [])
                    .filter((feature) => feature.geometry?.type === "Point")
                    .map((feature) => {
                        const [lng, lat] = feature.geometry.coordinates;
                        const weight = field.heatmapProperty
                            ? Number(
                                  feature.properties?.[field.heatmapProperty],
                              ) || 1
                            : 1;

                        return [lat, lng, weight];
                    });

                geoLayer.value = L.heatLayer(points, { radius: 25 }).addTo(
                    instance,
                );
            })
            .catch(() => {
                error.value = true;
            });
    };

    /**
     * Build once the container is actually on screen.
     *
     * A map created inside a collapsed Nova panel measures itself as zero
     * pixels and renders a grey strip until something invalidates its size.
     */
    const observe = () => {
        if (!container.value) {
            return;
        }

        if (typeof IntersectionObserver === "undefined") {
            build();

            return;
        }

        observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    return;
                }

                // One-shot: the map only needs building once, and a live
                // observer would keep firing for the page's lifetime.
                observer?.disconnect();
                observer = null;

                build();
            },
            { threshold: 0.01 },
        );

        observer.observe(container.value);

        // A container that changes size after the map exists — a panel
        // opening, a window resize — needs the map told, or Leaflet keeps
        // rendering at the old dimensions.
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => {
                map.value?.invalidateSize();
            });

            resizeObserver.observe(container.value);
        }
    };

    /**
     * Both controls are built by hand rather than pulled from a plugin: each
     * is a button and a browser API, and a plugin would cost more bytes than
     * the feature.
     */
    const addLocateControl = (L, instance) => {
        const control = L.control({ position: "topleft" });

        control.onAdd = () => {
            const bar = L.DomUtil.create("div", "leaflet-bar");
            const button = L.DomUtil.create("a", "", bar);

            button.href = "#";
            button.title = __("Use my location");
            button.innerHTML = "&#9678;";
            button.setAttribute("role", "button");

            L.DomEvent.on(button, "click", (event) => {
                L.DomEvent.stop(event);

                navigator.geolocation?.getCurrentPosition(
                    ({ coords }) =>
                        instance.setView(
                            [coords.latitude, coords.longitude],
                            15,
                        ),
                    () =>
                        Nova.error?.(
                            __("Geolocation is not available in this browser."),
                        ),
                );
            });

            return bar;
        };

        control.addTo(instance);
    };

    const addFullscreenControl = (L, instance) => {
        const control = L.control({ position: "topleft" });

        control.onAdd = () => {
            const bar = L.DomUtil.create("div", "leaflet-bar");
            const button = L.DomUtil.create("a", "", bar);

            button.href = "#";
            button.title = "Fullscreen";
            button.innerHTML = "&#9974;";
            button.setAttribute("role", "button");

            L.DomEvent.on(button, "click", (event) => {
                L.DomEvent.stop(event);

                const target = instance.getContainer();

                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    target.requestFullscreen?.();
                }

                // Leaflet caches the container size, so it has to be told
                // once the browser has finished resizing.
                setTimeout(() => instance.invalidateSize(), 250);
            });

            return bar;
        };

        control.addTo(instance);
    };

    watch(isDark, (dark) => {
        if (!map.value || !tiles) {
            return;
        }

        const next = dark ? tiles.darkLayer : tiles.lightLayer;
        const previous = dark ? tiles.lightLayer : tiles.darkLayer;

        if (!next || next === previous) {
            return;
        }

        if (previous && map.value.hasLayer(previous)) {
            map.value.removeLayer(previous);
            next.addTo(map.value);
        }
    });

    return {
        container,
        map,
        leaflet,
        geoLayer,
        error,
        ready,
        isDark,
        observe,
        // Re-render the geometry in place after a timeline or filter control
        // narrows which features should be visible.
        setVisibleFeatures: (features) => {
            visibleFeatures = features;

            if (map.value && leaflet.value && iconFactory) {
                renderGeometry(leaflet.value, map.value, iconFactory);
            }
        },
        teardown,
    };
}
