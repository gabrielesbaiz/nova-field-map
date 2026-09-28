<template>
    <div class="nova-field-map__bounds-filter">
        <div
            ref="container"
            class="nova-field-map__bounds-canvas"
            role="application"
            :aria-label="filter.name"
        ></div>

        <div class="nova-field-map__bounds-actions">
            <button
                type="button"
                class="nova-field-map__button"
                @click="useCurrentView"
            >
                {{ __("Locations") }}
            </button>

            <button
                v-if="value"
                type="button"
                class="nova-field-map__button"
                @click="clear"
            >
                {{ __("Clear location") }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { loadCore } from "../composables/useLazyChunks";

const props = defineProps({
    resourceName: { type: String, required: true },
    filterKey: { type: String, required: true },
    lens: { type: String, default: "" },
});

const store = Nova.store ?? null;
const container = ref(null);

let map = null;

const filter = computed(
    () =>
        store?.getters[`${props.resourceName}/getFilter`]?.(props.filterKey) ??
        {},
);

const value = computed(() => filter.value.currentValue || "");

/**
 * The filter travels as "south,west,north,east" so it survives Nova's query
 * string round trip; the map is only a way of choosing those four numbers.
 */
onMounted(async () => {
    const { L } = await loadCore(filter.value);

    if (!container.value) {
        return;
    }

    map = L.map(container.value, {
        zoomControl: true,
        attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
        maxZoom: 19,
    }).addTo(map);

    const existing = parse(value.value);

    if (existing) {
        map.fitBounds(existing);
    } else {
        map.setView(filter.value.center || [0, 0], filter.value.zoom || 2);
    }
});

function useCurrentView() {
    if (!map) {
        return;
    }

    const bounds = map.getBounds();

    emitChange(
        [
            bounds.getSouth(),
            bounds.getWest(),
            bounds.getNorth(),
            bounds.getEast(),
        ]
            .map((value) => value.toFixed(6))
            .join(","),
    );
}

function clear() {
    emitChange("");
}

function emitChange(next) {
    store?.commit(`${props.resourceName}/updateFilterState`, {
        filterClass: props.filterKey,
        value: next,
    });

    Nova.$emit("filter-changed");
}

function parse(raw) {
    const parts = String(raw).split(",").map(Number);

    return parts.length === 4 && parts.every(Number.isFinite)
        ? [
              [parts[0], parts[1]],
              [parts[2], parts[3]],
          ]
        : null;
}
</script>

<style scoped>
.nova-field-map__bounds-filter {
    padding: 0.75rem;
}

.nova-field-map__bounds-canvas {
    height: 180px;
    border-radius: 0.375rem;
    overflow: hidden;
}

.nova-field-map__bounds-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.nova-field-map__button {
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    border: 1px solid rgb(var(--colors-gray-300));
    background: transparent;
    cursor: pointer;
}
</style>
