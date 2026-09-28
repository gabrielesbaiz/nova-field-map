import { describe, expect, it } from "vitest";
import { toGpx } from "../../resources/js/support/export";

describe("gpx export", () => {
    it("writes points as waypoints", () => {
        const gpx = toGpx({
            type: "FeatureCollection",
            features: [
                {
                    geometry: { type: "Point", coordinates: [13.7768, 45.6495] },
                    properties: { name: "Warehouse" },
                },
            ],
        });

        expect(gpx).toContain('<wpt lat="45.6495" lon="13.7768">');
        expect(gpx).toContain("<name>Warehouse</name>");
    });

    it("writes a polygon outline as a track", () => {
        // GPX has no polygon; the outline as a track is what GPS software
        // expects to receive.
        const gpx = toGpx({
            type: "FeatureCollection",
            features: [
                {
                    geometry: {
                        type: "Polygon",
                        coordinates: [
                            [
                                [13, 45],
                                [14, 45],
                                [14, 46],
                                [13, 45],
                            ],
                        ],
                    },
                    properties: {},
                },
            ],
        });

        expect(gpx).toContain("<trkseg>");
        expect((gpx.match(/<trkpt /g) || []).length).toBe(4);
    });

    it("escapes names that contain markup", () => {
        const gpx = toGpx({
            type: "FeatureCollection",
            features: [
                {
                    geometry: { type: "Point", coordinates: [1, 2] },
                    properties: { name: '<script>"x"</script>' },
                },
            ],
        });

        expect(gpx).not.toContain("<script>");
        expect(gpx).toContain("&lt;script&gt;");
    });

    it("produces a valid document for an empty collection", () => {
        const gpx = toGpx({ type: "FeatureCollection", features: [] });

        expect(gpx).toContain("<gpx");
        expect(gpx.trim().endsWith("</gpx>")).toBe(true);
    });
});
