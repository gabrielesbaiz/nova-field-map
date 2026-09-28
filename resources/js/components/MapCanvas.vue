<template>
    <div class="nova-field-map">
        <div
            ref="container"
            class="nova-field-map__canvas"
            :style="{ height: field.height }"
            role="application"
            :aria-label="ariaLabel"
            tabindex="0"
        ></div>

        <p v-if="error" class="nova-field-map__error">
            {{ __("The map could not be loaded.") }}
        </p>

        <MapTimeline
            v-if="field.timelineProperty"
            :field="field"
            @change="setVisibleFeatures"
        />

        <MapFilter
            v-else-if="field.filterProperty"
            :field="field"
            @change="setVisibleFeatures"
        />

        <MapLegend v-if="field.legend" :field="field" />

        <ElevationProfile v-if="field.elevationProfile" :field="field" />

        <MapToolbar
            v-if="showToolbar"
            :field="field"
            :map="map"
            :geo-layer="geoLayer"
        />

        <table v-if="field.accessibleTable" class="sr-only">
            <caption>
                {{
                    ariaLabel
                }}
            </caption>
            <thead>
                <tr>
                    <th scope="col">{{ __("Latitude") }}</th>
                    <th scope="col">{{ __("Longitude") }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(row, index) in accessibleRows" :key="index">
                    <td>{{ row[0] }}</td>
                    <td>{{ row[1] }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useLocalization } from "laravel-nova";
import { useLeafletMap } from "../composables/useLeafletMap";
import ElevationProfile from "./ElevationProfile.vue";
import MapFilter from "./MapFilter.vue";
import MapLegend from "./MapLegend.vue";
import MapTimeline from "./MapTimeline.vue";
import MapToolbar from "./MapToolbar.vue";

const { __ } = useLocalization();

const props = defineProps({
    field: { type: Object, required: true },
    resourceName: { type: String, default: null },
});

const emit = defineEmits(["ready"]);

const { container, map, geoLayer, error, observe, setVisibleFeatures } =
    useLeafletMap(props.field, {
        onFeatureClick(link) {
            // Inertia keeps Nova's SPA navigation intact; a plain href would
            // reload the whole panel.
            Nova.visit(`/resources/${link.resource}/${link.id}`);
        },
        onReady(context) {
            emit("ready", context);
        },
    });

onMounted(observe);

const ariaLabel = computed(() =>
    props.field.name
        ? __("Map of :resource", { resource: props.field.name })
        : __("Locations"),
);

const showToolbar = computed(
    () =>
        props.field.copyable || props.field.deeplinks || props.field.exportData,
);

const accessibleRows = computed(() =>
    (props.field.geojson?.features || [])
        .map((feature) => feature.geometry?.coordinates)
        .filter(
            (coordinates) =>
                Array.isArray(coordinates) && coordinates.length >= 2,
        )
        // GeoJSON is longitude-first; the table reads latitude-first as a
        // person would say it.
        .map(([lng, lat]) => [lat, lng]),
);
</script>

<style scoped>
.nova-field-map__canvas {
    width: 100%;
    border-radius: 0.5rem;
    overflow: hidden;
    background-color: rgb(var(--colors-gray-100));
    z-index: 0;
}

:global(.dark) .nova-field-map__canvas {
    background-color: rgb(var(--colors-gray-800));
}

.nova-field-map__canvas:focus-visible {
    outline: 2px solid rgb(var(--colors-primary-500));
    outline-offset: 2px;
}

.nova-field-map__error {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: rgb(var(--colors-red-500));
}
</style>
