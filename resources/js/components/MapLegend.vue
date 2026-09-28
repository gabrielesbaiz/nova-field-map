<template>
    <div v-if="entries.length" class="nova-field-map__legend">
        <span
            v-for="entry in entries"
            :key="entry.label"
            class="nova-field-map__legend-entry"
        >
            <i :style="{ backgroundColor: entry.color }"></i>
            {{ entry.label }}
        </span>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { buildScale, categoryColor } from "../support/scales";

const props = defineProps({
    field: { type: Object, required: true },
});

/**
 * A choropleth legend reads as value ranges; a filtered map reads as
 * categories. Both are derived from the same features, so one component
 * covers them.
 */
const entries = computed(() => {
    const features = props.field.geojson?.features || [];

    if (props.field.choroplethProperty) {
        const scale = buildScale(
            features,
            props.field.choroplethProperty,
            props.field.choroplethScale,
        );

        if (!scale) {
            return [];
        }

        return scale.breaks.map((value, index) => ({
            color: scale.colors[index],
            label:
                index + 1 < scale.breaks.length
                    ? `${format(value)} – ${format(scale.breaks[index + 1])}`
                    : `${format(value)} +`,
        }));
    }

    if (props.field.filterProperty) {
        return categories(features, props.field.filterProperty).map(
            (label, index) => ({ label, color: categoryColor(index) }),
        );
    }

    return [];
});

function categories(features, property) {
    return [
        ...new Set(
            features
                .map((feature) => feature.properties?.[property])
                .filter((value) => value !== undefined && value !== null)
                .map(String),
        ),
    ].sort();
}

function format(value) {
    return Number.isInteger(value) ? value : Number(value).toFixed(1);
}
</script>

<style scoped>
.nova-field-map__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: rgb(var(--colors-gray-500));
}

.nova-field-map__legend-entry {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}

.nova-field-map__legend-entry i {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 0.125rem;
    display: inline-block;
}
</style>
