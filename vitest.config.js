import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [vue()],

    resolve: {
        alias: {
            // Only Nova's running app provides these modules; the bundle keeps
            // them external, so tests substitute stubs.
            "laravel-nova": fileURLToPath(
                new URL("./tests/js/stubs/laravel-nova.js", import.meta.url),
            ),
        },
    },

    test: {
        environment: "happy-dom",
        include: ["tests/js/**/*.test.js"],
        setupFiles: ["./tests/js/setup.js"],
    },
});
