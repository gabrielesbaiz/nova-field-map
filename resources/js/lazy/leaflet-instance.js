/**
 * One Leaflet instance, writable, and visible to the plugins.
 *
 * leaflet.markercluster carries no import of its own: it patches whatever
 * object the bare global `L` names at evaluation time. A module namespace is
 * sealed, so the plugin cannot write to `import * as L from "leaflet"`, and
 * without a global it silently lands on some other page's Leaflet — which is
 * how `L.markerClusterGroup is not a function` reached a map that had just
 * bundled the plugin successfully.
 *
 * Copying the namespace gives the plugin something writable, publishing it as
 * window.L gives it the right target, and exporting the same object keeps the
 * field and the plugin on one Leaflet.
 */
import * as LeafletNamespace from "leaflet";

const L = { ...(LeafletNamespace.default ?? LeafletNamespace) };

if (typeof window !== "undefined") {
    window.L = L;
}

export { L };
