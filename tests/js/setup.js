import { config } from "@vue/test-utils";
import { vi } from "vitest";

/**
 * Nova registers __ as a Vue global property, so a template resolves it from
 * the component instance. Script-scope code has no such luck and must pull it
 * from useLocalization(), which is why no globalThis.__ is defined here: one
 * would hide exactly the ReferenceError the browser raises.
 */
config.global.mocks.__ = (key, replacements = {}) =>
    Object.entries(replacements).reduce(
        (text, [token, value]) => text.replace(`:${token}`, value),
        key,
    );

globalThis.Nova = {
    booting: vi.fn(),
    $emit: vi.fn(),
    $on: vi.fn(),
    visit: vi.fn(),
    error: vi.fn(),
    request: () => ({ get: vi.fn().mockResolvedValue({ data: {} }) }),
};

/**
 * happy-dom has no IntersectionObserver. The real one defers building the map
 * until the container is on screen; the stub reports it as visible straight
 * away so tests do not have to simulate scrolling.
 */
class ImmediateIntersectionObserver {
    constructor(callback) {
        this.callback = callback;
    }

    observe() {
        this.callback([{ isIntersecting: true }]);
    }

    disconnect() {
        ImmediateIntersectionObserver.disconnected += 1;
    }

    unobserve() {}
}

ImmediateIntersectionObserver.disconnected = 0;
globalThis.IntersectionObserver = ImmediateIntersectionObserver;

class NoopResizeObserver {
    observe() {}

    disconnect() {
        NoopResizeObserver.disconnected += 1;
    }

    unobserve() {}
}

NoopResizeObserver.disconnected = 0;
globalThis.ResizeObserver = NoopResizeObserver;

// Leaflet measures the container; happy-dom reports every element as zero
// sized, which makes fitBounds unable to choose a zoom level.
Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => 800,
});

Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => 400,
});
