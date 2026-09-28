import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { collectionOf, makeField, pointFeature, tick } from "./helpers";
import { buildScale, formatDistance, haversine } from "../../resources/js/support/scales";
import ElevationProfile from "../../resources/js/components/ElevationProfile.vue";
import MapFilter from "../../resources/js/components/MapFilter.vue";
import MapLegend from "../../resources/js/components/MapLegend.vue";
import MapTimeline from "../../resources/js/components/MapTimeline.vue";

function withProperties(...values) {
    return collectionOf(
        ...values.map((properties, index) =>
            pointFeature(13 + index, 45 + index, properties),
        ),
    );
}

describe("choropleth scale", () => {
    it("assigns darker colours to higher values", () => {
        const features = [10, 20, 30, 40, 50].map((population) => ({
            properties: { population },
        }));

        const scale = buildScale(features, "population", "quantile");

        expect(scale.colorFor(10)).not.toBe(scale.colorFor(50));
        expect(scale.breaks).toHaveLength(5);
    });

    it("collapses to a single colour when every value matches", () => {
        const features = [7, 7, 7].map((value) => ({ properties: { value } }));
        const scale = buildScale(features, "value");

        expect(scale.breaks).toHaveLength(1);
    });

    it("returns null when no feature carries the property", () => {
        expect(buildScale([{ properties: {} }], "missing")).toBeNull();
    });

    it("marks unreadable values with a neutral colour", () => {
        const scale = buildScale(
            [{ properties: { v: 1 } }, { properties: { v: 9 } }],
            "v",
        );

        expect(scale.colorFor("not a number")).toBe("#d1d5db");
    });
});

describe("distance", () => {
    it("measures a great circle rather than a straight line", () => {
        // Trieste to Venice, about 115 km.
        const metres = haversine([45.6495, 13.7768], [45.4408, 12.3155]);

        expect(metres).toBeGreaterThan(110000);
        expect(metres).toBeLessThan(125000);
    });

    it("switches unit at a kilometre", () => {
        expect(formatDistance(850)).toBe("850 m");
        expect(formatDistance(1500)).toBe("1.50 km");
    });
});

describe("legend", () => {
    it("lists value ranges for a choropleth", () => {
        const wrapper = mount(MapLegend, {
            props: {
                field: makeField({
                    choroplethProperty: "population",
                    choroplethScale: "linear",
                    geojson: withProperties(
                        { population: 10 },
                        { population: 50 },
                        { population: 90 },
                    ),
                }),
            },
        });

        expect(wrapper.findAll(".nova-field-map__legend-entry").length).toBeGreaterThan(1);
    });

    it("lists categories when the map is filterable", () => {
        const wrapper = mount(MapLegend, {
            props: {
                field: makeField({
                    filterProperty: "status",
                    geojson: withProperties(
                        { status: "open" },
                        { status: "closed" },
                    ),
                }),
            },
        });

        expect(wrapper.text()).toContain("open");
        expect(wrapper.text()).toContain("closed");
    });

    it("renders nothing when neither applies", () => {
        const wrapper = mount(MapLegend, { props: { field: makeField() } });

        expect(wrapper.find(".nova-field-map__legend").exists()).toBe(false);
    });
});

describe("filter", () => {
    it("emits only the features whose category is still checked", async () => {
        const wrapper = mount(MapFilter, {
            props: {
                field: makeField({
                    filterProperty: "status",
                    geojson: withProperties(
                        { status: "open" },
                        { status: "closed" },
                    ),
                }),
            },
        });

        await tick();
        await wrapper.findAll("input[type='checkbox']")[0].trigger("change");
        await tick();

        const last = wrapper.emitted("change").at(-1)[0];

        expect(last).toHaveLength(1);
        expect(last[0].properties.status).toBe("open");
    });
});

describe("timeline", () => {
    it("accumulates features up to the selected moment", async () => {
        const wrapper = mount(MapTimeline, {
            props: {
                field: makeField({
                    timelineProperty: "seen_at",
                    geojson: withProperties(
                        { seen_at: "2026-01-01" },
                        { seen_at: "2026-02-01" },
                        { seen_at: "2026-03-01" },
                    ),
                }),
            },
            global: { mocks: { __: (key) => key } },
        });

        await tick();

        // The slider starts at the earliest moment, so only the first record
        // should be on the map.
        expect(wrapper.emitted("change").at(-1)[0]).toHaveLength(1);

        await wrapper.find("input[type='range']").setValue(2);
        await tick();

        expect(wrapper.emitted("change").at(-1)[0]).toHaveLength(3);
    });
});

describe("elevation profile", () => {
    it("charts positions that carry a third coordinate", () => {
        const wrapper = mount(ElevationProfile, {
            props: {
                field: makeField({
                    geojson: {
                        type: "FeatureCollection",
                        features: [
                            {
                                geometry: {
                                    type: "LineString",
                                    coordinates: [
                                        [13, 45, 100],
                                        [13.1, 45.1, 250],
                                        [13.2, 45.2, 180],
                                    ],
                                },
                                properties: {},
                            },
                        ],
                    },
                }),
            },
            global: { mocks: { __: (key) => key } },
        });

        expect(wrapper.find("svg").exists()).toBe(true);
        expect(wrapper.text()).toContain("100–250 m");
    });

    it("renders nothing when the geometry has no elevation", () => {
        const wrapper = mount(ElevationProfile, {
            props: {
                field: makeField({
                    geojson: collectionOf(pointFeature(13, 45)),
                }),
            },
            global: { mocks: { __: (key) => key } },
        });

        expect(wrapper.find("svg").exists()).toBe(false);
    });
});
