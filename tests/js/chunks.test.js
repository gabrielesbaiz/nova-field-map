import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

/**
 * The lazy chunks are ES modules the entry bundle reaches with a dynamic
 * import(). Vite drops entry exports unless preserveEntrySignatures says
 * otherwise, and an exportless chunk still imports cleanly — it just resolves
 * to an empty namespace, so the first property read fails far from the cause
 * ("Cannot read properties of undefined (reading 'map')").
 */
describe("lazy chunks", () => {
    const expected = {
        core: ["L", "createIcon"],
        google: ["loadGoogleMaps"],
        sanitize: ["sanitizeHtml"],
    };

    it.each(Object.entries(expected))(
        "lazy-%s.js exports what its callers destructure",
        (name, symbols) => {
            const file = `dist/js/lazy-${name}.js`;

            expect(existsSync(file), `${file} is not built`).toBe(true);

            const source = readFileSync(file, "utf8");
            const statement = source.match(/export\{[^}]*\}/)?.[0] ?? "";

            symbols.forEach((symbol) => {
                expect(statement).toContain(`as ${symbol}`);
            });
        },
    );
});
