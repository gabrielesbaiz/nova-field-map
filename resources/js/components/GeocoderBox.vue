<template>
    <div class="nova-field-map__geocoder">
        <input
            v-model="query"
            type="search"
            class="w-full form-control form-input form-control-bordered"
            :placeholder="__('Search for a place')"
            autocomplete="off"
            @input="onInput"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="choose(results[highlighted])"
            @keydown.esc="results = []"
        />

        <ul v-if="results.length" class="nova-field-map__results">
            <li
                v-for="(result, index) in results"
                :key="`${result.latitude}-${result.longitude}-${index}`"
                :class="{ 'is-active': index === highlighted }"
                @mousedown.prevent="choose(result)"
            >
                {{ result.label }}
            </li>
        </ul>

        <p v-else-if="searched && !loading" class="nova-field-map__empty">
            {{ __("No results found") }}
        </p>
    </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from "vue";

const emit = defineEmits(["select"]);

const query = ref("");
const results = ref([]);
const highlighted = ref(0);
const loading = ref(false);
const searched = ref(false);

let timer = null;
let controller = null;

onBeforeUnmount(() => {
    clearTimeout(timer);
    controller?.abort();
});

function onInput() {
    clearTimeout(timer);

    if (query.value.trim().length < 2) {
        results.value = [];
        searched.value = false;

        return;
    }

    // Debounced, and the previous request is abandoned: geocoders are rate
    // limited and a keystroke-per-request would exhaust the budget.
    timer = setTimeout(search, 350);
}

async function search() {
    controller?.abort();
    controller = new AbortController();
    loading.value = true;

    try {
        const response = await Nova.request().get(
            "/nova-vendor/nova-field-map/geocode/search",
            { params: { query: query.value }, signal: controller.signal },
        );

        results.value = response.data.results || [];
        highlighted.value = 0;
        searched.value = true;
    } catch (error) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
            results.value = [];
            searched.value = true;
        }
    } finally {
        loading.value = false;
    }
}

function move(delta) {
    if (!results.value.length) {
        return;
    }

    highlighted.value =
        (highlighted.value + delta + results.value.length) %
        results.value.length;
}

function choose(result) {
    if (!result) {
        return;
    }

    emit("select", result);
    query.value = result.label;
    results.value = [];
    searched.value = false;
}
</script>

<style scoped>
.nova-field-map__geocoder {
    position: relative;
}

.nova-field-map__results {
    position: absolute;
    z-index: 10;
    width: 100%;
    margin-top: 0.25rem;
    max-height: 14rem;
    overflow-y: auto;
    border-radius: 0.5rem;
    border: 1px solid rgb(var(--colors-gray-200));
    background-color: rgb(var(--colors-white));
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

:global(.dark) .nova-field-map__results {
    background-color: rgb(var(--colors-gray-800));
    border-color: rgb(var(--colors-gray-700));
}

.nova-field-map__results li {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    cursor: pointer;
}

.nova-field-map__results li:hover,
.nova-field-map__results li.is-active {
    background-color: rgb(var(--colors-primary-500));
    color: rgb(var(--colors-white));
}

.nova-field-map__empty {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: rgb(var(--colors-gray-400));
}
</style>
