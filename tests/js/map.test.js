import { beforeEach, describe, expect, it, vi } from "vitest";
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

function mountMap(field) {
    return mount(MapCanvas, {
        props: { field },
        global: { stubs: { MapToolbar: true } },
        attachTo: document.body,
    });
}

describe("map rendering", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders without throwing when the record has no geometry", async () => {
        // 2.x called fitBounds on an empty layer here, which throws
        // "Bounds are not valid" and left a blank panel.
        const wrapper = mountMap(makeField());
        await tick();

        expect(wrapper.find(".leaflet-container").exists()).toBe(true);
        wrapper.unmount();
    });

    it("adds exactly one layer control", async () => {
        const field = makeField({
            tiles: [
                {
                    key: "osm",
                    label: "OpenStreetMap",
                    url: "https://a.test/{z}/{x}/{y}.png",
                    attribution: "",
                    maxZoom: 20,
                    dark: false,
                    mutant: false,
                },
                {
                    key: "carto-light",
                    label: "Light",
                    url: "https://b.test/{z}/{x}/{y}.png",
                    attribution: "",
                    maxZoom: 20,
                    dark: false,
                    mutant: false,
                },
            ],
        });

        const wrapper = mountMap(field);
        await tick();

        // 2.x ran the same L.control.layers(...).addTo(map) twice and
        // rendered two stacked switchers.
        expect(wrapper.findAll(".leaflet-control-layers")).toHaveLength(1);
        wrapper.unmount();
    });

    it("omits the layer control when there is only one layer", async () => {
        const wrapper = mountMap(makeField());
        await tick();

        expect(wrapper.findAll(".leaflet-control-layers")).toHaveLength(0);
        wrapper.unmount();
    });

    it("releases the map and its observers on unmount", async () => {
        const wrapper = mountMap(
            makeField({
                geojson: collectionOf(pointFeature(13.7768, 45.6495)),
                bounds: [
                    [45.6495, 13.7768],
                    [45.6495, 13.7768],
                ],
                featureCount: 1,
            }),
        );

        await tick();

        const container = wrapper.find(".nova-field-map__canvas").element;

        expect(container._leaflet_id).toBeDefined();

        wrapper.unmount();
        await tick();

        // Leaflet clears this when remove() runs. Nova is an Inertia SPA, so
        // without it every navigation left a live map on detached DOM.
        expect(container._leaflet_id).toBeUndefined();
    });

    it("keeps marker icons separate between two fields on one page", async () => {
        // 2.x mutated L.Icon.Default.prototype, which is process-global, so
        // the second field silently restyled the first.
        const first = mountMap(
            makeField({
                markerIcon: "/images/first.png",
                geojson: collectionOf(pointFeature(13.7768, 45.6495)),
                bounds: [
                    [45.6495, 13.7768],
                    [45.6495, 13.7768],
                ],
                featureCount: 1,
            }),
        );

        const second = mountMap(
            makeField({
                markerIcon: "/images/second.png",
                geojson: collectionOf(pointFeature(14.0, 46.0)),
                bounds: [
                    [46.0, 14.0],
                    [46.0, 14.0],
                ],
                featureCount: 1,
            }),
        );

        await tick(5);

        const src = (wrapper) =>
            wrapper.find(".leaflet-marker-icon").attributes("src");

        expect(src(first)).toContain("first.png");
        expect(src(second)).toContain("second.png");

        first.unmount();
        second.unmount();
    });

    it("renders a marker for each feature", async () => {
        const wrapper = mountMap(
            makeField({
                geojson: collectionOf(
                    pointFeature(13.0, 45.0),
                    pointFeature(14.0, 46.0),
                ),
                bounds: [
                    [45.0, 13.0],
                    [46.0, 14.0],
                ],
                featureCount: 2,
            }),
        );

        await tick();

        expect(wrapper.findAll(".leaflet-marker-icon")).toHaveLength(2);
        wrapper.unmount();
    });

    it("exposes an accessible table when asked", async () => {
        const wrapper = mountMap(
            makeField({
                accessibleTable: true,
                geojson: collectionOf(pointFeature(13.7768, 45.6495)),
                bounds: [
                    [45.6495, 13.7768],
                    [45.6495, 13.7768],
                ],
                featureCount: 1,
            }),
        );

        await tick();

        const cells = wrapper.findAll("tbody td").map((cell) => cell.text());

        // Latitude first, as a person would read it aloud.
        expect(cells).toEqual(["45.6495", "13.7768"]);
        wrapper.unmount();
    });

    it("labels the map for assistive technology", async () => {
        const wrapper = mountMap(makeField({ name: "Warehouse" }));
        await tick();

        const canvas = wrapper.find(".nova-field-map__canvas");

        expect(canvas.attributes("role")).toBe("application");
        expect(canvas.attributes("aria-label")).toBe("Map of Warehouse");
        wrapper.unmount();
    });
});
