/**
 * DOMPurify, loaded only when a field actually renders raw HTML in a popup.
 *
 * It lives in the lazy half of the build because the entry bundle is an IIFE
 * with inlineDynamicImports, which would otherwise pull it in for every Nova
 * page whether or not any popup allows markup.
 */
import DOMPurify from "dompurify";

export function sanitizeHtml(html) {
    return DOMPurify.sanitize(html);
}
