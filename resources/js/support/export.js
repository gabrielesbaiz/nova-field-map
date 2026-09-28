/**
 * GeoJSON to GPX.
 *
 * GPX has no concept of polygons, so areas are exported as tracks of their
 * outline — the closest honest equivalent, and what GPS software expects.
 */
export function toGpx(collection) {
    const features = collection?.features || [];
    const waypoints = [];
    const tracks = [];

    features.forEach((feature) => {
        const geometry = feature.geometry;
        const name = escapeXml(
            feature.properties?.name || feature.properties?.__tooltip || "",
        );

        if (!geometry) {
            return;
        }

        if (geometry.type === "Point") {
            const [lng, lat] = geometry.coordinates;
            waypoints.push(
                `  <wpt lat="${lat}" lon="${lng}">${name ? `<name>${name}</name>` : ""}</wpt>`,
            );

            return;
        }

        const rings = flattenToRings(geometry);

        rings.forEach((ring) => {
            const points = ring
                .map(
                    ([lng, lat]) =>
                        `      <trkpt lat="${lat}" lon="${lng}"></trkpt>`,
                )
                .join("\n");

            tracks.push(
                `  <trk>${name ? `<name>${name}</name>` : ""}\n    <trkseg>\n${points}\n    </trkseg>\n  </trk>`,
            );
        });
    });

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<gpx version="1.1" creator="nova-field-map" xmlns="http://www.topografix.com/GPX/1/1">',
        ...waypoints,
        ...tracks,
        "</gpx>",
    ].join("\n");
}

function flattenToRings(geometry) {
    switch (geometry.type) {
        case "LineString":
            return [geometry.coordinates];
        case "MultiLineString":
        case "Polygon":
            return geometry.coordinates;
        case "MultiPolygon":
            return geometry.coordinates.flat();
        default:
            return [];
    }
}

function escapeXml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
