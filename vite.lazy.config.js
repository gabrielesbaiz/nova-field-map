import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const entry = (file) =>
    fileURLToPath(new URL(`./resources/js/lazy/${file}`, import.meta.url));

/**
 * The lazy half of the build.
 *
 * These chunks are plain ES modules fetched at runtime with a dynamic import()
 * from the IIFE entry bundle, so they must not be externalised and must not
 * emit CSS: all stylesheet content is bundled eagerly into dist/css/field.css
 * by the main config, where Nova::style can serve it as a single file.
 *
 * They are served by FieldMapAssetController, not by Nova::script, because
 * anything registered with Nova::script is injected into every page.
 */
export default defineConfig({
    define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
    },

    build: {
        outDir: "dist",
        emptyOutDir: false,
        cssCodeSplit: false,
        sourcemap: false,
        target: "es2020",
        minify: "esbuild",
        rollupOptions: {
            // Vite drops entry exports for a non-library build, which leaves
            // each chunk importable but empty: useLeafletMap then reads L.map
            // off undefined the moment a map is scrolled into view.
            preserveEntrySignatures: "strict",
            input: {
                core: entry("core.js"),
                draw: entry("draw.js"),
                heat: entry("heat.js"),
                google: entry("google.js"),
                sanitize: entry("sanitize.js"),
            },
            output: {
                format: "es",
                dir: "dist",
                entryFileNames: "js/lazy-[name].js",
                // Shared code (Leaflet itself) must land in one predictable file
                // rather than a hashed chunk, so the asset controller can
                // whitelist it by name.
                chunkFileNames: "js/lazy-shared-[name].js",
                assetFileNames: "css/discarded-[name].[ext]",
            },
        },
    },
});
