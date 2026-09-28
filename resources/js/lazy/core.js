/**
 * The Leaflet core chunk.
 *
 * Fetched on demand by useLeafletMap, so a Nova page that renders no map
 * never downloads Leaflet at all. Stylesheets are deliberately absent: they
 * are bundled eagerly into dist/css/field.css, which Nova serves as one file.
 */
// Order matters: the instance module publishes window.L, and the plugin below
// patches that object as it evaluates.
import { L } from "./leaflet-instance";
import "leaflet.markercluster";

export { L };

/**
 * Leaflet's default marker points at image files by filename, resolved
 * against a path it guesses from its own script URL. Nothing serves those
 * files here, so the icons are inlined instead.
 *
 * Crucially this builds an icon instance per call. 2.x mutated
 * L.Icon.Default.prototype, which is process-global, so two fields on one
 * page silently shared whichever icon happened to render last.
 */
const MARKER =
    "data:image/svg+xml;base64," +
    btoa(
        `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5 0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#2563eb"/>
            <circle cx="12.5" cy="12.5" r="4.5" fill="#fff"/>
        </svg>`,
    );

const SHADOW =
    "data:image/svg+xml;base64," +
    btoa(
        `<svg xmlns="http://www.w3.org/2000/svg" width="41" height="41" viewBox="0 0 41 41">
            <ellipse cx="13" cy="38" rx="9" ry="3" fill="rgba(0,0,0,0.25)"/>
        </svg>`,
    );

export function createIcon(options = {}) {
    const { icon, iconSize, iconAnchor, color } = options;

    if (!icon && color) {
        const tinted =
            "data:image/svg+xml;base64," +
            btoa(
                `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
                    <path d="M12.5 0C5.6 0 0 5.6 0 12.5 0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
                    <circle cx="12.5" cy="12.5" r="4.5" fill="#fff"/>
                </svg>`,
            );

        return L.icon({
            iconUrl: tinted,
            iconRetinaUrl: tinted,
            iconSize: iconSize || [25, 41],
            iconAnchor: iconAnchor || [12, 41],
            popupAnchor: [0, -34],
            shadowUrl: SHADOW,
            shadowSize: [41, 41],
        });
    }

    const url = icon || MARKER;

    return L.icon({
        iconUrl: url,
        iconRetinaUrl: url,
        iconSize: iconSize || [25, 41],
        iconAnchor: iconAnchor || [12, 41],
        popupAnchor: [0, -34],
        // A custom icon has no matching shadow, and reusing the default one
        // under a differently shaped image looks like a rendering fault.
        shadowUrl: icon ? undefined : SHADOW,
        shadowSize: icon ? undefined : [41, 41],
    });
}
