import { onBeforeUnmount, ref } from "vue";

/**
 * Tracks Nova's theme.
 *
 * Nova toggles a "dark" class on <html>, and the OS preference applies when
 * the user has not chosen. Both are watched, and both listeners are torn
 * down with the component.
 */
export function useDarkMode(enabled = true) {
    const isDark = ref(false);

    if (!enabled || typeof window === "undefined") {
        return { isDark };
    }

    const read = () => {
        isDark.value = document.documentElement.classList.contains("dark");
    };

    read();

    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
    });

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener?.("change", read);

    onBeforeUnmount(() => {
        observer.disconnect();
        media?.removeEventListener?.("change", read);
    });

    return { isDark };
}
