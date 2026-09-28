import { describe, expect, it } from "vitest";
import { globSync, readFileSync } from "node:fs";

/**
 * Nova exposes __ on the component instance, so a template may call it bare.
 * Script-scope code cannot: the browser raises "__ is not defined" and the
 * field stops rendering. Every file that calls __ outside a template must
 * pull it from useLocalization().
 */
describe("translator binding", () => {
    const files = globSync("resources/js/**/*.{vue,js}");

    it.each(files)("%s binds __ before calling it", (file) => {
        const source = readFileSync(file, "utf8");

        const script = file.endsWith(".vue")
            ? source.slice(source.search(/<script[^>]*>/))
            : source;

        const callsTranslator = /(?<![\w$])__\(/.test(script);

        if (!callsTranslator) {
            expect(true).toBe(true);

            return;
        }

        expect(source).toContain("useLocalization()");
    });
});
