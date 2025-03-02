import IndexField from "./components/IndexField";
import DetailField from "./components/DetailField";
import FormField from "./components/FormField";

Nova.booting((app, store) => {
    app.component("index-nova-field-map", IndexField);
    app.component("detail-nova-field-map", DetailField);
    app.component("form-nova-field-map", FormField);
});
