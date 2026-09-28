import { computed, onMounted, ref, shallowRef } from "vue";
import { useLocalization } from "laravel-nova";
import { loadChunk } from "./useLazyChunks";
import { useLeafletMap } from "./useLeafletMap";

/**
 * The editing half of the form field: drawing, dragging, geolocation,
 * keyboard nudging, undo/redo and the value that gets submitted.
 *
 * Geometry is kept as a FeatureCollection throughout and only flattened at
 * fill() time, so a field that draws polygons and a field that drops a
 * single pin are the same code path.
 */
export function useEditableMap(field) {
    const { __ } = useLocalization();

    const geometry = ref(cloneCollection(field.geojson));
    const rangeError = ref(null);
    const drawLayer = shallowRef(null);

    // Reactive: canUndo and canRedo drive buttons, and a plain array would
    // never tell Vue its length changed.
    const history = ref([]);
    const future = ref([]);

    const map = useLeafletMap(field, {
        async beforeRender({ L, map: instance, createIcon }) {
            if (field.shapes?.length) {
                await enableDrawing(L, instance, createIcon);
            }
        },
    });

    onMounted(map.observe);

    /**
     * Geoman owns the editable layer, so the field's own GeoJSON rendering
     * is skipped here: two layers for one geometry would let the user drag
     * one and see the other stay put.
     */
    async function enableDrawing(L, instance, createIcon) {
        try {
            await loadChunk(field, "draw");
        } catch {
            return;
        }

        const group = L.geoJSON(geometry.value, {
            pointToLayer: (feature, latlng) =>
                L.marker(latlng, {
                    icon: createIcon({
                        icon: field.markerIcon,
                        iconSize: field.markerIconSize,
                        iconAnchor: field.markerIconAnchor,
                    }),
                    draggable: true,
                }),
        }).addTo(instance);

        drawLayer.value = group;

        instance.pm.addControls({
            position: "topleft",
            drawMarker: field.shapes.includes("Marker"),
            drawPolygon: field.shapes.includes("Polygon"),
            drawPolyline: field.shapes.includes("Line"),
            drawRectangle: field.shapes.includes("Rectangle"),
            drawCircle: field.shapes.includes("Circle"),
            drawCircleMarker: field.shapes.includes("CircleMarker"),
            drawText: false,
            editMode: true,
            dragMode: true,
            removalMode: true,
            rotateMode: false,
            cutPolygon: false,
        });

        instance.on("pm:create", ({ layer }) => {
            // A single-shape field replaces rather than accumulates: two pins
            // for one address is never what was meant.
            if (field.singleShape) {
                group.clearLayers();
                instance.eachLayer((existing) => {
                    if (
                        existing !== layer &&
                        existing.pm &&
                        existing !== group
                    ) {
                        instance.removeLayer(existing);
                    }
                });
            }

            group.addLayer(layer);
            instance.removeLayer(layer);
            layer.on("pm:edit", commit);
            commit();
        });

        instance.on("pm:remove", commit);
        group.on("pm:edit pm:dragend", commit);

        commit();
    }

    function commit() {
        const next = drawLayer.value
            ? drawLayer.value.toGeoJSON()
            : geometry.value;

        history.value.push(cloneCollection(geometry.value));
        future.value = [];

        geometry.value = normalize(next);
        rangeError.value = null;

        Nova.$emit?.("nova-field-map:geometry-changed", {
            field,
            geometry: geometry.value,
        });

        syncSiblingFields();
        maybeFillAddress();
    }

    function replaceWithPoint(lat, lng) {
        if (lat < -90 || lat > 90) {
            rangeError.value = __("Latitude must be between -90 and 90.");

            return;
        }

        if (lng < -180 || lng > 180) {
            rangeError.value = __("Longitude must be between -180 and 180.");

            return;
        }

        rangeError.value = null;

        // An edit that lands on the same point is not a step to undo.
        const current = firstPoint(geometry.value);

        if (current && current[0] === lat && current[1] === lng) {
            return;
        }

        history.value.push(cloneCollection(geometry.value));
        future.value = [];

        geometry.value = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    // GeoJSON positions are longitude first.
                    geometry: { type: "Point", coordinates: [lng, lat] },
                    properties: {},
                },
            ],
        };

        redraw();
        map.map.value?.setView(
            [lat, lng],
            Math.max(map.map.value.getZoom(), 14),
        );
        syncSiblingFields();
    }

    function redraw() {
        const L = map.leaflet.value;
        const instance = map.map.value;

        if (!L || !instance || !drawLayer.value) {
            return;
        }

        drawLayer.value.clearLayers();
        drawLayer.value.addData(geometry.value);
    }

    /**
     * syncTo() drives two ordinary Nova number fields instead of writing a
     * column itself, which lets a resource adopt the map with no migration.
     */
    function syncSiblingFields() {
        if (!field.syncLatitudeField || !field.syncLongitudeField) {
            return;
        }

        const point = firstPoint(geometry.value);

        Nova.$emit(`${field.syncLatitudeField}-value`, point ? point[0] : "");
        Nova.$emit(`${field.syncLongitudeField}-value`, point ? point[1] : "");
    }

    async function maybeFillAddress() {
        const targets = field.addressTargets || {};
        const point = firstPoint(geometry.value);

        if (!point || Object.keys(targets).length === 0) {
            return;
        }

        try {
            const response = await Nova.request().get(
                "/nova-vendor/nova-field-map/geocode/reverse",
                { params: { latitude: point[0], longitude: point[1] } },
            );

            Object.entries(targets).forEach(([component, attribute]) => {
                const value = response.data.components?.[component];

                if (value !== undefined) {
                    Nova.$emit(`${attribute}-value`, value);
                }
            });
        } catch {
            // Reverse geocoding is a convenience; a failure must not block
            // the pin the user just placed.
        }
    }

    function onGeocoded(result) {
        replaceWithPoint(result.latitude, result.longitude);
        maybeFillAddress();
    }

    function locate() {
        if (!navigator.geolocation) {
            Nova.error(__("Geolocation is not available in this browser."));

            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) =>
                replaceWithPoint(
                    position.coords.latitude,
                    position.coords.longitude,
                ),
            () =>
                Nova.error(__("Geolocation is not available in this browser.")),
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }

    function onManualInput(axis, raw) {
        const point = firstPoint(geometry.value) || [0, 0];
        const value = Number.parseFloat(raw);

        if (Number.isNaN(value)) {
            return;
        }

        replaceWithPoint(
            axis === "lat" ? value : point[0],
            axis === "lng" ? value : point[1],
        );
    }

    function onKeydown(event) {
        const step = field.nudgeStep || 0.0001;
        const point = firstPoint(geometry.value);

        const delta = {
            ArrowUp: [step, 0],
            ArrowDown: [-step, 0],
            ArrowLeft: [0, -step],
            ArrowRight: [0, step],
        }[event.key];

        // Without a marker the arrow keys should still pan the map, which is
        // Leaflet's own default behaviour.
        if (!delta || !point) {
            return;
        }

        event.preventDefault();
        replaceWithPoint(point[0] + delta[0], point[1] + delta[1]);
    }

    function clear() {
        history.value.push(cloneCollection(geometry.value));
        future.value = [];
        geometry.value = { type: "FeatureCollection", features: [] };
        redraw();
        syncSiblingFields();
    }

    function undo() {
        if (!history.value.length) {
            return;
        }

        future.value.push(cloneCollection(geometry.value));
        geometry.value = history.value.pop();
        redraw();
        syncSiblingFields();
    }

    function redo() {
        if (!future.value.length) {
            return;
        }

        history.value.push(cloneCollection(geometry.value));
        geometry.value = future.value.pop();
        redraw();
        syncSiblingFields();
    }

    const point = computed(() => firstPoint(geometry.value));

    return {
        container: map.container,
        error: map.error,
        rangeError,
        geometry,
        latitude: computed(() => point.value?.[0] ?? ""),
        longitude: computed(() => point.value?.[1] ?? ""),
        hasValue: computed(() => geometry.value.features.length > 0),
        canUndo: computed(() => history.value.length > 0),
        canRedo: computed(() => future.value.length > 0),
        serialized: computed(() =>
            geometry.value.features.length === 0
                ? ""
                : JSON.stringify(geometry.value),
        ),
        onGeocoded,
        onManualInput,
        onKeydown,
        locate,
        clear,
        undo,
        redo,
    };
}

function normalize(collection) {
    return {
        type: "FeatureCollection",
        features: (collection?.features || []).filter(
            (feature) => feature.geometry,
        ),
    };
}

function cloneCollection(collection) {
    return normalize(
        collection ? JSON.parse(JSON.stringify(collection)) : undefined,
    );
}

/**
 * @returns {[number, number]|null} latitude and longitude, in that order
 */
function firstPoint(collection) {
    const coordinates = collection?.features?.[0]?.geometry?.coordinates;

    if (!Array.isArray(coordinates)) {
        return null;
    }

    let position = coordinates;

    while (Array.isArray(position[0])) {
        position = position[0];
    }

    return typeof position[0] === "number" ? [position[1], position[0]] : null;
}
