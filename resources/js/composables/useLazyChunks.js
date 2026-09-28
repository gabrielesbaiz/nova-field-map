/**
 * Runtime loader for the lazily built map chunks.
 *
 * The entry bundle is an IIFE, which Rollup cannot code-split, so the chunks
 * are a separate ES build served by the package's own asset route. Dynamic
 * import() is legal from a classic script, so the two halves meet here.
 */
const cache = new Map();

function base(field) {
    return (field?.assetBaseUrl || "/nova-vendor/nova-field-map/asset").replace(
        /\/$/,
        "",
    );
}

export function loadChunk(field, name) {
    const url = `${base(field)}/lazy-${name}.js`;

    if (!cache.has(url)) {
        // @vite-ignore keeps Rollup from trying to resolve a URL that only
        // exists once the application is serving the package.
        cache.set(
            url,
            import(/* @vite-ignore */ url).catch((error) => {
                // A failed chunk must not be cached as permanently broken: a
                // transient network error would disable maps until reload.
                cache.delete(url);
                throw error;
            }),
        );
    }

    return cache.get(url);
}

export function loadCore(field) {
    return loadChunk(field, "core");
}
