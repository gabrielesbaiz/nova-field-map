<template>
    <div v-if="categories.length > 1" class="nova-field-map__filter">
        <label
            v-for="(category, index) in categories"
            :key="category"
            class="nova-field-map__filter-entry"
        >
            <input
                type="checkbox"
                :checked="active.has(category)"
                @change="toggle(category)"
            />
            <i :style="{ backgroundColor: categoryColor(index) }"></i>
            {{ category }}
        </label>
    </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { categoryColor } from "../support/scales";

const props = defineProps({
    field: { type: Object, required: true },
});

const emit = defineEmits(["change"]);

/**
 * One checkbox per distinct value of the chosen property, derived from the
 * data rather than configured, so a new category needs no code change.
 */
const categories = computed(() =>
    [
        ...new Set(
            (props.field.geojson?.features || [])
                .map(
                    (feature) =>
                        feature.properties?.[props.field.filterProperty],
                )
                .filter((value) => value !== undefined && value !== null)
                .map(String),
        ),
    ].sort(),
);

const active = ref(new Set(categories.value));

watch(categories, (next) => {
    active.value = new Set(next);
});

watch(
    active,
    (selected) => {
        emit(
            "change",
            (props.field.geojson?.features || []).filter((feature) =>
                selected.has(
                    String(feature.properties?.[props.field.filterProperty]),
                ),
            ),
        );
    },
    { deep: true, immediate: true },
);

function toggle(category) {
    // Replaced rather than mutated: a Set mutated in place does not trip the
    // watcher, even a deep one.
    const next = new Set(active.value);

    next.has(category) ? next.delete(category) : next.add(category);
    active.value = next;
}
</script>

<style scoped>
.nova-field-map__filter {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: rgb(var(--colors-gray-500));
}

.nova-field-map__filter-entry {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    cursor: pointer;
}

.nova-field-map__filter-entry i {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 0.125rem;
    display: inline-block;
}
</style>
