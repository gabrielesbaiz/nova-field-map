import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import {
    collectionOf,
    makeField,
    mockChunks,
    pointFeature,
    tick,
} from "./helpers";

mockChunks();

const FormField = (await import("../../resources/js/components/FormField.vue"))
    .default;

function mountForm(overrides = {}) {
    const field = makeField({
        editable: true,
        shapes: [],
        manualInputs: true,
        geolocation: true,
        singleShape: true,
        nudgeStep: 0.5,
        ...overrides,
    });

    return mount(FormField, {
        props: { field, resourceName: "places", resourceId: 1 },
        global: {
            stubs: {
                DefaultField: {
                    template: "<div><slot name='field' /></div>",
                },
                GeocoderBox: true,
            },
        },
        attachTo: document.body,
    });
}

function formDataFrom(wrapper) {
    const data = new FormData();
    wrapper.vm.fill(data);

    return data;
}

describe("editable form field", () => {
    it("submits the geometry it was resolved with", async () => {
        const wrapper = mountForm({
            geojson: collectionOf(pointFeature(13.7768, 45.6495)),
            featureCount: 1,
        });

        await tick();

        const submitted = JSON.parse(formDataFrom(wrapper).get("location"));

        expect(submitted.features[0].geometry.coordinates).toEqual([
            13.7768, 45.6495,
        ]);

        wrapper.unmount();
    });

    it("shows the coordinates latitude first in the manual inputs", async () => {
        const wrapper = mountForm({
            geojson: collectionOf(pointFeature(13.7768, 45.6495)),
            featureCount: 1,
        });

        await tick();

        const inputs = wrapper.findAll("input[type='number']");

        expect(inputs[0].element.value).toBe("45.6495");
        expect(inputs[1].element.value).toBe("13.7768");

        wrapper.unmount();
    });

    it("rejects a latitude outside the valid range", async () => {
        const wrapper = mountForm({
            geojson: collectionOf(pointFeature(13.7768, 45.6495)),
            featureCount: 1,
        });

        await tick();

        // setValue() fires input, which Vue answers by rewriting the bound
        // value; the change handler must see the raw typed text instead.
        const latitude = wrapper.findAll("input[type='number']")[0];
        latitude.element.value = "120";
        await latitude.trigger("change");
        await tick();

        expect(wrapper.text()).toContain("Latitude must be between -90 and 90.");

        // The previous, valid point must survive a rejected edit.
        const submitted = JSON.parse(formDataFrom(wrapper).get("location"));
        expect(submitted.features[0].geometry.coordinates).toEqual([
            13.7768, 45.6495,
        ]);

        wrapper.unmount();
    });

    it("nudges the marker with the arrow keys", async () => {
        const wrapper = mountForm({
            geojson: collectionOf(pointFeature(13.0, 45.0)),
            featureCount: 1,
        });

        await tick();

        await wrapper
            .find(".nova-field-map__canvas")
            .trigger("keydown", { key: "ArrowUp" });
        await tick();

        const submitted = JSON.parse(formDataFrom(wrapper).get("location"));

        expect(submitted.features[0].geometry.coordinates[1]).toBeCloseTo(45.5, 5);

        wrapper.unmount();
    });

    it("clears the value and can undo the clear", async () => {
        const wrapper = mountForm({
            geojson: collectionOf(pointFeature(13.0, 45.0)),
            featureCount: 1,
        });

        await tick();

        await wrapper.findAll("button").at(-1).trigger("click");
        await tick();

        expect(formDataFrom(wrapper).get("location")).toBe("");

        const undo = wrapper
            .findAll("button")
            .find((button) => button.text() === "Undo");
        await undo.trigger("click");
        await tick();

        expect(formDataFrom(wrapper).get("location")).not.toBe("");

        wrapper.unmount();
    });

    it("writes nothing when it only syncs other fields", async () => {
        // syncTo() leaves the columns to the two number fields that own them.
        const wrapper = mountForm({
            storeAs: "none",
            syncLatitudeField: "lat",
            syncLongitudeField: "lng",
            geojson: collectionOf(pointFeature(13.0, 45.0)),
            featureCount: 1,
        });

        await tick();

        expect(formDataFrom(wrapper).has("location")).toBe(false);

        wrapper.unmount();
    });

    it("emits sibling field values when syncing", async () => {
        const wrapper = mountForm({
            storeAs: "none",
            syncLatitudeField: "lat",
            syncLongitudeField: "lng",
            geojson: collectionOf(pointFeature(13.0, 45.0)),
            featureCount: 1,
        });

        await tick();

        Nova.$emit.mockClear();

        await wrapper
            .find(".nova-field-map__canvas")
            .trigger("keydown", { key: "ArrowRight" });
        await tick();

        const emitted = Nova.$emit.mock.calls.map(([event]) => event);

        expect(emitted).toContain("lat-value");
        expect(emitted).toContain("lng-value");

        wrapper.unmount();
    });

    it("reports when geolocation is unavailable", async () => {
        const wrapper = mountForm();
        await tick();

        const locate = wrapper
            .findAll("button")
            .find((button) => button.text() === "Use my location");

        await locate.trigger("click");

        expect(Nova.error).toHaveBeenCalled();

        wrapper.unmount();
    });
});
