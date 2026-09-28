/**
 * Nova provides these mixins at runtime; the bundle keeps the module
 * external, so tests substitute the parts the components actually use.
 */
export const DependentFormField = {
    data: () => ({ value: "" }),
    created() {
        this.setInitialValue?.();
    },
    computed: {
        fieldAttribute() {
            return this.field.attribute;
        },
        showHelpText: () => false,
        fullWidthContent: () => false,
    },
};

export const FormField = DependentFormField;

export const HandlesValidationErrors = {
    props: { errors: { type: Object, default: () => ({}) } },
    computed: {
        errorClasses: () => [],
    },
};

/**
 * Nova exposes the translator through this composable, not as a global. A test
 * global would let a component call a bare __() that fails in the browser.
 */
export function useLocalization() {
    return {
        __: (key, replacements = {}) =>
            Object.entries(replacements).reduce(
                (text, [token, value]) => text.replace(`:${token}`, value),
                key,
            ),
    };
}
