<template>
    <div class="nova-field-map__toolbar">
        <button
            v-if="field.copyable && coordinates"
            type="button"
            class="nova-field-map__button"
            @click="copy"
        >
            {{ copied ? __("Copied") : __("Copy coordinates") }}
        </button>

        <template v-if="field.deeplinks && coordinates">
            <a
                v-for="target in deeplinks"
                :key="target.label"
                class="nova-field-map__button"
                :href="target.url"
                target="_blank"
                rel="noopener noreferrer"
            >
                {{ __("Open in :provider", { provider: target.label }) }}
            </a>
        </template>

        <button
            v-if="field.exportData && hasFeatures"
            type="button"
            class="nova-field-map__button"
            @click="download('geojson')"
        >
            {{ __("Download GeoJSON") }}
        </button>

        <button
            v-if="field.exportData && hasFeatures"
            type="button"
            class="nova-field-map__button"
            @click="download('gpx')"
        >
            {{ __("Download GPX") }}
        </button>
    </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { toGpx } from "../support/export";

const props = defineProps({
    field: { type: Object, required: true },
    map: { type: Object, default: null },
    geoLayer: { type: Object, default: null },
});

const copied = ref(false);

const coordinates = computed(() =>
    props.field.latitude === null || props.field.latitude === undefined
        ? null
        : [props.field.latitude, props.field.longitude],
);

const hasFeatures = computed(
    () => (props.field.geojson?.features || []).length > 0,
);

const deeplinks = computed(() => {
    if (!coordinates.value) {
        return [];
    }

    const [lat, lng] = coordinates.value;

    return [
        {
            label: "Google Maps",
            url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        },
        {
            label: "Apple Maps",
            url: `https://maps.apple.com/?ll=${lat},${lng}`,
        },
        {
            label: "OpenStreetMap",
            url: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`,
        },
        {
            label: "Waze",
            url: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
        },
    ];
});

async function copy() {
    const text =
        props.field.formattedCoordinates || coordinates.value.join(", ");

    try {
        await navigator.clipboard.writeText(text);
    } catch {
        // Clipboard access is denied in some embedded contexts; falling back
        // to a selection is better than the button doing nothing at all.
        const input = document.createElement("textarea");
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
    }

    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
}

function download(format) {
    const name = (props.field.attribute || "map") + "." + format;
    const content =
        format === "gpx"
            ? toGpx(props.field.geojson)
            : JSON.stringify(props.field.geojson, null, 2);

    const blob = new Blob([content], {
        type: format === "gpx" ? "application/gpx+xml" : "application/geo+json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<style scoped>
.nova-field-map__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.nova-field-map__button {
    font-size: 0.75rem;
    line-height: 1.25rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    border: 1px solid rgb(var(--colors-gray-300));
    color: rgb(var(--colors-gray-600));
    background: transparent;
    cursor: pointer;
}

.nova-field-map__button:hover {
    color: rgb(var(--colors-primary-500));
    border-color: rgb(var(--colors-primary-500));
}

:global(.dark) .nova-field-map__button {
    border-color: rgb(var(--colors-gray-700));
    color: rgb(var(--colors-gray-400));
}
</style>
