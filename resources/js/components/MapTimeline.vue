<template>
    <div class="nova-field-map__timeline">
        <button type="button" class="nova-field-map__button" @click="toggle">
            {{ playing ? __("Pause") : __("Play") }}
        </button>

        <input
            v-model.number="index"
            type="range"
            min="0"
            :max="stops.length - 1"
            class="nova-field-map__slider"
            :aria-label="field.timelineProperty"
        />

        <span class="nova-field-map__timeline-label">{{ currentLabel }}</span>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
    field: { type: Object, required: true },
});

const emit = defineEmits(["change"]);

const index = ref(0);
const playing = ref(false);

let timer = null;

/**
 * The distinct timestamps present in the data, in order. Using the values
 * themselves rather than an even time axis keeps every step meaningful, even
 * when the records are unevenly spaced.
 */
const stops = computed(() => {
    const property = props.field.timelineProperty;

    return [
        ...new Set(
            (props.field.geojson?.features || [])
                .map((feature) => feature.properties?.[property])
                .filter(Boolean)
                .map(String),
        ),
    ].sort();
});

const currentLabel = computed(() => stops.value[index.value] || "");

// Features at or before the current stop, so the map accumulates rather than
// flashing one moment at a time.
const visible = computed(() => {
    const property = props.field.timelineProperty;
    const cutoff = stops.value[index.value];

    if (!cutoff) {
        return props.field.geojson?.features || [];
    }

    return (props.field.geojson?.features || []).filter(
        (feature) => String(feature.properties?.[property] ?? "") <= cutoff,
    );
});

watch(visible, (features) => emit("change", features), { immediate: true });

function toggle() {
    playing.value = !playing.value;

    if (!playing.value) {
        clearInterval(timer);

        return;
    }

    // Restarting from the beginning when already at the end is what a play
    // button is expected to do.
    if (index.value >= stops.value.length - 1) {
        index.value = 0;
    }

    timer = setInterval(() => {
        if (index.value >= stops.value.length - 1) {
            clearInterval(timer);
            playing.value = false;

            return;
        }

        index.value += 1;
    }, 700);
}

onBeforeUnmount(() => clearInterval(timer));
</script>

<style scoped>
.nova-field-map__timeline {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.nova-field-map__slider {
    flex: 1;
}

.nova-field-map__timeline-label {
    font-size: 0.75rem;
    color: rgb(var(--colors-gray-500));
    min-width: 6rem;
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
