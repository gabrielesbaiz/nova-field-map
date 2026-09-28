import DetailField from "./components/DetailField.vue";
import FormField from "./components/FormField.vue";
import IndexField from "./components/IndexField.vue";
import BoundsFilter from "./components/BoundsFilter.vue";
import "../css/field.css";

/**
 * The entry bundle, and deliberately all of it.
 *
 * Leaflet and its plugins are fetched at runtime by useLazyChunks, so a Nova
 * page that renders no map downloads none of them.
 */
Nova.booting((app) => {
    app.component("index-nova-field-map", IndexField);
    app.component("detail-nova-field-map", DetailField);
    app.component("form-nova-field-map", FormField);
    app.component("nova-field-map-bounds-filter", BoundsFilter);
});
