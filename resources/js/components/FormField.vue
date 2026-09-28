<template>
    <DefaultField
        :field="field"
        :errors="errors"
        :show-help-text="showHelpText"
        :full-width-content="fullWidthContent"
    >
        <template #field>
            <GeocoderBox
                v-if="field.geocoder"
                class="mb-2"
                @select="onGeocoded"
            />

            <div
                ref="container"
                class="nova-field-map__canvas"
                :style="{ height: field.height }"
                role="application"
                :aria-label="field.name"
                tabindex="0"
                @keydown="onKeydown"
            ></div>

            <p v-if="error" class="mt-2 text-sm text-red-500">
                {{ __("The map could not be loaded.") }}
            </p>

            <div class="nova-field-map__form-controls">
                <button
                    v-if="field.geolocation"
                    type="button"
                    class="nova-field-map__button"
                    @click="locate"
                >
                    {{ __("Use my location") }}
                </button>

                <button
                    v-if="hasValue"
                    type="button"
                    class="nova-field-map__button"
                    @click="clear"
                >
                    {{ __("Clear location") }}
                </button>

                <button
                    v-if="canUndo"
                    type="button"
                    class="nova-field-map__button"
                    @click="undo"
                >
                    {{ __("Undo") }}
                </button>

                <button
                    v-if="canRedo"
                    type="button"
                    class="nova-field-map__button"
                    @click="redo"
                >
                    {{ __("Redo") }}
                </button>
            </div>

            <div
                v-if="field.manualInputs && field.singleShape"
                class="nova-field-map__inputs"
            >
                <label class="nova-field-map__input">
                    <span>{{ __("Latitude") }}</span>
                    <input
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        class="w-full form-control form-input form-control-bordered"
                        :value="latitude"
                        @change="onManualInput('lat', $event.target.value)"
                    />
                </label>

                <label class="nova-field-map__input">
                    <span>{{ __("Longitude") }}</span>
                    <input
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        class="w-full form-control form-input form-control-bordered"
                        :value="longitude"
                        @change="onManualInput('lng', $event.target.value)"
                    />
                </label>
            </div>

            <p v-if="rangeError" class="mt-1 text-sm text-red-500">
                {{ rangeError }}
            </p>
        </template>
    </DefaultField>
</template>

<script>
import { DependentFormField, HandlesValidationErrors } from "laravel-nova";
import GeocoderBox from "./GeocoderBox.vue";
import { useEditableMap } from "../composables/useEditableMap";

export default {
    mixins: [DependentFormField, HandlesValidationErrors],

    components: { GeocoderBox },

    props: ["resourceName", "resourceId", "field"],

    setup(props) {
        return useEditableMap(props.field);
    },

    methods: {
        /*
         * Set the initial, internal value for the field.
         */
        setInitialValue() {
            this.value = this.field.value || "";
        },

        /**
         * Fill the given FormData object with the field's internal value.
         *
         * syncTo() fields write nothing: the two number fields they drive
         * own their columns, and sending a value here would overwrite them.
         */
        fill(formData) {
            if (this.field.storeAs === "none") {
                return;
            }

            formData.append(this.fieldAttribute, this.serialized || "");
        },
    },
};
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

.nova-field-map__form-controls {
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

.nova-field-map__inputs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    margin-top: 0.75rem;
}

.nova-field-map__input span {
    display: block;
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
    color: rgb(var(--colors-gray-500));
}
</style>
