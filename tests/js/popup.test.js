import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import {
    collectionOf,
    makeField,
    mockChunks,
    pointFeature,
    tick,
} from "./helpers";

mockChunks();

const MapCanvas = (await import("../../resources/js/components/MapCanvas.vue"))
    .default;

function mountWithPopup(popup, overrides = {}) {
    const field = makeField({
        geojson: collectionOf(
            pointFeature(13.7768, 45.6495, { __popup: popup }),
        ),
        bounds: [
            [45.6495, 13.7768],
            [45.6495, 13.7768],
        ],
        featureCount: 1,
        ...overrides,
    });

    return mount(MapCanvas, {
        props: { field },
        global: { stubs: { MapToolbar: true } },
        attachTo: document.body,
    });
}

describe("popup safety", () => {
    it("renders escaped content as text, never as markup", async () => {
        // PHP escaped this; Leaflet's bindPopup would still interpret a
        // string as HTML, so it is handed a text node instead.
        const wrapper = mountWithPopup({
            content: "&lt;img src=x onerror=alert(1)&gt;",
            html: false,
        });

        await tick();
        await wrapper.find(".leaflet-marker-icon").trigger("click");
        await tick();

        const popup = document.querySelector(".leaflet-popup-content");

        expect(popup.querySelector("img")).toBeNull();
        expect(popup.textContent).toContain("<img src=x onerror=alert(1)>");

        wrapper.unmount();
    });

    it("sanitizes markup a field explicitly allowed", async () => {
        const wrapper = mountWithPopup({
            content: '<b>Warehouse</b><img src=x onerror="alert(1)">',
            html: true,
        });

        await tick(6);
        await wrapper.find(".leaflet-marker-icon").trigger("click");
        await tick(6);

        const popup = document.querySelector(".leaflet-popup-content");

        expect(popup.innerHTML).toContain("<b>Warehouse</b>");
        expect(popup.innerHTML).not.toContain("onerror");

        wrapper.unmount();
    });

    it("binds a tooltip as text", async () => {
        const field = makeField({
            geojson: collectionOf(
                pointFeature(13.7768, 45.6495, {
                    __tooltip: "&lt;b&gt;Warehouse&lt;/b&gt;",
                }),
            ),
            bounds: [
                [45.6495, 13.7768],
                [45.6495, 13.7768],
            ],
            featureCount: 1,
        });

        const wrapper = mount(MapCanvas, {
            props: { field },
            global: { stubs: { MapToolbar: true } },
            attachTo: document.body,
        });

        await tick();

        expect(wrapper.find(".leaflet-marker-icon").attributes("alt")).toContain(
            "Warehouse",
        );

        wrapper.unmount();
    });
});
