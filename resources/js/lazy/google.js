/**
 * Google's basemap, loaded only when a key is configured.
 *
 * googlemutant drives Google's own SDK, so the SDK has to be present and
 * ready before any layer is constructed. 2.x fired the script tag and built
 * the layer in the same tick, which raced and threw if the user switched
 * layers before the SDK arrived.
 */
import "leaflet.gridlayer.googlemutant";

let loading = null;

export function loadGoogleMaps(apiKey) {
    if (window.google?.maps) {
        return Promise.resolve(window.google.maps);
    }

    // One in-flight load is shared by every map on the page; Google's SDK
    // throws if it is included twice.
    if (loading) {
        return loading;
    }

    loading = new Promise((resolve, reject) => {
        const callback = "__novaFieldMapGoogleReady";
        const script = document.createElement("script");

        window[callback] = () => {
            delete window[callback];
            resolve(window.google.maps);
        };

        script.async = true;
        script.src =
            "https://maps.googleapis.com/maps/api/js?key=" +
            encodeURIComponent(apiKey) +
            "&loading=async&callback=" +
            callback;
        script.onerror = () => {
            loading = null;
            delete window[callback];
            reject(new Error("Google Maps failed to load."));
        };

        document.head.appendChild(script);
    });

    return loading;
}
