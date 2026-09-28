<template>
    <PanelItem :index="index" :field="field">
        <template #value>
            <p v-if="!hasFeatures && !field.center" class="text-gray-400">
                {{ __("No location set") }}
            </p>

            <MapCanvas :field="field" :resource-name="resourceName" />
        </template>
    </PanelItem>
</template>

<script setup>
import { computed } from "vue";
import MapCanvas from "./MapCanvas.vue";

const props = defineProps({
    index: { type: Number, default: 0 },
    resource: { type: Object, default: null },
    resourceName: { type: String, default: null },
    resourceId: { type: [Number, String], default: null },
    field: { type: Object, required: true },
});

const hasFeatures = computed(
    () => (props.field.geojson?.features || []).length > 0,
);
</script>
