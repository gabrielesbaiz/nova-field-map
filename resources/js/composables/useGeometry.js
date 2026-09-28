import { loadChunk } from "./useLazyChunks";
import { buildScale } from "../support/scales";

/**
 * Turning a field's FeatureCollection into Leaflet layers.
 *
 * All the shape checking happened in PHP, so this only has to render. The
 * one thing it must still guard is emptiness: fitBounds() on an empty layer
 * throws "Bounds are not valid", which is what 2.x did for any record whose
 * coordinate column was still null.
 */
export function hasFeatures(field) {
    return (field.geojson?.features || []).length > 0;
}

export function buildGeoJsonLayer(L, field, options = {}) {
    const { createIcon, onFeatureClick, features } = options;
    const renderer = field.useCanvas ? L.canvas() : undefined;

    const collection = features
        ? { type: "FeatureCollection", features }
        : field.geojson;

    // Choropleth colours are derived from the whole dataset, not from the
    // currently visible subset, so a timeline or filter cannot make the same
    // value change colour as the user scrubs.
    const scale = field.choroplethProperty
        ? buildScale(
              field.geojson?.features || [],
              field.choroplethProperty,
              field.choroplethScale,
          )
        : null;

    return L.geoJSON(collection, {
        renderer,

        pointToLayer(feature, latlng) {
            const style = feature.properties?.__marker || {};

            if (field.useCanvas) {
                // Thousands of DOM markers stall the page; circle markers on
                // a canvas stay interactive.
                return L.circleMarker(latlng, {
                    radius: style.radius || 5,
                    color: style.color || "#2563eb",
                    fillColor: style.fillColor || style.color || "#2563eb",
                    fillOpacity: style.opacity ?? 0.8,
                    weight: style.weight || 1,
                });
            }

            return L.marker(latlng, {
                icon: createIcon({
                    icon: style.icon || field.markerIcon,
                    iconSize: style.iconSize || field.markerIconSize,
                    iconAnchor: style.iconAnchor || field.markerIconAnchor,
                    color: style.color,
                }),
                keyboard: true,
                alt: feature.properties?.__tooltip || "",
            });
        },

        style(feature) {
            const style = feature.properties?.__marker || {};

            if (scale) {
                const fill = scale.colorFor(
                    feature.properties?.[field.choroplethProperty],
                );

                return {
                    color: "#ffffff",
                    fillColor: fill,
                    weight: 1,
                    fillOpacity: 0.75,
                };
            }

            return {
                color: style.color || "#2563eb",
                fillColor: style.fillColor || style.color || "#2563eb",
                weight: style.weight ?? 2,
                fillOpacity: style.opacity ?? 0.2,
            };
        },

        onEachFeature(feature, layer) {
            const properties = feature.properties || {};

            if (properties.__tooltip) {
                layer.bindTooltip(properties.__tooltip);
            }

            if (properties.__popup && !field.useCanvas) {
                bindPopup(layer, properties.__popup, field);
            }

            if (properties.__link && onFeatureClick) {
                layer.on("click", () => onFeatureClick(properties.__link));
            }
        },
    });
}

/**
 * Binds a popup, sanitizing when the body is markup.
 *
 * bindPopup() renders a string as raw HTML, which is how the 2.x popup path
 * became a stored-XSS sink. PHP escapes by default and only sets html:true
 * when the field explicitly opted in; even then the markup is sanitized here
 * unless the application disabled that.
 */
export function bindPopup(layer, popup, field) {
    if (!popup?.html) {
        // Escaped server-side: hand Leaflet a text node so nothing can be
        // re-interpreted as markup on the way in.
        const node = document.createElement("div");
        node.textContent = decodeEntities(popup.content);
        layer.bindPopup(node);

        return;
    }

    if (field.sanitizePopups !== false) {
        sanitize(field, popup.content).then((clean) => layer.bindPopup(clean));

        return;
    }

    layer.bindPopup(popup.content);
}

function sanitize(field, html) {
    // DOMPurify is only fetched when a field actually renders raw HTML.
    return loadChunk(field, "sanitize")
        .then(({ sanitizeHtml }) => sanitizeHtml(html))
        .catch(() => {
            // Failing closed: unsanitized markup is exactly the hole this
            // exists to close.
            const node = document.createElement("div");
            node.textContent = html;

            return node.outerHTML;
        });
}

function decodeEntities(value) {
    const node = document.createElement("textarea");
    node.innerHTML = value;

    return node.value;
}
