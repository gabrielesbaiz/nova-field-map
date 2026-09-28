/**
 * Colour scales for choropleth rendering.
 *
 * The ramp is a perceptually even blue sequence: lightness carries the
 * value, so it survives greyscale printing and most colour-vision
 * deficiencies, which a rainbow ramp does not.
 */
const RAMP = [
    "#eff6ff",
    "#bfdbfe",
    "#93c5fd",
    "#60a5fa",
    "#3b82f6",
    "#2563eb",
    "#1d4ed8",
];

/**
 * Build buckets for a numeric feature property.
 *
 * "quantile" gives every bucket the same number of features, which suits the
 * skewed distributions most real data has; "linear" splits the range evenly,
 * which is easier to read when the data is uniform.
 */
export function buildScale(features, property, kind = "quantile", steps = 5) {
    const values = features
        .map((feature) => Number(feature.properties?.[property]))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b);

    if (values.length === 0) {
        return null;
    }

    const count = Math.min(steps, Math.max(1, new Set(values).size));
    const min = values[0];
    const max = values[values.length - 1];

    // Every feature carrying the same value has no gradient to show.
    if (min === max) {
        return {
            property,
            breaks: [min],
            colors: [RAMP[RAMP.length - 1]],
            colorFor: () => RAMP[RAMP.length - 1],
        };
    }

    const breaks = [];

    for (let index = 0; index < count; index += 1) {
        breaks.push(
            kind === "linear"
                ? min + ((max - min) * index) / count
                : values[Math.floor((values.length * index) / count)],
        );
    }

    const colors = breaks.map(
        (_, index) =>
            RAMP[Math.round((index * (RAMP.length - 1)) / (count - 1 || 1))],
    );

    return {
        property,
        breaks,
        colors,
        max,
        colorFor(value) {
            const number = Number(value);

            if (!Number.isFinite(number)) {
                return "#d1d5db";
            }

            let bucket = 0;

            while (bucket + 1 < breaks.length && number >= breaks[bucket + 1]) {
                bucket += 1;
            }

            return colors[bucket];
        },
    };
}

/**
 * Distinct colours for categorical grouping — filter layers, cluster
 * colouring. Chosen to stay distinguishable rather than to form a ramp.
 */
const CATEGORIES = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#d97706",
    "#7c3aed",
    "#0891b2",
    "#db2777",
    "#65a30d",
];

export function categoryColor(index) {
    return CATEGORIES[index % CATEGORIES.length];
}

/**
 * Great-circle distance in metres.
 *
 * Planar maths is wrong enough to matter over a route of any length, so the
 * haversine formula is used even though it costs a few trig calls.
 */
export function haversine([lat1, lng1], [lat2, lng2]) {
    const radius = 6371000;
    const toRad = (value) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    return 2 * radius * Math.asin(Math.sqrt(a));
}

export function formatDistance(metres) {
    return metres >= 1000
        ? `${(metres / 1000).toFixed(2)} km`
        : `${Math.round(metres)} m`;
}
