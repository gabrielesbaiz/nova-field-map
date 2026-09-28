<template>
    <figure v-if="points.length > 1" class="nova-field-map__elevation">
        <svg
            :viewBox="`0 0 ${width} ${height}`"
            preserveAspectRatio="none"
            role="img"
            :aria-label="label"
        >
            <path :d="area" class="nova-field-map__elevation-area" />
            <path :d="line" class="nova-field-map__elevation-line" />
        </svg>

        <figcaption>
            {{ __("Elevation") }}: {{ Math.round(min) }}–{{ Math.round(max) }} m
            <template v-if="distance"
                >· {{ __("Distance") }}: {{ distance }}</template
            >
        </figcaption>
    </figure>
</template>

<script setup>
import { computed } from "vue";
import { useLocalization } from "laravel-nova";
import { formatDistance, haversine } from "../support/scales";

const { __ } = useLocalization();

const props = defineProps({
    field: { type: Object, required: true },
});

const width = 600;
const height = 80;

/**
 * GeoJSON positions may carry a third element, the elevation in metres. Only
 * features that actually have one are charted.
 */
const points = computed(() => {
    const collected = [];

    (props.field.geojson?.features || []).forEach((feature) => {
        flatten(feature.geometry?.coordinates).forEach((position) => {
            if (position.length >= 3 && Number.isFinite(position[2])) {
                collected.push(position);
            }
        });
    });

    return collected;
});

const elevations = computed(() => points.value.map((position) => position[2]));
const min = computed(() => Math.min(...elevations.value));
const max = computed(() => Math.max(...elevations.value));

const distance = computed(() => {
    if (points.value.length < 2) {
        return null;
    }

    let total = 0;

    for (let index = 1; index < points.value.length; index += 1) {
        const [lngA, latA] = points.value[index - 1];
        const [lngB, latB] = points.value[index];

        total += haversine([latA, lngA], [latB, lngB]);
    }

    return formatDistance(total);
});

const coordinates = computed(() => {
    // A flat profile would divide by zero; drawing it mid-height is the
    // honest rendering of "no variation".
    const span = max.value - min.value || 1;

    return elevations.value.map((value, index) => [
        (index / (elevations.value.length - 1)) * width,
        height - ((value - min.value) / span) * (height - 4) - 2,
    ]);
});

const line = computed(() =>
    coordinates.value
        .map(
            ([x, y], index) =>
                `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`,
        )
        .join(" "),
);

const area = computed(() => `${line.value} L${width},${height} L0,${height} Z`);

const label = computed(
    () =>
        `${__("Elevation")} ${Math.round(min.value)}–${Math.round(max.value)} m`,
);

function flatten(coordinates) {
    if (!Array.isArray(coordinates)) {
        return [];
    }

    if (typeof coordinates[0] === "number") {
        return [coordinates];
    }

    return coordinates.flatMap(flatten);
}
</script>

<style scoped>
.nova-field-map__elevation {
    margin-top: 0.5rem;
}

.nova-field-map__elevation svg {
    width: 100%;
    height: 5rem;
    display: block;
}

.nova-field-map__elevation-area {
    fill: rgb(37 99 235 / 0.15);
}

.nova-field-map__elevation-line {
    fill: none;
    stroke: #2563eb;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
}

.nova-field-map__elevation figcaption {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: rgb(var(--colors-gray-500));
}
</style>
