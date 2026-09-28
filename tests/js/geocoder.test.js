import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { tick } from "./helpers";
import GeocoderBox from "../../resources/js/components/GeocoderBox.vue";

const results = [
    { label: "Trieste, Italy", latitude: 45.6495, longitude: 13.7768, components: {} },
    { label: "Trieste, Texas", latitude: 31.0, longitude: -97.0, components: {} },
];

function mockSearch(response = { data: { results } }) {
    const get = vi.fn().mockResolvedValue(response);
    Nova.request = () => ({ get });

    return get;
}

describe("geocoder box", () => {
    it("does not search until the query is long enough", async () => {
        const get = mockSearch();
        const wrapper = mount(GeocoderBox);

        await wrapper.find("input").setValue("T");
        await new Promise((resolve) => setTimeout(resolve, 400));

        expect(get).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    it("debounces typing into a single request", async () => {
        const get = mockSearch();
        const wrapper = mount(GeocoderBox);
        const input = wrapper.find("input");

        for (const value of ["Tri", "Trie", "Tries", "Trieste"]) {
            await input.setValue(value);
        }

        await new Promise((resolve) => setTimeout(resolve, 450));

        // Geocoders are rate limited; one request per keystroke would burn
        // the quota in a single search.
        expect(get).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    it("emits the chosen result", async () => {
        mockSearch();
        const wrapper = mount(GeocoderBox);

        await wrapper.find("input").setValue("Trieste");
        await new Promise((resolve) => setTimeout(resolve, 450));
        await tick();

        await wrapper.findAll("li")[1].trigger("mousedown");

        expect(wrapper.emitted("select")[0][0].label).toBe("Trieste, Texas");
        wrapper.unmount();
    });

    it("moves the highlight with the arrow keys", async () => {
        mockSearch();
        const wrapper = mount(GeocoderBox);
        const input = wrapper.find("input");

        await input.setValue("Trieste");
        await new Promise((resolve) => setTimeout(resolve, 450));
        await tick();

        await input.trigger("keydown.down");
        await input.trigger("keydown.enter");

        expect(wrapper.emitted("select")[0][0].label).toBe("Trieste, Texas");
        wrapper.unmount();
    });

    it("reports when nothing matched", async () => {
        mockSearch({ data: { results: [] } });
        const wrapper = mount(GeocoderBox);

        await wrapper.find("input").setValue("Nowhere at all");
        await new Promise((resolve) => setTimeout(resolve, 450));
        await tick();

        expect(wrapper.text()).toContain("No results found");
        wrapper.unmount();
    });
});
