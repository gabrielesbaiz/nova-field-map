import { beforeAll, describe, expect, it } from "vitest";

/**
 * Loads the built chunk, not the source: the failure this guards against was
 * created by bundling. leaflet.markercluster patches the global L as it
 * evaluates, so a chunk that hands back a Leaflet without the plugin's
 * methods is only visible once the real file is imported.
 */
describe("built core chunk", () => {
    let core;

    beforeAll(async () => {
        core = await import("../../dist/js/lazy-core.js");
    });

    it("exports Leaflet with the marker cluster plugin attached", () => {
        expect(typeof core.L.map).toBe("function");
        expect(typeof core.L.markerClusterGroup).toBe("function");
        expect(typeof core.L.MarkerClusterGroup).toBe("function");
    });

    it("hands the plugin and the field the same Leaflet", () => {
        expect(window.L).toBe(core.L);
    });

    it("exports an icon factory that builds a fresh icon each call", () => {
        const first = core.createIcon();
        const second = core.createIcon();

        expect(first).not.toBe(second);
    });
});
