<template>
    <span class="nova-field-map__index">
        <img
            v-if="field.snapshotUrl"
            :src="field.snapshotUrl"
            :alt="field.formattedCoordinates || ''"
            class="nova-field-map__snapshot"
            loading="lazy"
            decoding="async"
        />

        <MapCanvas v-else-if="field.thumbnail" :field="thumbnailField" />

        <span v-else-if="field.formattedCoordinates">
            {{ field.formattedCoordinates }}
        </span>

        <span v-else class="text-gray-400">&mdash;</span>
    </span>
</template>

<script setup>
import { computed } from "vue";
import MapCanvas from "./MapCanvas.vue";

const props = defineProps({
    resourceName: { type: String, default: null },
    field: { type: Object, required: true },
});

/**
 * An index cell is small and there may be fifty of them, so the live
 * thumbnail drops every control and interaction and renders only the shape.
 */
const thumbnailField = computed(() => ({
    ...props.field,
    height: "80px",
    copyable: false,
    deeplinks: false,
    exportData: false,
    accessibleTable: false,
    scrollWheelZoom: false,
}));
</script>

<style scoped>
.nova-field-map__index {
    display: inline-block;
    min-width: 6rem;
}

.nova-field-map__snapshot {
    border-radius: 0.375rem;
    max-width: 100%;
    height: auto;
}
</style>
