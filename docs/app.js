(() => {
'use strict';


/* ============================================================
   THE API, AS DATA
   Signatures and defaults are copied from src/Concerns/*.php and
   src/FieldMap.php. This one array drives the reference page, the
   playground's controls and the command palette, so the three
   cannot drift apart.
   ============================================================ */
const GROUPS = [
  ['geometry',  'Geometry',            'Where the field gets its coordinates.'],
  ['editing',   'Editing',             'Only applies when the field is on a form.'],
  ['popups',    'Popups',              'What a marker says when you click it.'],
  ['tiles',     'Tiles',               'Which basemaps are offered, and dark mode.'],
  ['markers',   'Markers',             'How points look, and what happens when there are many.'],
  ['viz',       'Visualisation',       'Turning the geometry into an argument.'],
  ['chrome',    'Viewport and chrome', 'The frame around the map.'],
  ['index',     'Index and navigation','How the field behaves outside the detail page.'],
  ['legacy',    'Deprecated',          'Kept so 2.x resources keep working. Removed in 4.0.'],
];

const METHODS = [
/* --- geometry --------------------------------------------------- */
{g:'geometry',n:'coordinates',sig:"coordinates(string \\$latitudeColumn, string \\$longitudeColumn)",def:'—',
 d:'Read the latitude and longitude from two separate columns. For a schema that predates the field and is not worth a migration.',
 ex:"->coordinates('lat', 'lng')",ctl:'geometry'},
{g:'geometry',n:'relation',sig:"relation(string \\$relation, ?string \\$attribute = null)",def:"attribute = the field's own",
 d:'Plot a relation, one marker per related record. Each record’s attributes travel with its feature, so popups and styling can address them by column name.',
 ex:"->relation('branches')",ctl:'geometry'},
{g:'geometry',n:'geometryUsing',sig:"geometryUsing(Closure \\$callback)",def:'—',
 d:'Build the geometry yourself. The callback receives the model and may return anything the resolver chain accepts.',
 ex:"->geometryUsing(fn (Store \\$s) => \\$s->zone())"},
{g:'geometry',n:'geoJson',sig:"geoJson(mixed \\$geoJson)",def:'—',
 d:'Set geometry directly, bypassing any model lookup.',ex:"->geoJson(\\$collection)"},
{g:'geometry',n:'point',sig:"point(\\$latitude, \\$longitude, array \\$properties = [])",def:'—',
 d:'Set a single point directly. Accepts null for either argument and renders an empty map, so a record with no coordinates yet is not an error.',
 ex:"->point(45.6495, 13.7768)"},

/* --- editing ---------------------------------------------------- */
{g:'editing',n:'editable',sig:"editable(bool \\$editable = true)",def:'false',
 d:'Show the map on create and update forms, with a draggable marker and a click-to-place map. Every edit is undoable.',
 ex:'->editable()',ctl:'editable'},
{g:'editing',n:'draw',sig:"draw(Shape ...\\$shapes)",def:'Shape::Point',
 d:'Which geometry the user may draw. Implies editable(). A field restricted to Shape::Point replaces rather than accumulates.',
 ex:'->draw(Shape::Polygon)',ctl:'draw'},
{g:'editing',n:'geocoder',sig:"geocoder(bool \\$enabled = true)",def:'false',
 d:'Add a debounced place search box above the map. Requests are proxied through your application, so provider keys stay server-side.',
 ex:'->geocoder()',ctl:'geocoder'},
{g:'editing',n:'geolocation',sig:"geolocation(bool \\$enabled = true)",def:'true',
 d:'Offer a "use my location" button on the form.',ex:'->geolocation(false)',ctl:'geolocation'},
{g:'editing',n:'manualInputs',sig:"manualInputs(bool \\$enabled = true)",def:'true',
 d:'Show numeric latitude and longitude inputs beneath the map, synced to the marker.',
 ex:'->manualInputs(false)',ctl:'manualInputs'},
{g:'editing',n:'nudgeStep',sig:"nudgeStep(float \\$degrees)",def:'0.0001',
 d:'How far one arrow-key press moves the marker, in degrees. The default is roughly 11 metres.',
 ex:'->nudgeStep(0.00001)',ctl:'nudgeStep'},
{g:'editing',n:'fillsAddress',sig:"fillsAddress(array \\$targets)",def:'[]',
 d:'Reverse-geocode a dropped pin into other Nova fields. Keys are normalised address components; values are field attributes. Implies geocoder().',
 ex:"->fillsAddress(['city' => 'city'])",ctl:'fillsAddress'},
{g:'editing',n:'syncTo',sig:"syncTo(string \\$latitudeField, string \\$longitudeField)",def:'—',
 d:'Drive two existing Nova number fields and write nothing itself. Lets a resource adopt the map with no schema change.',
 ex:"->syncTo('lat', 'lng')",ctl:'syncTo'},
{g:'editing',n:'storeAsGeoJson',sig:'storeAsGeoJson()',def:'default',
 d:'Store the submitted geometry as a GeoJSON FeatureCollection. The column should be json or text.',
 ex:'->storeAsGeoJson()',ctl:'storeAs'},
{g:'editing',n:'storeAsLatLngString',sig:'storeAsLatLngString()',def:'—',
 d:'Store the submitted geometry as "45.6495,13.7768" in a single string column.',
 ex:'->storeAsLatLngString()',ctl:'storeAs'},
{g:'editing',n:'storeAsColumns',sig:'storeAsColumns()',def:'—',
 d:'Store the submitted geometry across the coordinates() column pair.',
 ex:'->storeAsColumns()',ctl:'storeAs'},

/* --- popups ----------------------------------------------------- */
{g:'popups',n:'popup',sig:"popup(string \\$property)",def:'—',
 d:'Bind a popup built from the named feature property. The value is escaped — markup renders as literal text.',
 ex:"->popup('name')",ctl:'popup'},
{g:'popups',n:'popupUsing',sig:"popupUsing(Closure \\$callback)",def:'—',
 d:'Build each popup body server-side. A View or Htmlable is trusted markup; a plain string is still escaped.',
 ex:"->popupUsing(fn (\\$f) => view('popup', \\$f))"},
{g:'popups',n:'allowHtmlPopups',sig:"allowHtmlPopups(bool \\$allow = true)",def:'false',
 d:'Render popup strings as markup. The browser still sanitises it with DOMPurify unless popups.sanitize is disabled. This is the 2.x stored-XSS hole, behind an explicit opt-in.',
 ex:'->allowHtmlPopups()',ctl:'allowHtml',danger:true},
{g:'popups',n:'tooltip',sig:"tooltip(string \\$property)",def:'—',
 d:'Show the named property as a hover tooltip. Always escaped — there is no opt-out.',
 ex:"->tooltip('city')",ctl:'tooltip'},

/* --- tiles ------------------------------------------------------ */
{g:'tiles',n:'tiles',sig:"tiles(Tile|string ...\\$tiles)",def:"config: ['osm', 'carto-light']",
 d:'Choose which layers appear in the switcher, in order. A keyed provider with no key is dropped rather than shown as a dead entry.',
 ex:'->tiles(Tile::CartoLight, Tile::Satellite)',ctl:'tiles'},
{g:'tiles',n:'darkTile',sig:"darkTile(Tile|string \\$tile)",def:'Tile::CartoDark',
 d:'Which layer is used when Nova is in dark mode.',ex:'->darkTile(Tile::StadiaDark)',ctl:'darkTile'},
{g:'tiles',n:'darkMode',sig:"darkMode(bool \\$enabled = true)",def:'true',
 d:'Follow Nova’s theme. Disabling keeps the chosen layer in both themes.',ex:'->darkMode(false)',ctl:'darkMode'},
{g:'tiles',n:'googleApiKey',sig:"googleApiKey(?string \\$key = null)",def:'null',
 d:'Enable the Google basemap. Called with no argument it reads config. The key reaches the browser, as any Maps JavaScript key must — restrict it by HTTP referrer.',
 ex:'->googleApiKey()',ctl:'googleKey',danger:true},
{g:'tiles',n:'googleMapType',sig:"googleMapType(GoogleMapType|string \\$type)",def:"'roadmap'",
 d:'Which Google basemap style to request.',ex:'->googleMapType(GoogleMapType::Hybrid)',ctl:'googleMapType'},
{g:'tiles',n:'mapboxKey',sig:"mapboxKey(?string \\$key = null)",def:'null',
 d:'Enable the Mapbox basemap; null reads config.',ex:'->mapboxKey()'},
{g:'tiles',n:'maptilerKey',sig:"maptilerKey(?string \\$key = null)",def:'null',
 d:'Enable the MapTiler basemap; null reads config.',ex:'->maptilerKey()'},

/* --- markers ---------------------------------------------------- */
{g:'markers',n:'markerIcon',sig:"markerIcon(string \\$url, ?array \\$size = null, ?array \\$anchor = null)",def:'built-in pin',
 d:'Replace the default marker image. Icons are per field instance, so two fields on one page keep their own.',
 ex:"->markerIcon('/images/pin.png', [32,32], [16,32])",ctl:'markerIcon'},
{g:'markers',n:'markerUsing',sig:"markerUsing(Closure \\$callback)",def:'—',
 d:'Style each marker from its feature. Keys: icon, iconSize, iconAnchor, color, fillColor, radius, weight, opacity. color alone tints the built-in pin.',
 ex:"->markerUsing(fn (\\$f) => ['color' => '#16a34a'])",ctl:'markerColor'},
{g:'markers',n:'cluster',sig:"cluster(bool \\$enabled = true, ?int \\$disableAtZoom = null)",def:'config: true, zoom 11',
 d:'Group nearby markers. Skipped below cluster.min_features (10), where it only adds a click between the user and the data.',
 ex:'->cluster(disableAtZoom: 13)',ctl:'cluster'},
{g:'markers',n:'withoutClustering',sig:'withoutClustering()',def:'—',
 d:'Never cluster. Worth setting for polygons, where clustering does nothing useful.',ex:'->withoutClustering()',ctl:'cluster'},
{g:'markers',n:'clusterColorBy',sig:"clusterColorBy(string \\$property)",def:'—',
 d:'Colour cluster bubbles by the value that dominates each one.',ex:"->clusterColorBy('status')",ctl:'clusterColorBy'},
{g:'markers',n:'heatmap',sig:"heatmap(bool \\$enabled = true, ?string \\$weightProperty = null)",def:'false',
 d:'Render a heat layer instead of markers, optionally weighted by a numeric property. Popups do not apply.',
 ex:"->heatmap(weightProperty: 'severity')",ctl:'heatmap'},

/* --- visualisation ---------------------------------------------- */
{g:'viz',n:'choropleth',sig:"choropleth(string \\$property, string \\$scale = 'quantile')",def:"'quantile'",
 d:'Colour polygons by a numeric property. quantile gives every bucket the same number of features; linear splits the range evenly. Colours come from the whole dataset, so filtering never changes them.',
 ex:"->choropleth('population')",ctl:'choropleth'},
{g:'viz',n:'filterable',sig:"filterable(string \\$property)",def:'—',
 d:'Emit a layer checkbox per distinct value of the property, derived from the data rather than configured.',
 ex:"->filterable('status')",ctl:'filterable'},
{g:'viz',n:'timeline',sig:"timeline(string \\$property)",def:'—',
 d:'Add a time slider with playback. Features accumulate up to the selected moment; steps are the distinct timestamps in the data.',
 ex:"->timeline('recorded_at')",ctl:'timeline'},
{g:'viz',n:'route',sig:"route(bool \\$enabled = true)",def:'false',
 d:'Join the points in order into a path and report the total great-circle distance on hover.',
 ex:'->route()',ctl:'route'},
{g:'viz',n:'elevationProfile',sig:"elevationProfile(bool \\$enabled = true)",def:'false',
 d:'Chart the third coordinate of each position beneath the map. Geometry without elevation renders nothing.',
 ex:'->elevationProfile()',ctl:'elevation'},
{g:'viz',n:'legend',sig:"legend(bool \\$enabled = true)",def:'false',
 d:'Render value ranges for a choropleth, or categories for a filterable map. Renders nothing when neither applies.',
 ex:'->legend()',ctl:'legend'},

/* --- chrome ----------------------------------------------------- */
{g:'chrome',n:'height',sig:"height(string \\$height)",def:"config: '300px'",
 d:'The map’s height.',ex:"->height('480px')",ctl:'height'},
{g:'chrome',n:'center',sig:"center(float \\$latitude, float \\$longitude)",def:'config: 45.6495, 13.7768',
 d:'The view used when a record has no geometry at all. Validated against the real coordinate ranges.',
 ex:'->center(45.6495, 13.7768)',ctl:'center'},
{g:'chrome',n:'zoom',sig:"zoom(int \\$zoom)",def:'config: 12',
 d:'The zoom used when a record has no geometry.',ex:'->zoom(14)',ctl:'zoom'},
{g:'chrome',n:'fit',sig:"fit(int \\$padding = 24, ?int \\$maxZoom = 16)",def:'24, 16',
 d:'How the map frames its geometry. maxZoom matters most for a single point, where fitting bounds exactly would zoom to street level and lose all context.',
 ex:'->fit(padding: 40, maxZoom: 15)',ctl:'fit'},
{g:'chrome',n:'maxBounds',sig:"maxBounds(float \\$s, float \\$w, float \\$n, float \\$e)",def:'null',
 d:'Stop the map being panned outside the given box.',ex:'->maxBounds(45.0, 12.0, 47.0, 14.5)',ctl:'maxBounds'},
{g:'chrome',n:'fullscreen',sig:"fullscreen(bool \\$enabled = true)",def:'false',
 d:'Add a fullscreen button.',ex:'->fullscreen()',ctl:'fullscreen'},
{g:'chrome',n:'scaleControl',sig:"scaleControl(bool \\$enabled = true)",def:'false',
 d:'Add a metric scale bar.',ex:'->scaleControl()',ctl:'scaleControl'},
{g:'chrome',n:'locateControl',sig:"locateControl(bool \\$enabled = true)",def:'false',
 d:'Add a locate button that centres on the viewer.',ex:'->locateControl()',ctl:'locateControl'},
{g:'chrome',n:'scrollWheelZoom',sig:"scrollWheelZoom(bool \\$enabled = true)",def:'true',
 d:'Whether the wheel zooms the map. Worth turning off on any map inside a long form, where it hijacks page scrolling.',
 ex:'->scrollWheelZoom(false)',ctl:'scrollWheelZoom'},
{g:'chrome',n:'copyable',sig:"copyable(bool \\$enabled = true)",def:'true',
 d:'Show a copy-coordinates button.',ex:'->copyable(false)',ctl:'copyable'},
{g:'chrome',n:'deeplinks',sig:"deeplinks(bool \\$enabled = true)",def:'false',
 d:'Show links that open the location in Google Maps, Apple Maps, OpenStreetMap and Waze.',
 ex:'->deeplinks()',ctl:'deeplinks'},
{g:'chrome',n:'exportData',sig:"exportData(bool \\$enabled = true)",def:'false',
 d:'Offer GeoJSON and GPX downloads of the field’s geometry.',ex:'->exportData()',ctl:'exportData'},
{g:'chrome',n:'accessibleTable',sig:"accessibleTable(bool \\$enabled = true)",def:'false',
 d:'Render a visually hidden table of features and coordinates. A Leaflet map is opaque to a screen reader; this gives one an equivalent view.',
 ex:'->accessibleTable()',ctl:'accessibleTable'},
{g:'chrome',n:'coordinateFormat',sig:"coordinateFormat(CoordinateFormat \\$format)",def:'Decimal',
 d:'Decimal degrees, or degrees-minutes-seconds.',ex:'->coordinateFormat(CoordinateFormat::Dms)',ctl:'coordinateFormat'},

/* --- index ------------------------------------------------------ */
{g:'index',n:'showOnIndex',sig:'showOnIndex()',def:'false',
 d:'Show the coordinates as text in the index column.',ex:'->showOnIndex()',ctl:'indexMode'},
{g:'index',n:'snapshot',sig:"snapshot(bool \\$enabled = true)",def:'false',
 d:'Show a cached static map image in the index column — one lazily loaded <img> per row.',
 ex:'->snapshot()',ctl:'indexMode'},
{g:'index',n:'thumbnail',sig:"thumbnail(bool \\$enabled = true)",def:'false',
 d:'Show a live mini-map in the index column. Builds a real Leaflet instance per row, so prefer snapshot() on long tables.',
 ex:'->thumbnail()',ctl:'indexMode',danger:true},
{g:'legacy',n:'type',sig:"type(MapType|string \\$type)",def:'—',deprecated:true,
 d:'The 2.x geometry hint. 3.0 detects the shape of a resolved value instead of being told, so this only exists to keep 2.x resources working. Removed in 4.0.',
 ex:"->type('LatLon')"},

{g:'index',n:'linkToResource',sig:"linkToResource(?string \\$resource = null)",def:'false',
 d:'Navigate to a record’s detail page when its marker is clicked. Only useful with relation().',
 ex:'->linkToResource()',ctl:'linkToResource'},
];

const TILE_CASES = [
  {v:'osm',          label:'OpenStreetMap', enum:'Tile::OpenStreetMap', key:false, dark:false, mutant:false, maxZoom:20,
   url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
   attr:'&copy; <a target="_blank" rel="noopener" href="https://osm.org/copyright">OpenStreetMap</a> contributors'},
  {v:'carto-light',  label:'Light',         enum:'Tile::CartoLight', key:false, dark:false, mutant:false, maxZoom:20,
   url:'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr:'&copy; OpenStreetMap contributors &copy; CARTO'},
  {v:'carto-dark',   label:'Dark',          enum:'Tile::CartoDark', key:false, dark:true, mutant:false, maxZoom:20,
   url:'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr:'&copy; OpenStreetMap contributors &copy; CARTO'},
  {v:'carto-voyager',label:'Voyager',       enum:'Tile::CartoVoyager', key:false, dark:false, mutant:false, maxZoom:20,
   url:'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', attr:'&copy; OpenStreetMap contributors &copy; CARTO'},
  {v:'satellite',    label:'Satellite',     enum:'Tile::Satellite', key:false, dark:false, mutant:false, maxZoom:19,
   url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr:'Tiles &copy; Esri'},
  {v:'topo',         label:'Topographic',   enum:'Tile::Topo', key:false, dark:false, mutant:false, maxZoom:17,
   url:'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr:'&copy; OpenTopoMap'},
  {v:'stadia-dark',  label:'Stadia Dark',   enum:'Tile::StadiaDark', key:false, dark:true, mutant:false, maxZoom:20,
   url:'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', attr:'&copy; Stadia Maps'},
  {v:'google',       label:'Google',        enum:'Tile::Google', key:'googleKey', dark:false, mutant:true, maxZoom:20,
   url:null, attr:'&copy; Google'},
  {v:'mapbox',       label:'Mapbox',        enum:'Tile::Mapbox', key:'mapboxKey', dark:false, mutant:false, maxZoom:20,
   url:'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=…', attr:'&copy; Mapbox'},
  {v:'maptiler',     label:'MapTiler',      enum:'Tile::MapTiler', key:'maptilerKey', dark:false, mutant:false, maxZoom:20,
   url:'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=…', attr:'&copy; MapTiler'},
];

const SHAPE_CASES = [
  {v:'Marker',label:'Point',enum:'Shape::Point'},
  {v:'Line',label:'Line',enum:'Shape::Line'},
  {v:'Polygon',label:'Polygon',enum:'Shape::Polygon'},
  {v:'Rectangle',label:'Rectangle',enum:'Shape::Rectangle'},
  {v:'Circle',label:'Circle',enum:'Shape::Circle'},
  {v:'CircleMarker',label:'Circle marker',enum:'Shape::CircleMarker'},
];

/* The configuration file, key by key, with the real defaults. */
const CONFIG_KEYS = [
  {k:'height',def:"'300px'",type:'text',val:'300px',d:'Map height for fields that do not set one.'},
  {k:'center.latitude',def:'45.6495',type:'num',val:45.6495,d:'Latitude used when a record has no geometry.'},
  {k:'center.longitude',def:'13.7768',type:'num',val:13.7768,d:'Longitude used when a record has no geometry.'},
  {k:'zoom',def:'12',type:'num',val:12,d:'Zoom used when a record has no geometry.'},
  {k:'tiles.providers',def:"['osm', 'carto-light']",type:'tiles',val:['osm','carto-light'],d:'Layers offered, in switcher order.'},
  {k:'tiles.dark',def:"'carto-dark'",type:'select',opts:['carto-dark','stadia-dark'],val:'carto-dark',d:'Layer swapped in when Nova is dark.'},
  {k:'cluster.enabled',def:'true',type:'bool',val:true,d:'Whether clustering applies at all.'},
  {k:'cluster.disable_at_zoom',def:'11',type:'num',val:11,d:'Zoom past which markers separate.'},
  {k:'cluster.min_features',def:'10',type:'num',val:10,d:'Below this count, clustering is skipped.'},
  {k:'canvas_threshold',def:'1000',type:'num',val:1000,d:'Above this count, Leaflet switches to canvas and drops per-feature popups.'},
  {k:'popups.sanitize',def:'true',type:'bool',val:true,d:'Whether allowed HTML is still sanitised in the browser. Turning this off is a security decision.',danger:true},
  {k:'google.key',def:"env('NOVA_FIELD_MAP_GOOGLE_KEY')",type:'env',val:'',env:'NOVA_FIELD_MAP_GOOGLE_KEY',d:'Browser key for the Google basemap. Restrict it by HTTP referrer.'},
  {k:'google.map_type',def:"'roadmap'",type:'select',opts:['roadmap','satellite','terrain','hybrid'],val:'roadmap',d:'Default Google basemap style.'},
  {k:'geocoder.driver',def:"'nominatim'",type:'select',opts:['nominatim','mapbox','maptiler','null'],val:'nominatim',d:'Which geocoding driver the search box uses.'},
  {k:'geocoder.user_agent',def:"env('APP_NAME').' (nova-field-map)'",type:'text',val:'Acme (nova-field-map)',d:'Sent to Nominatim, whose policy requires identification.'},
  {k:'geocoder.mapbox_key',def:"env('NOVA_FIELD_MAP_MAPBOX_KEY')",type:'env',val:'',env:'NOVA_FIELD_MAP_MAPBOX_KEY',d:'Mapbox geocoding key. Never reaches the browser.'},
  {k:'geocoder.maptiler_key',def:"env('NOVA_FIELD_MAP_MAPTILER_KEY')",type:'env',val:'',env:'NOVA_FIELD_MAP_MAPTILER_KEY',d:'MapTiler geocoding key. Never reaches the browser.'},
  {k:'geocoder.cache_ttl',def:'86400',type:'num',val:86400,d:'Seconds to cache lookups; 0 disables caching.'},
  {k:'snapshot.width',def:'160',type:'num',val:160,d:'Snapshot width in pixels.'},
  {k:'snapshot.height',def:'90',type:'num',val:90,d:'Snapshot height in pixels.'},
  {k:'snapshot.zoom',def:'12',type:'num',val:12,d:'Snapshot zoom level.'},
];

/* ============================================================
   THE PLAYGROUND ENGINE

   S is the builder state. Three pure functions read it:
     toPhp()      — the fluent chain a developer would write
     toPayload()  — the meta array the field serialises, mirroring
                    mapMeta() in src/FieldMap.php
     renderPreview() — what Nova would draw

   toPayload() reproduces the PHP defaults deliberately: cluster is
   forced off below cluster.min_features, useCanvas flips above
   canvas_threshold, a keyed tile with no key is dropped. Those are
   the behaviours people are surprised by, so the payload has to
   show them rather than describe them.
   ============================================================ */
const DEFAULTS = {
  source:'attribute', attribute:'coordinates', latCol:'lat', lngCol:'lng',
  relation:'branches', featureCount:1,
  editable:false, draw:['Marker'], geocoder:false, geolocation:true, manualInputs:true,
  nudgeStep:0.0001, fillsAddress:false, syncTo:false, storeAs:'geojson',
  popup:'', tooltip:'', allowHtml:false,
  tiles:['osm','carto-light'], darkTile:'carto-dark', darkMode:true,
  googleKey:false, googleMapType:'roadmap',
  markerIcon:'', markerColor:'', cluster:null, clusterZoom:11, clusterColorBy:'',
  heatmap:false, choropleth:'', filterable:'', timeline:'', route:false,
  elevation:false, legend:false,
  height:'300px', centerLat:45.6495, centerLng:13.7768, zoom:12,
  fitPadding:24, fitMaxZoom:16, maxBounds:false,
  fullscreen:false, scaleControl:false, locateControl:false, scrollWheelZoom:true,
  copyable:true, deeplinks:false, exportData:false, accessibleTable:false,
  coordinateFormat:'decimal', indexMode:'hidden', linkToResource:false,
};
let S = {...DEFAULTS};

const PRESETS = {
  minimal: {label:'Read-only map', d:'The default. Two arguments, nothing else.', s:{}},
  editable:{label:'Editable + search', d:'A form field an administrator can place.',
            s:{editable:true, geocoder:true, height:'400px', scrollWheelZoom:false}},
  locator: {label:'Store locator', d:'A relation, clustered and clickable.',
            s:{source:'relation', featureCount:40, popup:'name', tooltip:'city',
               linkToResource:true, markerColor:'#16a34a', filterable:'status',
               legend:true, cluster:true, clusterZoom:12, height:'520px',
               tiles:['carto-light','satellite'], fullscreen:true}},
  address: {label:'Address form', d:'A dropped pin fills the address fields.',
            s:{editable:true, geocoder:true, fillsAddress:true, height:'400px', scrollWheelZoom:false}},
  zone:    {label:'Delivery zone', d:'A polygon the administrator draws.',
            s:{editable:true, draw:['Polygon','Rectangle'], geocoder:true,
               height:'520px', scrollWheelZoom:false, storeAs:'geojson', featureCount:1}},
  choro:   {label:'Choropleth', d:'Regions coloured by a number, with a legend.',
            s:{source:'relation', relation:'regions', attribute:'boundary', featureCount:20,
               choropleth:'population_density', legend:true, popup:'name',
               cluster:false, tiles:['carto-light'], height:'600px'}},
  track:   {label:'GPS track', d:'A route with playback and an elevation chart.',
            s:{attribute:'track', featureCount:120, route:true, elevation:true,
               timeline:'recorded_at', exportData:true, height:'480px', cluster:false}},
  index:   {label:'Index snapshot', d:'A cached image per row, not a live map.',
            s:{indexMode:'snapshot', copyable:false}},
  legacy:  {label:'A 2.x chain', d:'What an unmigrated resource still does.',
            s:{source:'point', popup:'I am a Popup', height:'400px'}},
};

/* --- helpers --------------------------------------------------- */
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tileOf = v => TILE_CASES.find(t => t.v === v);

/* Mirrors Support\Coordinates::toDms(), including the rounding carry. */
function toDms(value, pos, neg){
  const hemi = value >= 0 ? pos : neg;
  value = Math.abs(value);
  let deg = Math.floor(value);
  const minDec = (value - deg) * 60;
  let min = Math.floor(minDec);
  let sec = (minDec - min) * 60;
  if (Math.round(sec * 10) / 10 >= 60) { sec = 0; min++; }
  if (min >= 60) { min = 0; deg++; }
  return `${deg}°${String(min).padStart(2,'0')}'${sec.toFixed(1).padStart(4,'0')}"${hemi}`;
}
const fmtCoords = (lat, lng) => S.coordinateFormat === 'dms'
  ? `${toDms(lat,'N','S')} ${toDms(lng,'E','W')}`
  : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

/* Which tiles actually survive serialisation. A keyed provider with
   no key is dropped; if that empties the list, OSM is substituted. */
function resolvedTiles(){
  const out = S.tiles.map(tileOf).filter(t => t && (!t.key || S[t.key]));
  return out.length ? out : [tileOf('osm')];
}

/* --- 1 · the PHP chain ------------------------------------------ */
function toPhp(){
  const L = [];
  const uses = new Set(['Gabrielesbaiz\\NovaFieldMap\\FieldMap']);

  let head;
  if (S.source === 'columns')      head = `FieldMap::make('Location')`;
  else if (S.source === 'relation')head = `FieldMap::make('Branches', '${S.attribute}')`;
  else if (S.source === 'point')   head = `FieldMap::make('Location')`;
  else                              head = `FieldMap::make('Location', '${S.attribute}')`;

  if (S.source === 'columns')  L.push(`->coordinates('${S.latCol}', '${S.lngCol}')`);
  if (S.source === 'relation') L.push(`->relation('${S.relation}')`);
  if (S.source === 'point')    L.push(`->point(${S.centerLat}, ${S.centerLng})`);

  if (S.editable && !S.syncTo && S.draw.join() === 'Marker') L.push('->editable()');
  if (S.draw.join() !== 'Marker') {
    uses.add('Gabrielesbaiz\\NovaFieldMap\\Enums\\Shape');
    L.push(`->draw(${S.draw.map(d => SHAPE_CASES.find(s => s.v === d).enum).join(', ')})`);
  }
  if (S.geocoder && !S.fillsAddress) L.push('->geocoder()');
  if (S.fillsAddress) L.push(`->fillsAddress([\n        'street'       => 'street',\n        'postcode'     => 'postcode',\n        'city'         => 'city',\n        'country_code' => 'country_code',\n    ])`);
  if (!S.geolocation)  L.push('->geolocation(false)');
  if (!S.manualInputs) L.push('->manualInputs(false)');
  if (S.nudgeStep !== DEFAULTS.nudgeStep) L.push(`->nudgeStep(${S.nudgeStep})`);
  if (S.syncTo) L.push(`->syncTo('${S.latCol}', '${S.lngCol}')`);
  if (S.storeAs === 'latlng')  L.push('->storeAsLatLngString()');
  if (S.storeAs === 'columns') L.push('->storeAsColumns()');

  if (S.popup)     L.push(`->popup('${S.popup}')`);
  if (S.allowHtml) L.push('->allowHtmlPopups()');
  if (S.tooltip)   L.push(`->tooltip('${S.tooltip}')`);

  if (S.tiles.join() !== DEFAULTS.tiles.join()) {
    uses.add('Gabrielesbaiz\\NovaFieldMap\\Enums\\Tile');
    L.push(`->tiles(${S.tiles.map(v => tileOf(v).enum).join(', ')})`);
  }
  if (S.darkTile !== DEFAULTS.darkTile) {
    uses.add('Gabrielesbaiz\\NovaFieldMap\\Enums\\Tile');
    L.push(`->darkTile(${tileOf(S.darkTile).enum})`);
  }
  if (!S.darkMode) L.push('->darkMode(false)');
  if (S.googleKey) L.push('->googleApiKey()');
  if (S.googleKey && S.googleMapType !== 'roadmap') {
    uses.add('Gabrielesbaiz\\NovaFieldMap\\Enums\\GoogleMapType');
    L.push(`->googleMapType(GoogleMapType::${S.googleMapType[0].toUpperCase()+S.googleMapType.slice(1)})`);
  }

  if (S.markerIcon)  L.push(`->markerIcon('${S.markerIcon}')`);
  if (S.markerColor) L.push(`->markerUsing(fn (array $feature) => ['color' => '${S.markerColor}'])`);
  if (S.cluster === false) L.push('->withoutClustering()');
  if (S.cluster === true)  L.push(S.clusterZoom !== 11 ? `->cluster(disableAtZoom: ${S.clusterZoom})` : '->cluster()');
  if (S.clusterColorBy) L.push(`->clusterColorBy('${S.clusterColorBy}')`);
  if (S.heatmap) L.push('->heatmap()');

  if (S.choropleth) L.push(`->choropleth('${S.choropleth}')`);
  if (S.filterable) L.push(`->filterable('${S.filterable}')`);
  if (S.timeline)   L.push(`->timeline('${S.timeline}')`);
  if (S.route)      L.push('->route()');
  if (S.elevation)  L.push('->elevationProfile()');
  if (S.legend)     L.push('->legend()');

  if (S.height !== DEFAULTS.height) L.push(`->height('${S.height}')`);
  if (S.centerLat !== DEFAULTS.centerLat || S.centerLng !== DEFAULTS.centerLng)
    if (S.source !== 'point') L.push(`->center(${S.centerLat}, ${S.centerLng})`);
  if (S.zoom !== DEFAULTS.zoom) L.push(`->zoom(${S.zoom})`);
  if (S.fitPadding !== 24 || S.fitMaxZoom !== 16) L.push(`->fit(padding: ${S.fitPadding}, maxZoom: ${S.fitMaxZoom})`);
  if (S.maxBounds) L.push('->maxBounds(45.0, 12.0, 47.0, 14.5)');
  if (S.fullscreen)     L.push('->fullscreen()');
  if (S.scaleControl)   L.push('->scaleControl()');
  if (S.locateControl)  L.push('->locateControl()');
  if (!S.scrollWheelZoom) L.push('->scrollWheelZoom(false)');
  if (!S.copyable)      L.push('->copyable(false)');
  if (S.deeplinks)      L.push('->deeplinks()');
  if (S.exportData)     L.push('->exportData()');
  if (S.accessibleTable)L.push('->accessibleTable()');
  if (S.coordinateFormat === 'dms') {
    uses.add('Gabrielesbaiz\\NovaFieldMap\\Enums\\CoordinateFormat');
    L.push('->coordinateFormat(CoordinateFormat::Dms)');
  }
  if (S.indexMode === 'text')      L.push('->showOnIndex()');
  if (S.indexMode === 'snapshot')  L.push('->snapshot()');
  if (S.indexMode === 'thumbnail') L.push('->thumbnail()');
  if (S.linkToResource) L.push('->linkToResource()');

  const useLines = [...uses].sort().map(u => `use ${u};`).join('\n');
  const chain = L.length ? head + '\n    ' + L.join('\n    ') : head;
  return `${useLines}\n\npublic function fields(NovaRequest $request): array\n{\n    return [\n        ${chain.split('\n').join('\n        ')},\n    ];\n}`;
}

/* --- 2 · the serialised payload --------------------------------- */
function toPayload(){
  const n = S.featureCount;
  const minFeatures = 10, canvasThreshold = 1000;

  /* cluster() default comes from config, then is forced off for a
     handful of markers — exactly as markerMeta() does. */
  let cluster = S.cluster === null ? true : S.cluster;
  if (n < minFeatures) cluster = false;

  const tiles = resolvedTiles().map(t => ({
    key:t.v, label:t.label, url:t.url, attribution:t.attr,
    maxZoom:t.maxZoom, dark:t.dark, mutant:t.mutant,
  }));

  const dark = tileOf(S.darkTile);
  const has = n > 0;

  return {
    height:S.height,
    center:[S.centerLat, S.centerLng],
    zoom:S.zoom,
    fitPadding:S.fitPadding,
    fitMaxZoom:S.fitMaxZoom,
    maxBounds:S.maxBounds ? [[45,12],[47,14.5]] : null,
    fullscreen:S.fullscreen, scaleControl:S.scaleControl, locateControl:S.locateControl,
    exportData:S.exportData, legend:S.legend, accessibleTable:S.accessibleTable,
    copyable:S.copyable, deeplinks:S.deeplinks, scrollWheelZoom:S.scrollWheelZoom,
    filterProperty:S.filterable || null,
    timelineProperty:S.timeline || null,
    route:S.route, elevationProfile:S.elevation,
    coordinateFormat:S.coordinateFormat,

    tiles,
    darkTile:S.darkMode ? {key:dark.v,label:dark.label,url:dark.url,attribution:dark.attr,
                           maxZoom:dark.maxZoom,dark:dark.dark,mutant:dark.mutant} : null,
    darkMode:S.darkMode,
    googleApiKey:S.googleKey ? '…from config…' : null,
    googleMapType:S.googleMapType,

    markerIcon:S.markerIcon || null, markerIconSize:null, markerIconAnchor:null,
    cluster, clusterDisableAtZoom:S.clusterZoom,
    clusterColorProperty:S.clusterColorBy || null,
    heatmap:S.heatmap, heatmapProperty:null,
    choroplethProperty:S.choropleth || null, choroplethScale:'quantile',
    useCanvas:n > canvasThreshold,

    popupProperty:S.popup || null,
    allowHtmlPopups:S.allowHtml,
    sanitizePopups:true,

    editable:S.editable || S.syncTo || S.draw.join() !== 'Marker',
    shapes:S.draw,
    geocoder:S.geocoder || S.fillsAddress,
    geolocation:S.geolocation, manualInputs:S.manualInputs,
    nudgeStep:S.nudgeStep,
    addressTargets:S.fillsAddress
      ? {street:'street', postcode:'postcode', city:'city', country_code:'country_code'} : {},
    syncLatitudeField:S.syncTo ? S.latCol : null,
    syncLongitudeField:S.syncTo ? S.lngCol : null,
    storeAs:S.syncTo ? 'none' : S.storeAs,
    singleShape:S.draw.join() === 'Marker',

    geojson:{type:'FeatureCollection', features:`[ ${n} feature${n===1?'':'s'} ]`},
    featureCount:n,
    bounds:has ? [[S.centerLat, S.centerLng],[S.centerLat, S.centerLng]] : null,
    latitude:has ? S.centerLat : null,
    longitude:has ? S.centerLng : null,
    formattedCoordinates:has ? fmtCoords(S.centerLat, S.centerLng) : null,
    linkToResource:S.linkToResource,
    thumbnail:S.indexMode === 'thumbnail',
    snapshotUrl:S.indexMode === 'snapshot'
      ? `https://staticmap.openstreetmap.de/staticmap.php?center=${S.centerLat},${S.centerLng}&zoom=12&size=160x90&markers=…`
      : null,
    assetBaseUrl:'/nova-vendor/nova-field-map/asset',
  };
}

/* Payload, syntax-highlighted, with the derived values flagged. */
const DERIVED = {
  cluster:'forced off below cluster.min_features (10)',
  useCanvas:'flips above canvas_threshold (1000)',
  tiles:'a keyed provider with no key is dropped here',
  storeAs:'syncTo() forces this to "none"',
  editable:'draw() and syncTo() imply it',
  geocoder:'fillsAddress() implies it',
  singleShape:'true only when the sole shape is a point',
  formattedCoordinates:'rendered by Support\\Coordinates',
};
function payloadHtml(){
  const p = toPayload();
  return Object.entries(p).map(([k, v]) => {
    let val;
    if (v === null) val = '<span class="pv-null">null</span>';
    else if (typeof v === 'boolean') val = `<span class="pv-bool">${v}</span>`;
    else if (typeof v === 'number') val = `<span class="pv-num">${v}</span>`;
    else if (Array.isArray(v) || typeof v === 'object')
      val = `<span class="pv-obj">${esc(JSON.stringify(v))}</span>`;
    else val = `<span class="pv-str">"${esc(v)}"</span>`;
    const note = DERIVED[k] ? `<em title="${esc(DERIVED[k])}">derived</em>` : '';
    return `<div class="pg-row"><code>${k}</code>${val}${note}</div>`;
  }).join('');
}

/* ============================================================
   CONTROLS — declarative, one entry per thing you can set.
   `m` names the method it drives, so every control links back to
   the reference entry and nothing here can describe a method the
   package does not have.
   ============================================================ */
const CONTROLS = [
 ['Geometry', [
   {k:'source',t:'seg',m:'coordinates',label:'Where the coordinates come from',
    opts:[['attribute','One column'],['columns','Two columns'],['relation','A relation'],['point','Set directly']]},
   {k:'attribute',t:'text',label:'Column',show:s=>s.source!=='columns'&&s.source!=='point'},
   {k:'latCol',t:'text',label:'Latitude column',show:s=>s.source==='columns'||s.syncTo},
   {k:'lngCol',t:'text',label:'Longitude column',show:s=>s.source==='columns'||s.syncTo},
   {k:'relation',t:'text',label:'Relation',show:s=>s.source==='relation'},
   {k:'featureCount',t:'range',min:0,max:1500,step:1,label:'Features on the map',m:'relation',
    hint:'Drives clustering and the canvas threshold in the payload.'},
 ]],
 ['Editing', [
   {k:'editable',t:'bool',m:'editable',label:'Editable on forms'},
   {k:'draw',t:'multi',m:'draw',label:'Shapes the user may draw',opts:()=>SHAPE_CASES.map(s=>[s.v,s.label])},
   {k:'geocoder',t:'bool',m:'geocoder',label:'Place search box'},
   {k:'fillsAddress',t:'bool',m:'fillsAddress',label:'Fill address fields from the pin'},
   {k:'syncTo',t:'bool',m:'syncTo',label:'Drive two existing number fields'},
   {k:'storeAs',t:'seg',m:'storeAsGeoJson',label:'Store the value as',
    opts:[['geojson','GeoJSON'],['latlng','"lat,lng"'],['columns','Two columns']],show:s=>!s.syncTo},
   {k:'geolocation',t:'bool',m:'geolocation',label:'“Use my location” button'},
   {k:'manualInputs',t:'bool',m:'manualInputs',label:'Latitude / longitude inputs'},
   {k:'nudgeStep',t:'num',m:'nudgeStep',label:'Arrow-key step (degrees)',step:0.00001},
 ]],
 ['Popups', [
   {k:'popup',t:'text',m:'popup',label:'Popup from property',placeholder:'name'},
   {k:'tooltip',t:'text',m:'tooltip',label:'Tooltip from property',placeholder:'city'},
   {k:'allowHtml',t:'bool',m:'allowHtmlPopups',label:'Allow HTML in popups',danger:true,
    hint:'Escaped by default. This is the 2.x XSS hole, behind an opt-in.'},
 ]],
 ['Tiles', [
   {k:'tiles',t:'multi',m:'tiles',label:'Layers offered',opts:()=>TILE_CASES.map(t=>[t.v,t.label])},
   {k:'googleKey',t:'bool',m:'googleApiKey',label:'Google API key configured',danger:true,
    hint:'Without it, Tile::Google is dropped from the payload entirely.'},
   {k:'googleMapType',t:'seg',m:'googleMapType',label:'Google style',show:s=>s.googleKey,
    opts:[['roadmap','Roadmap'],['satellite','Satellite'],['terrain','Terrain'],['hybrid','Hybrid']]},
   {k:'darkMode',t:'bool',m:'darkMode',label:'Follow Nova’s theme'},
   {k:'darkTile',t:'seg',m:'darkTile',label:'Dark layer',show:s=>s.darkMode,
    opts:[['carto-dark','Carto Dark'],['stadia-dark','Stadia Dark']]},
 ]],
 ['Markers', [
   {k:'markerColor',t:'color',m:'markerUsing',label:'Marker colour'},
   {k:'markerIcon',t:'text',m:'markerIcon',label:'Custom icon URL',placeholder:'/images/pin.png'},
   {k:'cluster',t:'seg',m:'cluster',label:'Clustering',
    opts:[[null,'Config'],[true,'On'],[false,'Off']]},
   {k:'clusterZoom',t:'range',min:5,max:18,step:1,m:'cluster',label:'Stop clustering at zoom',
    show:s=>s.cluster!==false},
   {k:'clusterColorBy',t:'text',m:'clusterColorBy',label:'Colour clusters by',placeholder:'status'},
   {k:'heatmap',t:'bool',m:'heatmap',label:'Heat layer instead of markers'},
 ]],
 ['Visualisation', [
   {k:'choropleth',t:'text',m:'choropleth',label:'Choropleth by property',placeholder:'population'},
   {k:'filterable',t:'text',m:'filterable',label:'Category filter by',placeholder:'status'},
   {k:'timeline',t:'text',m:'timeline',label:'Timeline by property',placeholder:'recorded_at'},
   {k:'route',t:'bool',m:'route',label:'Join the points into a route'},
   {k:'elevation',t:'bool',m:'elevationProfile',label:'Elevation profile'},
   {k:'legend',t:'bool',m:'legend',label:'Legend'},
 ]],
 ['Viewport and chrome', [
   {k:'height',t:'text',m:'height',label:'Height'},
   {k:'centerLat',t:'num',m:'center',label:'Centre latitude',step:0.0001},
   {k:'centerLng',t:'num',m:'center',label:'Centre longitude',step:0.0001},
   {k:'zoom',t:'range',min:1,max:19,step:1,m:'zoom',label:'Zoom'},
   {k:'fitPadding',t:'range',min:0,max:80,step:4,m:'fit',label:'Fit padding'},
   {k:'fitMaxZoom',t:'range',min:8,max:19,step:1,m:'fit',label:'Fit max zoom'},
   {k:'maxBounds',t:'bool',m:'maxBounds',label:'Clamp panning to a box'},
   {k:'fullscreen',t:'bool',m:'fullscreen',label:'Fullscreen button'},
   {k:'scaleControl',t:'bool',m:'scaleControl',label:'Scale bar'},
   {k:'locateControl',t:'bool',m:'locateControl',label:'Locate button'},
   {k:'scrollWheelZoom',t:'bool',m:'scrollWheelZoom',label:'Wheel zooms the map'},
   {k:'copyable',t:'bool',m:'copyable',label:'Copy-coordinates button'},
   {k:'deeplinks',t:'bool',m:'deeplinks',label:'Open-in links'},
   {k:'exportData',t:'bool',m:'exportData',label:'GeoJSON / GPX download'},
   {k:'accessibleTable',t:'bool',m:'accessibleTable',label:'Screen-reader table'},
   {k:'coordinateFormat',t:'seg',m:'coordinateFormat',label:'Coordinate format',
    opts:[['decimal','Decimal'],['dms','DMS']]},
 ]],
 ['Index and navigation', [
   {k:'indexMode',t:'seg',m:'snapshot',label:'In the index column',
    opts:[['hidden','Hidden'],['text','Coordinates'],['snapshot','Snapshot'],['thumbnail','Live map']]},
   {k:'linkToResource',t:'bool',m:'linkToResource',label:'Marker click opens the record'},
 ]],
];

/* --- rendering the controls -------------------------------------
   The column is long — 58 methods long — so it is not all on screen
   at once. Groups collapse, a search box filters by label or method
   name, and "Changed" hides everything still at its default. A
   control that differs from the default carries an accent rule and
   its own undo, so what you have touched is readable at a glance. */
const OPEN = new Set(['Geometry', 'Editing']);
let FILTER = '', CHANGED_ONLY = false;

const sameValue = (a, b) => Array.isArray(a) && Array.isArray(b)
  ? a.length === b.length && a.every((x, i) => x === b[i])
  : a === b;
const isDirty = c => !sameValue(S[c.k], DEFAULTS[c.k]);

/* A control is visible when its `show` predicate passes, the search
   matches, and — with the filter on — it differs from the default. */
function visibleControls(name, list){
  const q = FILTER.trim().toLowerCase();
  return list.filter(c => {
    if (c.show && !c.show(S)) return false;
    if (CHANGED_ONLY && !isDirty(c)) return false;
    if (!q) return true;
    return (c.label + ' ' + (c.m || '') + ' ' + name).toLowerCase().includes(q);
  });
}

function controlHtml(c){
  const v = S[c.k];
  const id = 'c-' + c.k;
  const dirty = isDirty(c);
  const link = c.m ? `<a class="pg-m" href="#/api?m=${c.m}" title="Read about ${c.m}()">${c.m}()</a>` : '';
  const undo = dirty ? `<button class="pg-undo" data-undo="${c.k}" title="Back to the default">undo</button>` : '';
  const hint = c.hint ? `<span class="pg-hint">${esc(c.hint)}</span>` : '';
  let body = '';

  if (c.t === 'bool')
    body = `<button class="pg-tog${v?' on':''}${c.danger?' danger':''}" data-k="${c.k}" role="switch"
              aria-checked="${!!v}" id="${id}"><i></i></button>`;
  else if (c.t === 'seg')
    body = `<div class="pg-seg" role="group">` + c.opts.map(([ov, ol]) =>
      `<button data-k="${c.k}" data-v="${ov}" class="${String(v)===String(ov)?'on':''}">${ol}</button>`).join('') + `</div>`;
  else if (c.t === 'multi') {
    const opts = typeof c.opts === 'function' ? c.opts() : c.opts;
    body = `<div class="pg-chips">` + opts.map(([ov, ol]) =>
      `<button data-multi="${c.k}" data-v="${ov}" class="${v.includes(ov)?'on':''}">${ol}</button>`).join('') + `</div>`;
  }
  else if (c.t === 'range')
    body = `<div class="pg-range"><input type="range" id="${id}" data-k="${c.k}" min="${c.min}" max="${c.max}"
              step="${c.step}" value="${v}"><output>${v}</output></div>`;
  else if (c.t === 'num')
    body = `<input class="pg-in" type="number" id="${id}" data-k="${c.k}" step="${c.step||1}" value="${v}">`;
  else if (c.t === 'color')
    body = `<div class="pg-color"><input type="color" id="${id}" data-k="${c.k}" value="${v||'#2563eb'}">
             <button class="pg-clear" data-clear="${c.k}" ${v?'':'hidden'}>clear</button></div>`;
  else
    body = `<input class="pg-in" type="text" id="${id}" data-k="${c.k}" value="${esc(v||'')}"
              placeholder="${esc(c.placeholder||'')}" spellcheck="false">`;

  return `<div class="pg-ctl${c.danger?' is-danger':''}${dirty?' dirty':''}">
    <label for="${id}">${esc(c.label)} ${link}${undo}</label>${body}${hint}</div>`;
}

function dirtyCount(list){ return list.filter(c => (!c.show || c.show(S)) && isDirty(c)).length; }

function renderControls(){
  const host = document.getElementById('pgControls');
  if (!host) return;

  const searching = FILTER.trim() !== '' || CHANGED_ONLY;
  const total = CONTROLS.reduce((n, [name, list]) => n + dirtyCount(list), 0);

  const groups = CONTROLS.map(([name, list]) => {
    const rows = visibleControls(name, list);
    if (!rows.length) return '';
    /* While filtering, every surviving group is open — hunting for a
       control you can see but cannot reach is the worst outcome. */
    const open = searching || OPEN.has(name);
    const n = dirtyCount(list);
    const mark = n ? `<span class="badge" title="${n} changed from the default">${n}</span>`
                   : `<span class="ct">${rows.length}</span>`;
    return `<section class="pg-group${open?' open':''}" data-group="${esc(name)}">
      <button class="pg-gh" data-toggle="${esc(name)}" aria-expanded="${open}">
        <span class="cv">▸</span><span class="nm">${esc(name)}</span>${mark}</button>
      <div class="pg-gb">${rows.map(controlHtml).join('')}</div>
    </section>`;
  }).join('');

  const empty = CHANGED_ONLY && !total
    ? `<p class="pg-none">Nothing is changed from the default yet.<br>
       <button data-off="changed">Show every control</button></p>`
    : `<p class="pg-none">No control matches “${esc(FILTER)}”.<br>
       <button data-off="find">Clear the search</button></p>`;

  host.innerHTML = `
    <div class="pg-find">
      <input id="pgFind" type="search" placeholder="Find a control or method…"
             value="${esc(FILTER)}" spellcheck="false" aria-label="Filter controls">
      <button class="pg-changed${CHANGED_ONLY?' on':''}" id="pgChanged" aria-pressed="${CHANGED_ONLY}">
        Changed ${total ? `· ${total}` : ''}</button>
    </div>
    <div class="pg-scroll" id="pgScroll">${groups || empty}</div>`;

  /* Re-rendering blows away focus; typing in the search box must survive it. */
  if (FOCUS_FIND) {
    const f = document.getElementById('pgFind');
    if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
  }
  const sc = document.getElementById('pgScroll');
  if (sc) sc.scrollTop = SCROLL_TOP;
}
let FOCUS_FIND = false, SCROLL_TOP = 0;

/* --- the preview ------------------------------------------------ */
const PIN = c => `<svg viewBox="0 0 18 26"><path d="M9 0C4 0 0 4 0 9c0 7 9 17 9 17s9-10 9-17c0-5-4-9-9-9z"
  fill="${c}"/><circle cx="9" cy="9" r="3.4" fill="#fff"/></svg>`;

function renderPreview(){
  const host = document.getElementById('pgPreview');
  if (!host) return;
  const p = toPayload();
  const colour = S.markerColor || 'var(--accent)';
  /* The real field honours height() exactly; here it is clamped so a
     600px map does not push the payload pane off the screen. */
  const px = Math.min(520, Math.max(180, parseInt(S.height, 10) || 300));

  /* Index modes render the column, not the detail panel. */
  if (S.indexMode !== 'hidden') {
    const cell = S.indexMode === 'text'
      ? `<span class="pg-chipv">${esc(p.formattedCoordinates || '—')}</span>`
      : S.indexMode === 'snapshot'
        ? `<span class="pg-snap">static image<br><small>160×90, lazily loaded</small></span>`
        : `<span class="pg-thumb">live map<br><small>one Leaflet instance</small></span>`;
    host.innerHTML = `<div class="pg-index"><div class="pg-ihead">Warehouses</div>
      ${[1,2,3].map(i => `<div class="pg-irow"><b>Site ${i}</b>${cell}</div>`).join('')}
      ${S.indexMode==='thumbnail'
        ? `<p class="pg-warn">Three rows here; a real table is fifty. Prefer <code>snapshot()</code>.</p>` : ''}
      </div>
      <p class="pg-cap">The detail map is unaffected — switch “In the index column” back to Hidden to see it.</p>`;
    return;
  }

  const layers = p.tiles.map(t => t.label);
  const heat = S.heatmap;
  const choro = !!S.choropleth;

  host.innerHTML = `
  <div class="pg-panel">
    <div class="pg-phead"><b>Warehouse</b><span>${S.editable||S.syncTo||p.editable ? 'Update' : 'Detail'}</span></div>
    <div class="pg-prow"><div class="pg-k">Location</div><div class="pg-v">
      ${p.geocoder ? `<div class="pg-search">⌕&nbsp; Search for a place</div>` : ''}
      <div class="pg-map" style="height:${px}px">
        <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="400" height="220" fill="color-mix(in srgb,var(--accent) 5%,var(--wash))"/>
          <path d="M0 165 C 60 155 100 178 150 163 S 250 136 400 155 L400 220 L0 220Z"
                fill="color-mix(in srgb,var(--ink) 8%,transparent)"/>
          <path d="M0 55 H400 M0 110 H400 M0 165 H400 M80 0 V220 M160 0 V220 M240 0 V220 M320 0 V220"
                stroke="var(--rule)" stroke-width=".8"/>
          ${choro ? `<g opacity=".85">
            <path d="M30 40 L140 30 L150 110 L40 120 Z" fill="#bfdbfe" stroke="#fff" stroke-width="2"/>
            <path d="M150 110 L40 120 L60 195 L170 185 Z" fill="#60a5fa" stroke="#fff" stroke-width="2"/>
            <path d="M140 30 L280 45 L270 120 L150 110 Z" fill="#2563eb" stroke="#fff" stroke-width="2"/>
            <path d="M280 45 L380 60 L370 130 L270 120 Z" fill="#1d4ed8" stroke="#fff" stroke-width="2"/></g>` : ''}
          ${S.route ? `<path d="M50 180 L120 150 L175 100 L250 85 L340 60" fill="none"
                stroke="${colour}" stroke-width="4" opacity=".9"/>` : ''}
          ${heat ? `<g>${[[110,120,44],[190,90,34],[265,130,28],[310,75,22]].map(([x,y,r])=>
              `<circle cx="${x}" cy="${y}" r="${r}" fill="${colour}" opacity=".28"/>`).join('')}</g>` : ''}
        </svg>

        ${p.editable ? `<div class="pg-draw">${S.draw.map(d=>{
            const L = SHAPE_CASES.find(s=>s.v===d);
            return `<b title="${L.label}">${{Marker:'📍',Line:'╱',Polygon:'⬠',Rectangle:'▭',Circle:'◯',CircleMarker:'•'}[d]}</b>`;
          }).join('')}<b title="Drag">✥</b><b title="Remove">⌫</b></div>` : ''}

        <div class="pg-ctrls"><b>+</b><b>−</b>${S.fullscreen?'<b title="Fullscreen">⛶</b>':''}${S.locateControl?'<b title="Locate">◎</b>':''}</div>
        ${layers.length>1 ? `<div class="pg-layers" title="${esc(layers.join(' · '))}">▤</div>` : ''}

        ${!heat && !choro ? (p.cluster
          ? `<div class="pg-cluster" style="--c:${colour};left:32%;top:48%">${Math.round(S.featureCount*0.6)}</div>
             <div class="pg-cluster sm" style="--c:${colour};left:70%;top:36%">${Math.max(1,Math.round(S.featureCount*0.25))}</div>
             <div class="pg-pin" style="left:52%;top:70%">${PIN(colour)}</div>`
          : (S.featureCount>0 ? [[52,70],[34,52],[72,44]].slice(0, Math.min(3, S.featureCount))
              .map(([l,t])=>`<div class="pg-pin" style="left:${l}%;top:${t}%">${PIN(colour)}</div>`).join('')
            : `<div class="pg-empty">No geometry — falls back to <code>center()</code> and <code>zoom()</code></div>`)) : ''}

        ${S.popup && S.featureCount>0 && !heat ? `<div class="pg-bubble" style="left:52%;top:68%">${
           S.allowHtml ? '<b>'+esc(S.popup)+'</b> <i>html</i>' : esc(S.popup)+' <i>escaped</i>'}</div>` : ''}

        ${S.scaleControl ? `<div class="pg-scale"><i></i>500 m</div>` : ''}
        <div class="pg-attr">© OpenStreetMap</div>
      </div>

      ${S.timeline ? `<div class="pg-time"><button>▶</button><input type="range" value="40" aria-label="${esc(S.timeline)}"><span>${esc(S.timeline)}</span></div>` : ''}
      ${S.elevation ? `<svg class="pg-elev" viewBox="0 0 400 54" preserveAspectRatio="none" aria-label="Elevation">
          <path d="M0 42 L60 26 L110 34 L170 12 L240 30 L300 18 L400 36 L400 54 L0 54Z"
                fill="color-mix(in srgb,var(--accent) 18%,transparent)"/>
          <path d="M0 42 L60 26 L110 34 L170 12 L240 30 L300 18 L400 36" fill="none"
                stroke="var(--accent)" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>` : ''}
      ${S.legend && (choro || S.filterable) ? `<div class="pg-legend">${
          choro ? ['#bfdbfe','#60a5fa','#2563eb','#1d4ed8'].map((c,i)=>
              `<span><i style="background:${c}"></i>${i*250}–${(i+1)*250}</span>`).join('')
                : ['open','closed','refurbishing'].map((c,i)=>
              `<span><i style="background:${['#2563eb','#dc2626','#16a34a'][i]}"></i>${c}</span>`).join('')}</div>` : ''}
      ${S.filterable ? `<div class="pg-filters">${['open','closed','refurbishing'].map(c=>
          `<label><input type="checkbox" checked>${c}</label>`).join('')}</div>` : ''}

      ${p.manualInputs && p.editable && p.singleShape ? `<div class="pg-inputs">
          <div><label>Latitude</label><input value="${S.centerLat}" readonly></div>
          <div><label>Longitude</label><input value="${S.centerLng}" readonly></div></div>` : ''}

      ${(S.copyable||S.deeplinks||S.exportData||(p.editable&&S.geolocation)) ? `<div class="pg-tools">
        ${p.editable&&S.geolocation?'<b>Use my location</b>':''}
        ${S.copyable?`<b>Copy coordinates</b>`:''}
        ${S.deeplinks?'<b>Google Maps</b><b>Apple Maps</b><b>OSM</b><b>Waze</b>':''}
        ${S.exportData?'<b>GeoJSON</b><b>GPX</b>':''}</div>` : ''}
      ${S.accessibleTable ? `<p class="pg-cap">Plus a visually hidden table of ${S.featureCount} coordinate${S.featureCount===1?'':'s'} for screen readers.</p>` : ''}
    </div></div>
    ${p.formattedCoordinates ? `<div class="pg-prow"><div class="pg-k">Resolved</div>
       <div class="pg-v"><span class="pg-chipv">${esc(p.formattedCoordinates)}</span></div></div>` : ''}
  </div>`;
}

/* --- notes that explain what the current state implies ---------- */
function renderNotes(){
  const host = document.getElementById('pgNotes');
  if (!host) return;
  const p = toPayload(), out = [];

  if (S.featureCount < 10 && S.cluster !== false)
    out.push(['Clustering is off', `Fewer than <code>cluster.min_features</code> (10) features, so it is skipped whatever you set.`]);
  if (p.useCanvas)
    out.push(['Canvas renderer', `Above <code>canvas_threshold</code> (1000). Per-feature popups are dropped for a shared one.`]);
  if (S.tiles.includes('google') && !S.googleKey)
    out.push(['Google was dropped', `No API key, so it never reaches the payload — the switcher would show a dead entry otherwise.`]);
  if (S.allowHtml)
    out.push(['HTML popups are on', `Content is still sanitised by DOMPurify. Only do this when the column is written by trusted users.`, true]);
  if (S.syncTo)
    out.push(['This field writes nothing', `<code>storeAs</code> is <code>"none"</code>; the two number fields keep owning their columns.`]);
  if (S.indexMode === 'thumbnail')
    out.push(['A Leaflet instance per row', `Fifty rows is fifty maps. <code>snapshot()</code> is one image each.`, true]);
  if (S.heatmap && S.popup)
    out.push(['Popups do not apply', `A heat layer replaces markers entirely.`]);
  if (S.featureCount === 0)
    out.push(['No geometry', `The map falls back to <code>center()</code> and <code>zoom()</code> instead of throwing — which is what 2.x did.`]);
  if (S.scrollWheelZoom && parseInt(S.height,10) >= 400)
    out.push(['Wheel zoom on a tall map', `Inside a long form this hijacks page scrolling. Consider <code>scrollWheelZoom(false)</code>.`]);

  host.innerHTML = out.length
    ? out.map(([t, d, warn]) => `<div class="pg-note${warn?' warn':''}"><b>${t}</b><span>${d}</span></div>`).join('')
    : `<div class="pg-note"><b>Nothing surprising</b><span>No derived value differs from what the chain asks for.</span></div>`;
}

/* --- wiring ------------------------------------------------------ */
function pgSync(){ renderControls(); paint(); }
function paint(){
  const php = document.getElementById('pgPhp');
  if (php) php.innerHTML = highlightPhp(toPhp());
  const pay = document.getElementById('pgPayload');
  if (pay) pay.innerHTML = payloadHtml();
  const mode = document.getElementById('pgMode');
  if (mode) mode.textContent = S.indexMode !== 'hidden' ? 'Index column'
    : (toPayload().editable ? 'Update form' : 'Detail panel');
  renderPreview();
  renderNotes();
}

function highlightPhp(code){
  return esc(code)
    .replace(/(\/\/[^\n]*)/g, '<span class="c">$1</span>')
    .replace(/&#039;[^&]*?&#039;|'[^']*'/g, m => `<span class="s">${m}</span>`)
    .replace(/\b(use|public|function|return|array|fn|true|false|null)\b/g, '<span class="k">$1</span>')
    .replace(/(-&gt;|::)([a-zA-Z]+)\(/g, '$1<span class="f">$2</span>(');
}

/* Presets set the whole state, so any later edit makes the selection
   a lie. Touching a control drops the highlight and says so. */
let PRESET = 'minimal';
function setPreset(key){
  PRESET = key;
  document.querySelectorAll('#pgPresets button').forEach(x =>
    x.classList.toggle('on', x.dataset.preset === key));
  const note = document.getElementById('pgPresetNote');
  if (note) note.innerHTML = key
    ? `<b>${esc(PRESETS[key].label)}.</b> ${esc(PRESETS[key].d)}`
    : `<b>Custom.</b> Edited by hand — pick a preset above to start over, or Reset for the defaults.`;
}

function mountPlayground(){
  S = {...DEFAULTS};
  FILTER = ''; CHANGED_ONLY = false; FOCUS_FIND = false; SCROLL_TOP = 0;
  OPEN.clear(); OPEN.add('Geometry');
  if (window.innerWidth >= 1080) OPEN.add('Editing');

  const host = document.getElementById('pgControls');
  if (!host) return;

  const remember = () => {
    const sc = document.getElementById('pgScroll');
    SCROLL_TOP = sc ? sc.scrollTop : 0;
  };
  const touched = () => { if (PRESET) setPreset(null); };

  host.addEventListener('click', ev => {
    remember();

    const gh = ev.target.closest('[data-toggle]');
    if (gh) {
      const name = gh.dataset.toggle;
      OPEN.has(name) ? OPEN.delete(name) : OPEN.add(name);
      FOCUS_FIND = false;
      return renderControls();
    }
    const off = ev.target.closest('[data-off]');
    if (off) {
      if (off.dataset.off === 'changed') CHANGED_ONLY = false; else FILTER = '';
      FOCUS_FIND = false;
      return renderControls();
    }
    if (ev.target.closest('#pgChanged')) {
      CHANGED_ONLY = !CHANGED_ONLY; SCROLL_TOP = 0; FOCUS_FIND = false;
      return renderControls();
    }
    const undo = ev.target.closest('[data-undo]');
    if (undo) {
      const k = undo.dataset.undo;
      S[k] = Array.isArray(DEFAULTS[k]) ? [...DEFAULTS[k]] : DEFAULTS[k];
      touched(); FOCUS_FIND = false; return pgSync();
    }

    const tog = ev.target.closest('[data-k][role="switch"]');
    if (tog) { S[tog.dataset.k] = !S[tog.dataset.k]; touched(); FOCUS_FIND = false; return pgSync(); }
    const seg = ev.target.closest('.pg-seg button');
    if (seg) {
      const raw = seg.dataset.v;
      S[seg.dataset.k] = raw === 'true' ? true : raw === 'false' ? false : raw === 'null' ? null : raw;
      touched(); FOCUS_FIND = false; return pgSync();
    }
    const chip = ev.target.closest('[data-multi]');
    if (chip) {
      const k = chip.dataset.multi, v = chip.dataset.v, list = [...S[k]];
      const i = list.indexOf(v);
      if (i > -1) { if (list.length > 1) list.splice(i, 1); } else list.push(v);
      S[k] = list; touched(); FOCUS_FIND = false; return pgSync();
    }
    const clr = ev.target.closest('[data-clear]');
    if (clr) { S[clr.dataset.clear] = ''; touched(); FOCUS_FIND = false; return pgSync(); }
  });

  host.addEventListener('input', ev => {
    const find = ev.target.closest('#pgFind');
    if (find) {
      FILTER = find.value; FOCUS_FIND = true; SCROLL_TOP = 0;
      return renderControls();
    }
    const el = ev.target.closest('[data-k]');
    if (!el || el.getAttribute('role') === 'switch') return;
    remember();
    const k = el.dataset.k;
    S[k] = el.type === 'number' || el.type === 'range' ? Number(el.value) : el.value;
    touched();
    /* A live range or a keystroke must not re-render the control it is
       driving — that would drop focus mid-drag. Only paint the stage,
       and mark the row dirty in place. */
    const row = el.closest('.pg-ctl');
    if (row) row.classList.toggle('dirty', !sameValue(S[k], DEFAULTS[k]));
    if (el.type === 'range') { const o = el.parentElement.querySelector('output'); if (o) o.textContent = el.value; }
    if (el.type === 'color') { const c = row?.querySelector('.pg-clear'); if (c) c.hidden = !el.value; }
    paint();
  });

  document.getElementById('pgPresets')?.addEventListener('click', ev => {
    const b = ev.target.closest('[data-preset]');
    if (!b) return;
    S = {...DEFAULTS, ...PRESETS[b.dataset.preset].s};
    SCROLL_TOP = 0; FOCUS_FIND = false;
    setPreset(b.dataset.preset);
    pgSync();
  });

  document.getElementById('pgTabs')?.addEventListener('click', ev => {
    const b = ev.target.closest('[data-tab]');
    if (!b) return;
    document.querySelectorAll('#pgTabs [data-tab]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('.pg-pane').forEach(x => x.classList.toggle('hidden', x.dataset.pane !== b.dataset.tab));
  });

  document.getElementById('pgCopy')?.addEventListener('click', async ev => {
    const btn = ev.currentTarget;
    const onPayload = document.querySelector('#pgTabs [data-tab="payload"]')?.getAttribute('aria-selected') === 'true';
    const text = onPayload ? JSON.stringify(toPayload(), null, 2) : toPhp();
    try { await navigator.clipboard.writeText(text); } catch (e) {}
    btn.textContent = 'Copied'; setTimeout(() => btn.textContent = 'Copy', 1400);
  });

  document.getElementById('pgReset')?.addEventListener('click', () => {
    S = {...DEFAULTS};
    FILTER = ''; CHANGED_ONLY = false; SCROLL_TOP = 0; FOCUS_FIND = false;
    setPreset('minimal');
    pgSync();
  });

  setPreset('minimal');
  pgSync();
}

/* ============================================================
   PAGE CONTENT — every page in the inventory, filled from the
   repository's README.md, UPGRADE.md and CHANGELOG.md.
   ============================================================ */
const e = s => s;   /* content below is authored HTML, kept inline */

const PAGES = {

/* ---------------------------------------------------------- */
intro: {
  title: 'Introduction',
  nav: 'Introduction',
  sub: 'What FieldMap is, what it refuses to do, and when two number fields are the better answer.',
  prev: null, next: 'install',
  html: `
<section id="i-what"><h2>What it is</h2>
<p>A Leaflet map field for Laravel Nova 5. It resolves the coordinate column your model already has,
detects what shape the value is in, and renders it — as a read-only map on the detail page, an
editable map on forms, or a coordinate chip in the index.</p>
<p>It is an ordinary Nova field. It resolves its own attribute, so <code>dependsOn()</code>,
<code>resolveUsing()</code>, filling and validation all work. 2.x could not do that: data was pushed
in at <code>make()</code> time, which is why every 2.x example starts with <code>type()</code>.</p>
<pre><span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\FieldMap</span>;

FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'coordinates'</span>)</pre>
</section>

<section id="i-shapes"><h2>What it understands</h2>
<p>Resolution order, first match wins: a spatial value object, GeoJSON, a <code>"lat,lng"</code>
string, an array. A value none of them recognise renders as an empty map centred on
<code>center()</code> rather than as an error.</p>
<div class="tw"><table>
<thead><tr><th>Stored value</th><th>Read as</th></tr></thead>
<tbody>
<tr><td><code>'45.6495,13.7768'</code></td><td>A single point. Space- and semicolon-separated also work.</td></tr>
<tr><td><code>[45.6495, 13.7768]</code></td><td>A positional pair, latitude first.</td></tr>
<tr><td><code>['lat' =&gt; …, 'lng' =&gt; …]</code></td><td>Also <code>latitude</code>/<code>longitude</code>, <code>lon</code>, <code>long</code>, and capitalised spellings.</td></tr>
<tr><td>GeoJSON</td><td>A <code>FeatureCollection</code>, a <code>Feature</code>, a bare geometry, or a list of any of those.</td></tr>
<tr><td>A spatial object</td><td>Anything exposing <code>toGeoJson()</code>, <code>toJson()</code>, or public <code>latitude</code>/<code>longitude</code>.</td></tr>
</tbody></table></div>
<div class="note"><b>GeoJSON positions are longitude first.</b> Plain coordinate pairs — strings and
arrays — are read latitude first, matching how people say them and how Leaflet's <code>LatLng</code>
works. The package converts between the two for you; you only need to care when hand-writing
GeoJSON.</div>
</section>

<section id="i-need"><h2>Do you need this?</h2>
<p>If all you need is to show a latitude and a longitude, you do not. Two <code>Number</code> fields
are less JavaScript, less to go wrong, and an administrator who knows the coordinates can type
them.</p>
<p>You want this package when the <em>shape of the place</em> is the information: when somebody has
to confirm a warehouse is on the right side of the motorway, see fifty branches at once and notice
the gap, drop a pin because they know where the site is but not its coordinates, or check that a
delivery zone polygon covers the estate. None of that survives being reduced to two numbers.</p>
<p>The trade is size. A map is roughly 52&nbsp;kB gzipped of Leaflet that two number fields are not,
and it only loads on pages that render one — but on those pages, it loads. If your index tables
need a location column and nothing more, use <code>snapshot()</code> or two numbers.</p>
</section>

<section id="i-trade"><h2>What it will not do</h2>
<ul>
<li><b>Rasterise a map to PNG.</b> Canvas tainting blocks it on most tile providers, so
<code>exportImage()</code> was removed rather than shipped as a button that fails on most installs.
<code>exportData()</code> gives GeoJSON and GPX instead.</li>
<li><b>Run a Nova action from inside a popup.</b> It needs more of Nova's form runtime than a Leaflet
popup can carry. Use <code>linkToResource()</code> and run the action on the detail page.</li>
<li><b>Filter a GeoJSON column by map bounds.</b> <code>MapBoundsFilter</code> constrains two numeric
columns; a GeoJSON column would need a spatial index this package cannot assume exists.</li>
<li><b>Render popup markup by default.</b> That was the 2.x stored-XSS hole. Markup is opt-in and
still sanitised.</li>
</ul>
</section>`
},

/* ---------------------------------------------------------- */
install: {
  title: 'Installation',
  nav: 'Installation',
  sub: 'Composer, the publish tags, and the first thing to run when something looks wrong.',
  prev: 'intro', next: 'configuration',
  html: `
<section id="n-req"><h2>Requirements</h2>
<div class="tw"><table>
<thead><tr><th></th><th>Version</th></tr></thead>
<tbody>
<tr><td>PHP</td><td><code>^8.2</code></td></tr>
<tr><td>Laravel</td><td><code>^11.0 | ^12.0 | ^13.0</code></td></tr>
<tr><td>Laravel Nova</td><td><code>^5.0</code></td></tr>
</tbody></table></div>
<p>Nova 4 is not supported. Stay on 2.x until you upgrade Nova.</p>
</section>

<section id="n-install"><h2>Install</h2>
<pre>composer require gabrielesbaiz/nova-field-map</pre>
<p>That is all that is required. The package works with no configuration at all: it uses
OpenStreetMap tiles, which need no key, and Nominatim for place search, which needs no key either.</p>
</section>

<section id="n-publish"><h2>Publish what you need</h2>
<pre><span class="c"># Change the defaults</span>
php artisan vendor:publish --tag=nova-field-map-config

<span class="c"># Edit the strings (English and Italian ship with it)</span>
php artisan vendor:publish --tag=nova-field-map-lang</pre>
<p>Neither is required. The config file is merged, so an unpublished install uses the packaged
defaults, and translations fall back to English.</p>
</section>

<section id="n-first"><h2>First run</h2>
<p>Add the field to a resource whose model has a coordinate column:</p>
<pre><span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\FieldMap</span>;

<span class="k">public function</span> <span class="f">fields</span>(NovaRequest $request): <span class="k">array</span>
{
    <span class="k">return</span> [
        ID::<span class="f">make</span>()-&gt;<span class="f">sortable</span>(),
        Text::<span class="f">make</span>(<span class="s">'Name'</span>),
        FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'coordinates'</span>),
    ];
}</pre>
<p>Then verify the installation:</p>
<pre>php artisan nova-field-map:doctor</pre>
<div class="note"><b>Installed from a git clone?</b> The built assets live in <code>dist/</code>. A
Packagist install ships them; a clone may not. <code>doctor</code> tells you, and the fix is
<code>npm install &amp;&amp; npm run build</code> in the package directory.</div>
</section>`
},

/* ---------------------------------------------------------- */
configuration: {
  title: 'Configuration',
  nav: 'Configuration',
  sub: 'Build the file by setting the values, then copy it. Every key, its default, and what changing it does.',
  prev: 'install', next: 'guide',
  html: `
<section id="c-build"><h2>Build your config</h2>
<p>Set anything below and the file writes itself. The defaults shown are the ones the package ships,
so an untouched panel emits exactly what <code>vendor:publish</code> would give you.</p>
<div class="cfg">
  <div class="cfg-left" id="cfgControls"></div>
  <div>
    <div class="cfg-right">
      <div class="cfg-head">config/nova-field-map.php <button id="cfgCopy">Copy</button></div>
      <pre class="cfg-out" id="cfgOut"></pre>
      <div class="cfg-head">.env</div>
      <pre class="cfg-env" id="cfgEnv"></pre>
    </div>
    <div class="pg-notes" id="cfgWarn"></div>
  </div>
</div>
</section>

<section id="c-map"><h2>Map defaults</h2>
<div class="tw"><table>
<thead><tr><th>Key</th><th>Default</th><th>Effect</th></tr></thead>
<tbody>
<tr><td><code>height</code></td><td><code>'300px'</code></td><td>Map height for fields that do not set one.</td></tr>
<tr><td><code>center.latitude</code></td><td><code>45.6495</code></td><td>Latitude used when a record has no geometry.</td></tr>
<tr><td><code>center.longitude</code></td><td><code>13.7768</code></td><td>Longitude used when a record has no geometry.</td></tr>
<tr><td><code>zoom</code></td><td><code>12</code></td><td>Zoom used when a record has no geometry.</td></tr>
</tbody></table></div>
<p>The centre is only used when a record has nothing to show. Anything else would leave an unusable
map — which is what 2.x rendered, after throwing <code>Bounds are not valid</code>.</p>
</section>

<section id="c-tiles"><h2>Tiles</h2>
<div class="tw"><table>
<thead><tr><th>Key</th><th>Default</th><th>Effect</th></tr></thead>
<tbody>
<tr><td><code>tiles.providers</code></td><td><code>['osm', 'carto-light']</code></td><td>Layers offered, in switcher order.</td></tr>
<tr><td><code>tiles.dark</code></td><td><code>'carto-dark'</code></td><td>Layer swapped in when Nova is dark.</td></tr>
<tr><td><code>tiles.custom</code></td><td><code>[]</code></td><td>Your own providers, keyed by name.</td></tr>
</tbody></table></div>
<p>A custom provider needs a URL template and an attribution string:</p>
<pre><span class="s">'custom'</span> =&gt; [
    <span class="s">'company'</span> =&gt; [
        <span class="s">'label'</span>       =&gt; <span class="s">'Company Tiles'</span>,
        <span class="s">'url'</span>         =&gt; <span class="s">'https://tiles.example.com/{z}/{x}/{y}.png'</span>,
        <span class="s">'attribution'</span> =&gt; <span class="s">'&amp;copy; Example Ltd'</span>,
        <span class="s">'max_zoom'</span>    =&gt; <span class="k">18</span>,
        <span class="s">'dark'</span>        =&gt; <span class="k">false</span>,
    ],
],</pre>
<p>Then reference it by key: <code>-&gt;tiles('company')</code>.</p>
</section>

<section id="c-density"><h2>Clustering and density</h2>
<div class="tw"><table>
<thead><tr><th>Key</th><th>Default</th><th>Effect</th></tr></thead>
<tbody>
<tr><td><code>cluster.enabled</code></td><td><code>true</code></td><td>Whether clustering applies at all.</td></tr>
<tr><td><code>cluster.disable_at_zoom</code></td><td><code>11</code></td><td>Zoom past which markers separate.</td></tr>
<tr><td><code>cluster.min_features</code></td><td><code>10</code></td><td>Below this count, clustering is skipped.</td></tr>
<tr><td><code>canvas_threshold</code></td><td><code>1000</code></td><td>Above this count, Leaflet switches to the canvas renderer and drops per-feature popups.</td></tr>
</tbody></table></div>
<p>Clustering a handful of markers adds a click between the user and the data without making
anything more readable, which is why <code>min_features</code> exists.</p>
</section>

<section id="c-popups"><h2>Popups</h2>
<div class="tw"><table>
<thead><tr><th>Key</th><th>Default</th><th>Effect</th></tr></thead>
<tbody>
<tr><td><code>popups.sanitize</code></td><td><code>true</code></td><td>Whether allowed HTML is still sanitised in the browser.</td></tr>
</tbody></table></div>
<div class="note warn"><b>Turning this off is a security decision.</b> It means any user who can write
the popup column can run JavaScript in an administrator's authenticated session. See
<a href="#/security">Security</a>.</div>
</section>

<section id="c-keys"><h2>Keys and geocoding</h2>
<div class="tw"><table>
<thead><tr><th>Key</th><th>Default</th><th>Effect</th></tr></thead>
<tbody>
<tr><td><code>google.key</code></td><td><code>env('NOVA_FIELD_MAP_GOOGLE_KEY')</code></td><td>Browser key for the Google basemap.</td></tr>
<tr><td><code>google.map_type</code></td><td><code>'roadmap'</code></td><td>Default Google basemap style.</td></tr>
<tr><td><code>geocoder.driver</code></td><td><code>'nominatim'</code></td><td><code>nominatim</code>, <code>mapbox</code>, <code>maptiler</code> or <code>null</code>.</td></tr>
<tr><td><code>geocoder.user_agent</code></td><td>app name</td><td>Sent to Nominatim, whose policy requires identification.</td></tr>
<tr><td><code>geocoder.mapbox_key</code></td><td><code>env(…MAPBOX_KEY)</code></td><td>Mapbox geocoding key.</td></tr>
<tr><td><code>geocoder.maptiler_key</code></td><td><code>env(…MAPTILER_KEY)</code></td><td>MapTiler geocoding key.</td></tr>
<tr><td><code>geocoder.cache_ttl</code></td><td><code>86400</code></td><td>Seconds to cache lookups; <code>0</code> disables caching.</td></tr>
</tbody></table></div>
<pre><span class="c"># .env</span>
NOVA_FIELD_MAP_GOOGLE_KEY=
NOVA_FIELD_MAP_MAPBOX_KEY=
NOVA_FIELD_MAP_MAPTILER_KEY=</pre>
</section>

<section id="c-snapshot"><h2>Snapshots</h2>
<div class="tw"><table>
<thead><tr><th>Key</th><th>Default</th><th>Effect</th></tr></thead>
<tbody>
<tr><td><code>snapshot.url</code></td><td>OSM static map</td><td>Template for <code>snapshot()</code>; receives <code>{lat}</code>, <code>{lng}</code>, <code>{zoom}</code>, <code>{width}</code>, <code>{height}</code>.</td></tr>
<tr><td><code>snapshot.width</code></td><td><code>160</code></td><td>Snapshot width in pixels.</td></tr>
<tr><td><code>snapshot.height</code></td><td><code>90</code></td><td>Snapshot height in pixels.</td></tr>
<tr><td><code>snapshot.zoom</code></td><td><code>12</code></td><td>Snapshot zoom level.</td></tr>
</tbody></table></div>
</section>`
},

/* ---------------------------------------------------------- */
guide: {
  title: 'Guide',
  nav: 'Guide',
  sub: 'Reading geometry, editing on forms, popups, tiles, markers and the index column.',
  prev: 'configuration', next: 'recipes',
  html: `
<section id="g-read"><h2>Reading geometry</h2>
<p>Five ways, in precedence order. The first that applies wins.</p>
<pre><span class="c">// 1 · the field's own attribute — the default</span>
FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'coordinates'</span>)

<span class="c">// 2 · two columns</span>
FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>)-&gt;<span class="f">coordinates</span>(<span class="s">'lat'</span>, <span class="s">'lng'</span>)

<span class="c">// 3 · a relation, one marker per related record</span>
FieldMap::<span class="f">make</span>(<span class="s">'Branches'</span>, <span class="s">'coordinates'</span>)-&gt;<span class="f">relation</span>(<span class="s">'branches'</span>)

<span class="c">// 4 · computed</span>
FieldMap::<span class="f">make</span>(<span class="s">'Service area'</span>)
    -&gt;<span class="f">geometryUsing</span>(<span class="k">fn</span> (Store $store) =&gt; $store-&gt;<span class="f">deliveryZone</span>()-&gt;<span class="f">toGeoJson</span>())

<span class="c">// 5 · set directly, no model lookup</span>
FieldMap::<span class="f">make</span>(<span class="s">'Head office'</span>)-&gt;<span class="f">point</span>(<span class="k">45.6495</span>, <span class="k">13.7768</span>)</pre>
<div class="note"><b>Eager-load the relation</b> or you pay an extra query per record shown:
<code>public static $with = ['branches'];</code></div>

<h3>Custom resolvers</h3>
<p>Teach the field about a value object of your own. Custom resolvers are tried <em>before</em> the
built-in chain, so they can override built-in behaviour for their own types.</p>
<pre><span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\Contracts\\GeometryResolver</span>;
<span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\Resolvers\\ResolverRegistry</span>;
<span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\Support\\GeoJson</span>;

<span class="k">final class</span> <span class="f">PlusCodeResolver</span> <span class="k">implements</span> GeometryResolver
{
    <span class="k">public function</span> <span class="f">supports</span>(<span class="k">mixed</span> $value): <span class="k">bool</span>
    {
        <span class="k">return</span> <span class="f">is_string</span>($value) &amp;&amp; <span class="f">str_contains</span>($value, <span class="s">'+'</span>);
    }

    <span class="k">public function</span> <span class="f">toGeoJson</span>(<span class="k">mixed</span> $value): <span class="k">array</span>
    {
        [$latitude, $longitude] = PlusCode::<span class="f">decode</span>($value);

        <span class="k">return</span> GeoJson::<span class="f">point</span>($latitude, $longitude);
    }
}

<span class="c">// in a service provider's boot()</span>
ResolverRegistry::<span class="f">register</span>(<span class="k">new</span> PlusCodeResolver);</pre>
</section>

<section id="g-edit"><h2>Editing on forms</h2>
<p>The field is detail-only until you say otherwise.</p>
<pre>FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'coordinates'</span>)-&gt;<span class="f">editable</span>()</pre>
<p>That shows the map on create and update forms with a draggable marker and a click-to-place map.
Every edit — drag, draw, nudge, typed input, geocoder pick — is undoable.</p>

<h3>Drawing shapes</h3>
<pre><span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\Enums\\Shape</span>;

FieldMap::<span class="f">make</span>(<span class="s">'Delivery zone'</span>, <span class="s">'zone'</span>)
    -&gt;<span class="f">draw</span>(Shape::Polygon, Shape::Rectangle)</pre>
<p>Available: <code>Point</code>, <code>Line</code>, <code>Polygon</code>, <code>Rectangle</code>,
<code>Circle</code>, <code>CircleMarker</code>. <code>draw()</code> implies <code>editable()</code>.
A field restricted to <code>Shape::Point</code> <b>replaces</b> rather than accumulates — two pins
for one address is never what was meant.</p>

<h3>Where the value is stored</h3>
<div class="tw"><table>
<thead><tr><th>Method</th><th>Writes</th><th>Use when</th></tr></thead>
<tbody>
<tr><td><code>storeAsGeoJson()</code></td><td>A GeoJSON <code>FeatureCollection</code> as JSON</td><td>Default. The column is <code>json</code> or <code>text</code>.</td></tr>
<tr><td><code>storeAsLatLngString()</code></td><td><code>"45.6495,13.7768"</code></td><td>The column is a single string.</td></tr>
<tr><td><code>storeAsColumns()</code></td><td>Two columns</td><td>Used with <code>coordinates()</code>.</td></tr>
</tbody></table></div>
<p>An emptied map writes <code>null</code>.</p>

<h3>Place search, and filling address fields</h3>
<pre>FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'coordinates'</span>)
    -&gt;<span class="f">editable</span>()
    -&gt;<span class="f">fillsAddress</span>([
        <span class="s">'street'</span>       =&gt; <span class="s">'address_line'</span>,
        <span class="s">'house_number'</span> =&gt; <span class="s">'street_number'</span>,
        <span class="s">'city'</span>         =&gt; <span class="s">'city'</span>,
        <span class="s">'postcode'</span>     =&gt; <span class="s">'zip'</span>,
        <span class="s">'country_code'</span> =&gt; <span class="s">'country_code'</span>,
    ]),</pre>
<p>Keys are the normalised address components, identical across drivers. Values are the Nova field
attributes to fill. <code>fillsAddress()</code> implies <code>geocoder()</code>. A component the
provider did not return leaves its target field untouched rather than blanking it.</p>
<p>Requests go through your own application, never from the browser to the provider, so keys stay
server-side and one cache entry serves every administrator who searches the same place.</p>

<h3>Driving two existing fields</h3>
<p><code>syncTo()</code> lets a resource adopt the map with no schema change at all. The map writes
nothing; the two number fields keep owning their columns.</p>
<pre>FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>)
    -&gt;<span class="f">coordinates</span>(<span class="s">'lat'</span>, <span class="s">'lng'</span>)
    -&gt;<span class="f">syncTo</span>(<span class="s">'lat'</span>, <span class="s">'lng'</span>),

Number::<span class="f">make</span>(<span class="s">'Lat'</span>)-&gt;<span class="f">step</span>(<span class="k">0.000001</span>),
Number::<span class="f">make</span>(<span class="s">'Lng'</span>)-&gt;<span class="f">step</span>(<span class="k">0.000001</span>),</pre>
</section>

<section id="g-popups"><h2>Popups and tooltips</h2>
<pre><span class="c">// escaped — the default</span>
-&gt;<span class="f">popup</span>(<span class="s">'name'</span>)

<span class="c">// built server-side; a View or Htmlable is trusted markup,</span>
<span class="c">// a plain string is still escaped</span>
-&gt;<span class="f">popupUsing</span>(<span class="k">fn</span> (<span class="k">array</span> $feature) =&gt; <span class="f">view</span>(<span class="s">'nova.branch-popup'</span>, $feature[<span class="s">'properties'</span>]))

<span class="c">// explicit opt-in; still sanitised in the browser</span>
-&gt;<span class="f">allowHtmlPopups</span>()

<span class="c">// always escaped, no opt-out</span>
-&gt;<span class="f">tooltip</span>(<span class="s">'city'</span>)</pre>
<div class="note warn"><b>Only allow HTML when the content is authored by trusted users.</b> This is
the hole 2.x had by default — see <a href="#/security">Security</a>.</div>
</section>

<section id="g-tiles"><h2>Tiles and dark mode</h2>
<pre><span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\Enums\\Tile</span>;

FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'coordinates'</span>)
    -&gt;<span class="f">tiles</span>(Tile::CartoLight, Tile::Satellite, Tile::Topo)
    -&gt;<span class="f">darkTile</span>(Tile::StadiaDark)   <span class="c">// default: Tile::CartoDark</span>
    -&gt;<span class="f">darkMode</span>()                   <span class="c">// on by default; false keeps one look</span></pre>
<p>A keyed provider whose key is missing is dropped from the switcher rather than rendered as a dead
entry. If that would leave the map with no layer at all, OpenStreetMap is used. See
<a href="#/tiles">Tile providers</a> for the full list.</p>
</section>

<section id="g-markers"><h2>Markers and density</h2>
<pre>FieldMap::<span class="f">make</span>(<span class="s">'Branches'</span>, <span class="s">'coordinates'</span>)
    -&gt;<span class="f">relation</span>(<span class="s">'branches'</span>)
    -&gt;<span class="f">markerIcon</span>(<span class="s">'/images/pin.png'</span>, [<span class="k">32</span>, <span class="k">32</span>], [<span class="k">16</span>, <span class="k">32</span>])
    -&gt;<span class="f">markerUsing</span>(<span class="k">fn</span> (<span class="k">array</span> $feature) =&gt; [
        <span class="s">'color'</span> =&gt; $feature[<span class="s">'properties'</span>][<span class="s">'is_open'</span>] ? <span class="s">'#16a34a'</span> : <span class="s">'#dc2626'</span>,
    ])
    -&gt;<span class="f">cluster</span>(disableAtZoom: <span class="k">13</span>)
    -&gt;<span class="f">clusterColorBy</span>(<span class="s">'status'</span>)</pre>
<p>Recognised <code>markerUsing()</code> keys: <code>icon</code>, <code>iconSize</code>,
<code>iconAnchor</code>, <code>color</code>, <code>fillColor</code>, <code>radius</code>,
<code>weight</code>, <code>opacity</code>. <code>color</code> alone tints the built-in pin, so you get
coloured markers without supplying images.</p>
<p>Icons are per field instance. Two map fields on one page with different icons keep them — which
2.x did not, because it wrote to <code>L.Icon.Default.prototype</code>.</p>
</section>

<section id="g-viz"><h2>Data visualisation</h2>
<pre>-&gt;<span class="f">choropleth</span>(<span class="s">'population'</span>)          <span class="c">// or 'linear'; default 'quantile'</span>
-&gt;<span class="f">filterable</span>(<span class="s">'status'</span>)              <span class="c">// a checkbox per distinct value</span>
-&gt;<span class="f">timeline</span>(<span class="s">'observed_at'</span>)           <span class="c">// slider + playback, accumulating</span>
-&gt;<span class="f">route</span>()                          <span class="c">// join points, report the distance</span>
-&gt;<span class="f">elevationProfile</span>()               <span class="c">// chart the Z coordinates</span>
-&gt;<span class="f">heatmap</span>(weightProperty: <span class="s">'severity'</span>)
-&gt;<span class="f">legend</span>()</pre>
<p>Choropleth colours are computed from the whole dataset, so filtering or scrubbing a timeline never
makes the same value change colour. The ramp is a single-hue blue sequence: lightness carries the
value, so it survives greyscale printing and the common colour-vision deficiencies.</p>
<p>Route distance is great-circle (haversine), not planar — planar maths is wrong enough to matter
over any real route.</p>
</section>

<section id="g-index"><h2>The index column</h2>
<p>The field is hidden from the index by default. Three ways to show it:</p>
<pre>-&gt;<span class="f">showOnIndex</span>()    <span class="c">// the coordinates as text</span>
-&gt;<span class="f">snapshot</span>()       <span class="c">// a cached static map image</span>
-&gt;<span class="f">thumbnail</span>()      <span class="c">// a live mini-map</span></pre>
<div class="note warn"><b><code>thumbnail()</code> builds a real Leaflet instance per row.</b> On a
fifty-row table that is fifty maps. Prefer <code>snapshot()</code>, which is one lazily loaded
<code>&lt;img&gt;</code> per row.</div>
</section>

<section id="g-validate"><h2>Validation and filtering</h2>
<pre><span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\Rules\\WithinGeofence</span>;

FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'coordinates'</span>)
    -&gt;<span class="f">editable</span>()
    -&gt;<span class="f">rules</span>([<span class="k">new</span> <span class="f">WithinGeofence</span>(
        Storage::<span class="f">get</span>(<span class="s">'zones/delivery-area.geojson'</span>),
    )])</pre>
<p>Polygons and multipolygons are supported, holes included. The test runs in PHP, so it behaves
identically with or without spatial extensions. An empty submission passes — emptiness is
<code>required</code>'s business — and an unusable fence passes rather than silently rejecting
everything.</p>
<pre><span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\Filters\\MapBoundsFilter</span>;

<span class="k">public function</span> <span class="f">filters</span>(NovaRequest $request): <span class="k">array</span>
{
    <span class="k">return</span> [<span class="k">new</span> <span class="f">MapBoundsFilter</span>(<span class="s">'lat'</span>, <span class="s">'lng'</span>)];
}</pre>
<p>Pan and zoom to the area you want and the index narrows to rows inside it. A box dragged across
the antimeridian is handled as two ranges rather than selecting the rest of the world.</p>
</section>`
},

/* ---------------------------------------------------------- */
recipes: {
  title: 'Recipes',
  nav: 'Recipes',
  sub: 'Whole, paste-able solutions to the tasks that actually turn up.',
  prev: 'guide', next: 'commands',
  html: `
<section id="r-locator"><h2>A store locator</h2>
<p>Every branch, colour-coded by status, clustered, and clickable through to its record.</p>
<pre><span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\Enums\\Tile</span>;
<span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\FieldMap</span>;

<span class="k">public static</span> $with = [<span class="s">'branches'</span>];

<span class="k">public function</span> <span class="f">fields</span>(NovaRequest $request): <span class="k">array</span>
{
    <span class="k">return</span> [
        FieldMap::<span class="f">make</span>(<span class="s">'Branches'</span>, <span class="s">'coordinates'</span>)
            -&gt;<span class="f">relation</span>(<span class="s">'branches'</span>)
            -&gt;<span class="f">popup</span>(<span class="s">'name'</span>)
            -&gt;<span class="f">tooltip</span>(<span class="s">'city'</span>)
            -&gt;<span class="f">linkToResource</span>()
            -&gt;<span class="f">markerUsing</span>(<span class="k">fn</span> (<span class="k">array</span> $feature) =&gt; [
                <span class="s">'color'</span> =&gt; <span class="k">match</span> ($feature[<span class="s">'properties'</span>][<span class="s">'status'</span>]) {
                    <span class="s">'open'</span>         =&gt; <span class="s">'#16a34a'</span>,
                    <span class="s">'refurbishing'</span> =&gt; <span class="s">'#d97706'</span>,
                    <span class="k">default</span>       =&gt; <span class="s">'#dc2626'</span>,
                },
            ])
            -&gt;<span class="f">filterable</span>(<span class="s">'status'</span>)
            -&gt;<span class="f">legend</span>()
            -&gt;<span class="f">cluster</span>(disableAtZoom: <span class="k">12</span>)
            -&gt;<span class="f">tiles</span>(Tile::CartoLight, Tile::Satellite)
            -&gt;<span class="f">height</span>(<span class="s">'520px'</span>)
            -&gt;<span class="f">fullscreen</span>(),
    ];
}</pre>
<p><code>$with</code> matters: without it the relation is lazy-loaded once per record.</p>
</section>

<section id="r-existing"><h2>Adding a map to columns you already have</h2>
<p>No migration, no new column, and the existing validation rules still apply.</p>
<pre>FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>)
    -&gt;<span class="f">coordinates</span>(<span class="s">'latitude'</span>, <span class="s">'longitude'</span>)
    -&gt;<span class="f">syncTo</span>(<span class="s">'latitude'</span>, <span class="s">'longitude'</span>)
    -&gt;<span class="f">geocoder</span>()
    -&gt;<span class="f">height</span>(<span class="s">'400px'</span>),

Number::<span class="f">make</span>(<span class="s">'Latitude'</span>)-&gt;<span class="f">step</span>(<span class="k">0.000001</span>)
    -&gt;<span class="f">rules</span>(<span class="s">'nullable'</span>, <span class="s">'numeric'</span>, <span class="s">'between:-90,90'</span>),
Number::<span class="f">make</span>(<span class="s">'Longitude'</span>)-&gt;<span class="f">step</span>(<span class="k">0.000001</span>)
    -&gt;<span class="f">rules</span>(<span class="s">'nullable'</span>, <span class="s">'numeric'</span>, <span class="s">'between:-180,180'</span>),</pre>
<p>The map writes nothing itself — the two number fields keep owning the columns.</p>
</section>

<section id="r-zone"><h2>A delivery zone, drawn and validated</h2>
<pre><span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\Enums\\Shape</span>;
<span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\Rules\\WithinGeofence</span>;

FieldMap::<span class="f">make</span>(<span class="s">'Delivery zone'</span>, <span class="s">'zone'</span>)
    -&gt;<span class="f">draw</span>(Shape::Polygon, Shape::Rectangle)
    -&gt;<span class="f">geocoder</span>()
    -&gt;<span class="f">height</span>(<span class="s">'520px'</span>)
    -&gt;<span class="f">scrollWheelZoom</span>(<span class="k">false</span>)
    -&gt;<span class="f">rules</span>([<span class="k">new</span> <span class="f">WithinGeofence</span>(
        Storage::<span class="f">disk</span>(<span class="s">'local'</span>)-&gt;<span class="f">get</span>(<span class="s">'geo/service-area.geojson'</span>),
        <span class="s">'The delivery zone must stay inside the service area.'</span>,
    )]),</pre>
<p>The <code>zone</code> column should be <code>json</code> or <code>text</code>.
<code>scrollWheelZoom(false)</code> stops the map eating page scrolling on a long form.</p>
</section>

<section id="r-address"><h2>An address form that fills itself</h2>
<pre>FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'coordinates'</span>)
    -&gt;<span class="f">editable</span>()
    -&gt;<span class="f">fillsAddress</span>([
        <span class="s">'street'</span>       =&gt; <span class="s">'street'</span>,
        <span class="s">'house_number'</span> =&gt; <span class="s">'street_number'</span>,
        <span class="s">'postcode'</span>     =&gt; <span class="s">'postcode'</span>,
        <span class="s">'city'</span>         =&gt; <span class="s">'city'</span>,
        <span class="s">'country_code'</span> =&gt; <span class="s">'country_code'</span>,
    ])
    -&gt;<span class="f">height</span>(<span class="s">'400px'</span>),

Text::<span class="f">make</span>(<span class="s">'Street'</span>),
Text::<span class="f">make</span>(<span class="s">'Street number'</span>),
Text::<span class="f">make</span>(<span class="s">'Postcode'</span>),
Text::<span class="f">make</span>(<span class="s">'City'</span>),
Text::<span class="f">make</span>(<span class="s">'Country code'</span>),</pre>
<p>Searching for the address moves the pin; moving the pin rewrites the fields. Cache the lookups —
<code>geocoder.cache_ttl</code> defaults to a day — or a busy team will hit Nominatim's rate
limit.</p>
</section>

<section id="r-choropleth"><h2>Population density by region</h2>
<pre>FieldMap::<span class="f">make</span>(<span class="s">'Regions'</span>, <span class="s">'boundary'</span>)
    -&gt;<span class="f">relation</span>(<span class="s">'regions'</span>)
    -&gt;<span class="f">choropleth</span>(<span class="s">'population_density'</span>)
    -&gt;<span class="f">popup</span>(<span class="s">'name'</span>)
    -&gt;<span class="f">legend</span>()
    -&gt;<span class="f">tiles</span>(Tile::CartoLight)
    -&gt;<span class="f">height</span>(<span class="s">'600px'</span>)
    -&gt;<span class="f">withoutClustering</span>(),</pre>
<p><code>boundary</code> holds a GeoJSON <code>Polygon</code> per region.
<code>withoutClustering()</code> matters: clustering is for points and does nothing useful for
areas.</p>
</section>

<section id="r-track"><h2>A GPS track with playback</h2>
<pre>FieldMap::<span class="f">make</span>(<span class="s">'Track'</span>, <span class="s">'track'</span>)
    -&gt;<span class="f">route</span>()
    -&gt;<span class="f">elevationProfile</span>()
    -&gt;<span class="f">timeline</span>(<span class="s">'recorded_at'</span>)
    -&gt;<span class="f">exportData</span>()
    -&gt;<span class="f">height</span>(<span class="s">'480px'</span>),</pre>
<p><code>track</code> holds a <code>LineString</code> whose positions carry a third element — the
elevation in metres. <code>exportData()</code> lets the user pull the track back out as GPX for a
GPS device.</p>
</section>

<section id="r-spatial"><h2>Supporting a spatial package's Point</h2>
<pre><span class="c">// With matanyadaev/laravel-eloquent-spatial:</span>
<span class="k">protected</span> $casts = [<span class="s">'location'</span> =&gt; Point::<span class="k">class</span>];

<span class="c">// The field needs no configuration; SpatialResolver</span>
<span class="c">// duck-types anything that can produce GeoJSON.</span>
FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'location'</span>)</pre>
<p>Storing back is the one thing to decide. Either cast on the model:</p>
<pre><span class="k">protected function</span> <span class="f">location</span>(): Attribute
{
    <span class="k">return</span> Attribute::<span class="f">set</span>(<span class="k">function</span> (?<span class="k">string</span> $value) {
        $coordinates = <span class="f">json_decode</span>($value, <span class="k">true</span>)
            [<span class="s">'features'</span>][<span class="k">0</span>][<span class="s">'geometry'</span>][<span class="s">'coordinates'</span>] ?? <span class="k">null</span>;

        <span class="k">return</span> $coordinates
            ? <span class="k">new</span> <span class="f">Point</span>($coordinates[<span class="k">1</span>], $coordinates[<span class="k">0</span>])
            : <span class="k">null</span>;
    });
}</pre>
<p>Or sidestep it with <code>-&gt;coordinates('lat', 'lng')-&gt;storeAsColumns()</code>.</p>
</section>

<section id="r-index"><h2>Keeping index tables fast</h2>
<pre>FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'coordinates'</span>)
    -&gt;<span class="f">snapshot</span>()      <span class="c">// one &lt;img&gt; per row, lazily loaded</span>
    -&gt;<span class="f">height</span>(<span class="s">'400px'</span>) <span class="c">// the detail view is unaffected</span></pre>
<p>Or, cheaper still, just the coordinates as text:</p>
<pre><span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\Enums\\CoordinateFormat</span>;

FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'coordinates'</span>)
    -&gt;<span class="f">showOnIndex</span>()
    -&gt;<span class="f">coordinateFormat</span>(CoordinateFormat::Dms)</pre>
<p>Renders <code>45°38'58.2"N 13°46'36.5"E</code>. Do not reach for <code>thumbnail()</code> here
unless the table is short.</p>
</section>`
},

/* ---------------------------------------------------------- */
commands: {
  title: 'Commands',
  nav: 'Commands',
  sub: 'One artisan command, and what each of its checks actually proves.',
  prev: 'recipes', next: 'api',
  html: `
<section id="m-list"><h2>The command</h2>
<div class="tw"><table>
<thead><tr><th>Signature</th><th>Options</th><th>Description</th></tr></thead>
<tbody>
<tr><td><code>nova-field-map:doctor</code></td><td><code>--skip-network</code></td>
<td>Verifies the built assets exist, the configured keys are present, and every tile host responds.</td></tr>
</tbody></table></div>
<pre>php artisan nova-field-map:doctor
php artisan nova-field-map:doctor --skip-network</pre>
<p>Most map problems are configuration problems, and a blank grey box is a uniquely unhelpful way to
learn that. The command exits non-zero when a check fails, so it works in CI.</p>
</section>

<section id="m-checks"><h2>What it checks</h2>
<h3>Assets</h3>
<p>That <code>dist/js/field.js</code>, <code>dist/css/field.css</code> and
<code>dist/js/lazy-core.js</code> all exist. If they do not, the fix is printed:
<code>npm install &amp;&amp; npm run build</code> in the package directory. This is the usual state
after installing from a git clone rather than Packagist.</p>

<h3>Keys</h3>
<p>That a Google basemap in <code>tiles.providers</code> has a key, and that a keyed geocoder driver
has its key. A keyed driver with no key silently falls back to returning no results — which looks
like a broken search box rather than a missing setting, so the command calls it out.</p>
<p>When a Google key <em>is</em> present it prints a reminder rather than a pass: the key reaches the
browser by necessity, and it needs an HTTP-referrer restriction.</p>

<h3>Tiles</h3>
<p>One real tile request per configured provider, at a known-good position, against the same host
the browser will use. Corporate proxies and firewalls block tile CDNs surprisingly often, and this
is the fastest way to find out. Skip it with <code>--skip-network</code>.</p>
</section>

<section id="m-output"><h2>What a healthy run looks like</h2>
<pre>  INFO  nova-field-map diagnostics

  entry bundle .......................... found
  stylesheet ............................ found
  lazy Leaflet chunk .................... found
  Geocoder [nominatim] .................. ok
  OpenStreetMap ......................... reachable
  Light ................................. reachable

  INFO  All checks passed.</pre>
</section>`
},

/* ---------------------------------------------------------- */
api: {
  title: 'API reference',
  nav: 'API reference',
  sub: 'Every public method, grouped by what it affects, with its default.',
  prev: 'commands', next: 'tiles',
  html: `
<section id="a-geometry"><h2>Geometry</h2>
<div class="tw"><table>
<thead><tr><th>Signature</th><th>What it does</th><th>Default</th></tr></thead>
<tbody>
<tr><td><code>coordinates($lat, $lng)</code></td><td>Read from two columns</td><td>—</td></tr>
<tr><td><code>relation($relation, $attribute = null)</code></td><td>One marker per related record</td><td>attribute = field's own</td></tr>
<tr><td><code>geometryUsing(Closure)</code></td><td>Build the geometry yourself</td><td>—</td></tr>
<tr><td><code>geoJson($geoJson)</code></td><td>Set geometry directly</td><td>—</td></tr>
<tr><td><code>point($lat, $lng, $properties = [])</code></td><td>Set a single point directly</td><td>—</td></tr>
</tbody></table></div>
</section>

<section id="a-editing"><h2>Editing</h2>
<div class="tw"><table>
<thead><tr><th>Signature</th><th>What it does</th><th>Default</th></tr></thead>
<tbody>
<tr><td><code>editable($editable = true)</code></td><td>Show on create and update forms</td><td><code>false</code></td></tr>
<tr><td><code>draw(Shape ...$shapes)</code></td><td>Which geometry may be drawn; implies <code>editable()</code></td><td><code>Shape::Point</code></td></tr>
<tr><td><code>geocoder($enabled = true)</code></td><td>Add the place search box</td><td><code>false</code></td></tr>
<tr><td><code>geolocation($enabled = true)</code></td><td>Offer "use my location"</td><td><code>true</code></td></tr>
<tr><td><code>manualInputs($enabled = true)</code></td><td>Show the lat/lng inputs</td><td><code>true</code></td></tr>
<tr><td><code>nudgeStep($degrees)</code></td><td>Arrow-key step</td><td><code>0.0001</code></td></tr>
<tr><td><code>fillsAddress($targets)</code></td><td>Reverse-geocode into other fields; implies <code>geocoder()</code></td><td><code>[]</code></td></tr>
<tr><td><code>syncTo($latField, $lngField)</code></td><td>Drive two Nova fields, write nothing</td><td>—</td></tr>
<tr><td><code>storeAsGeoJson()</code></td><td>Store as a GeoJSON string</td><td>default</td></tr>
<tr><td><code>storeAsLatLngString()</code></td><td>Store as <code>"lat,lng"</code></td><td>—</td></tr>
<tr><td><code>storeAsColumns()</code></td><td>Store across the <code>coordinates()</code> pair</td><td>—</td></tr>
</tbody></table></div>
</section>

<section id="a-popups"><h2>Popups</h2>
<div class="tw"><table>
<thead><tr><th>Signature</th><th>What it does</th><th>Default</th></tr></thead>
<tbody>
<tr><td><code>popup($property)</code></td><td>Popup from a feature property, escaped</td><td>—</td></tr>
<tr><td><code>popupUsing(Closure)</code></td><td>Build the body server-side</td><td>—</td></tr>
<tr><td><code>allowHtmlPopups($allow = true)</code></td><td>Render popup strings as markup</td><td><code>false</code></td></tr>
<tr><td><code>tooltip($property)</code></td><td>Hover tooltip, always escaped</td><td>—</td></tr>
</tbody></table></div>
</section>

<section id="a-tiles"><h2>Tiles</h2>
<div class="tw"><table>
<thead><tr><th>Signature</th><th>What it does</th><th>Default</th></tr></thead>
<tbody>
<tr><td><code>tiles(Tile|string ...$tiles)</code></td><td>Layers offered, in order</td><td>config</td></tr>
<tr><td><code>darkTile(Tile|string $tile)</code></td><td>Layer used in dark mode</td><td><code>Tile::CartoDark</code></td></tr>
<tr><td><code>darkMode($enabled = true)</code></td><td>Follow Nova's theme</td><td><code>true</code></td></tr>
<tr><td><code>googleApiKey($key = null)</code></td><td>Enable Google; <code>null</code> reads config</td><td><code>null</code></td></tr>
<tr><td><code>googleMapType(GoogleMapType|string)</code></td><td>Google basemap style</td><td><code>roadmap</code></td></tr>
<tr><td><code>mapboxKey($key = null)</code></td><td>Enable Mapbox</td><td><code>null</code></td></tr>
<tr><td><code>maptilerKey($key = null)</code></td><td>Enable MapTiler</td><td><code>null</code></td></tr>
</tbody></table></div>
</section>

<section id="a-markers"><h2>Markers</h2>
<div class="tw"><table>
<thead><tr><th>Signature</th><th>What it does</th><th>Default</th></tr></thead>
<tbody>
<tr><td><code>markerIcon($url, $size, $anchor)</code></td><td>Replace the pin image</td><td>built-in</td></tr>
<tr><td><code>markerUsing(Closure)</code></td><td>Style each marker from its feature</td><td>—</td></tr>
<tr><td><code>cluster($enabled = true, $disableAtZoom = null)</code></td><td>Group nearby markers</td><td>config</td></tr>
<tr><td><code>withoutClustering()</code></td><td>Never cluster</td><td>—</td></tr>
<tr><td><code>clusterColorBy($property)</code></td><td>Colour bubbles by dominant value</td><td>—</td></tr>
<tr><td><code>heatmap($enabled = true, $weight = null)</code></td><td>Render a heat layer</td><td><code>false</code></td></tr>
</tbody></table></div>
</section>

<section id="a-viz"><h2>Visualisation</h2>
<div class="tw"><table>
<thead><tr><th>Signature</th><th>What it does</th><th>Default</th></tr></thead>
<tbody>
<tr><td><code>choropleth($property, $scale = 'quantile')</code></td><td>Colour polygons by a number</td><td>—</td></tr>
<tr><td><code>filterable($property)</code></td><td>Per-category layer checkboxes</td><td>—</td></tr>
<tr><td><code>timeline($property)</code></td><td>Time slider with playback</td><td>—</td></tr>
<tr><td><code>route($enabled = true)</code></td><td>Join points into a path</td><td><code>false</code></td></tr>
<tr><td><code>elevationProfile($enabled = true)</code></td><td>Chart the Z coordinates</td><td><code>false</code></td></tr>
<tr><td><code>legend($enabled = true)</code></td><td>Render the legend</td><td><code>false</code></td></tr>
</tbody></table></div>
</section>

<section id="a-chrome"><h2>Viewport and chrome</h2>
<div class="tw"><table>
<thead><tr><th>Signature</th><th>What it does</th><th>Default</th></tr></thead>
<tbody>
<tr><td><code>height($height)</code></td><td>Map height</td><td><code>300px</code></td></tr>
<tr><td><code>center($lat, $lng)</code></td><td>View when there is no geometry</td><td>config</td></tr>
<tr><td><code>zoom($zoom)</code></td><td>Zoom when there is no geometry</td><td><code>12</code></td></tr>
<tr><td><code>fit($padding = 24, $maxZoom = 16)</code></td><td>How geometry is framed</td><td>—</td></tr>
<tr><td><code>maxBounds($s, $w, $n, $e)</code></td><td>Clamp panning</td><td><code>null</code></td></tr>
<tr><td><code>fullscreen($enabled = true)</code></td><td>Fullscreen button</td><td><code>false</code></td></tr>
<tr><td><code>scaleControl($enabled = true)</code></td><td>Scale bar</td><td><code>false</code></td></tr>
<tr><td><code>locateControl($enabled = true)</code></td><td>Locate button</td><td><code>false</code></td></tr>
<tr><td><code>scrollWheelZoom($enabled = true)</code></td><td>Wheel zooms the map</td><td><code>true</code></td></tr>
<tr><td><code>copyable($enabled = true)</code></td><td>Copy-coordinates button</td><td><code>true</code></td></tr>
<tr><td><code>deeplinks($enabled = true)</code></td><td>Open-in links</td><td><code>false</code></td></tr>
<tr><td><code>exportData($enabled = true)</code></td><td>GeoJSON and GPX downloads</td><td><code>false</code></td></tr>
<tr><td><code>accessibleTable($enabled = true)</code></td><td>Screen-reader table</td><td><code>false</code></td></tr>
<tr><td><code>coordinateFormat(CoordinateFormat)</code></td><td>Decimal or DMS</td><td><code>Decimal</code></td></tr>
</tbody></table></div>
<p><code>fit()</code>'s <code>maxZoom</code> matters most for a single point: fitting its bounds
exactly would zoom to street level and lose all context.</p>
</section>

<section id="a-index"><h2>Index and navigation</h2>
<div class="tw"><table>
<thead><tr><th>Signature</th><th>What it does</th><th>Default</th></tr></thead>
<tbody>
<tr><td><code>showOnIndex()</code></td><td>Coordinates as text</td><td><code>false</code></td></tr>
<tr><td><code>snapshot($enabled = true)</code></td><td>Cached static image</td><td><code>false</code></td></tr>
<tr><td><code>thumbnail($enabled = true)</code></td><td>Live mini-map</td><td><code>false</code></td></tr>
<tr><td><code>linkToResource($resource = null)</code></td><td>Marker click opens the record</td><td><code>false</code></td></tr>
</tbody></table></div>
</section>

<section id="a-enums"><h2>Enums and helpers</h2>
<div class="tw"><table>
<thead><tr><th>Type</th><th>Cases</th></tr></thead>
<tbody>
<tr><td><code>Shape</code></td><td><code>Point</code>, <code>Line</code>, <code>Polygon</code>, <code>Rectangle</code>, <code>Circle</code>, <code>CircleMarker</code></td></tr>
<tr><td><code>CoordinateFormat</code></td><td><code>Decimal</code>, <code>Dms</code></td></tr>
<tr><td><code>GoogleMapType</code></td><td><code>Roadmap</code>, <code>Satellite</code>, <code>Terrain</code>, <code>Hybrid</code></td></tr>
<tr><td><code>Tile</code></td><td>Ten cases — see <a href="#/tiles">Tile providers</a></td></tr>
<tr><td><code>MapType</code></td><td><code>GeoJson</code>, <code>LatLon</code> — deprecated, 2.x only</td></tr>
</tbody></table></div>
<div class="tw"><table>
<thead><tr><th>Class</th><th>Purpose</th></tr></thead>
<tbody>
<tr><td><code>Rules\\WithinGeofence</code></td><td>Validate that geometry falls inside a polygon</td></tr>
<tr><td><code>Filters\\MapBoundsFilter</code></td><td>Filter an index by a drawn bounding box</td></tr>
<tr><td><code>Resolvers\\ResolverRegistry</code></td><td><code>register()</code> a custom <code>GeometryResolver</code></td></tr>
<tr><td><code>Support\\GeoJson</code></td><td><code>collect()</code>, <code>point()</code>, <code>bounds()</code>, <code>firstCoordinate()</code></td></tr>
</tbody></table></div>
</section>`
},

/* ---------------------------------------------------------- */
tiles: {
  title: 'Tile providers',
  nav: 'Tile providers',
  sub: 'The ten built-in providers, which need a key, and how to add your own.',
  prev: 'api', next: 'troubleshooting',
  html: `
<section id="t-builtin"><h2>The built-in ten</h2>
<div class="tw"><table>
<thead><tr><th>Case</th><th>Label</th><th>Key</th><th>Max zoom</th></tr></thead>
<tbody>
<tr><td><code>Tile::OpenStreetMap</code></td><td>OpenStreetMap</td><td>no</td><td>20</td></tr>
<tr><td><code>Tile::CartoLight</code></td><td>Light</td><td>no</td><td>20</td></tr>
<tr><td><code>Tile::CartoDark</code></td><td>Dark</td><td>no</td><td>20</td></tr>
<tr><td><code>Tile::CartoVoyager</code></td><td>Voyager</td><td>no</td><td>20</td></tr>
<tr><td><code>Tile::Satellite</code></td><td>Satellite (Esri)</td><td>no</td><td>19</td></tr>
<tr><td><code>Tile::Topo</code></td><td>Topographic (OpenTopoMap)</td><td>no</td><td>17</td></tr>
<tr><td><code>Tile::StadiaDark</code></td><td>Stadia Dark</td><td>no</td><td>20</td></tr>
<tr><td><code>Tile::Google</code></td><td>Google</td><td><b>yes</b></td><td>20</td></tr>
<tr><td><code>Tile::Mapbox</code></td><td>Mapbox</td><td><b>yes</b></td><td>20</td></tr>
<tr><td><code>Tile::MapTiler</code></td><td>MapTiler</td><td><b>yes</b></td><td>20</td></tr>
</tbody></table></div>
<p>Each case carries its own URL template, attribution and maximum zoom, and a field serializes
exactly the layers it offers — so the browser never carries a second copy of the catalogue.</p>
</section>

<section id="t-missing"><h2>What happens when a key is missing</h2>
<p>A keyed provider whose key is not configured is <b>dropped from the switcher</b> rather than
rendered as an entry that produces a grey box when selected. If dropping it would leave the map with
no layer at all, OpenStreetMap is substituted, because a map with no layer reads as a bug rather
than as a misconfiguration.</p>
<pre><span class="c">// Google has no key here, so only OSM is offered.</span>
FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>)
    -&gt;<span class="f">tiles</span>(Tile::OpenStreetMap, Tile::Google)

<span class="c">// With a key, both appear.</span>
FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>)
    -&gt;<span class="f">googleApiKey</span>()
    -&gt;<span class="f">tiles</span>(Tile::OpenStreetMap, Tile::Google)</pre>
<p>The layer switcher only appears when there is more than one layer.</p>
</section>

<section id="t-dark"><h2>Dark mode</h2>
<p>On by default. The field watches Nova's theme and swaps to the dark basemap when Nova goes dark.
Providers with no dark variant are dimmed with a CSS filter instead — which is honest about being a
fallback rather than pretending to be a dark style.</p>
<pre>-&gt;<span class="f">darkTile</span>(Tile::StadiaDark)   <span class="c">// default: Tile::CartoDark</span>
-&gt;<span class="f">darkMode</span>(<span class="k">false</span>)              <span class="c">// one look in both themes</span></pre>
</section>

<section id="t-keys"><h2>About the keys</h2>
<div class="note warn"><b>A Maps JavaScript key reaches the browser.</b> It has to — that is how the
SDK works. Use a browser key restricted by HTTP referrer, never a server key.
<code>nova-field-map:doctor</code> prints a reminder whenever a Google key is configured.</div>
<pre>-&gt;<span class="f">googleApiKey</span>()      <span class="c">// reads config</span>
-&gt;<span class="f">googleApiKey</span>(<span class="s">'…'</span>)   <span class="c">// override per field</span>
-&gt;<span class="f">mapboxKey</span>()
-&gt;<span class="f">maptilerKey</span>()</pre>
<p>Geocoding keys are different: those requests are proxied through your application, so the Mapbox
and MapTiler geocoding keys never reach the browser at all.</p>
</section>

<section id="t-custom"><h2>Your own tile server</h2>
<pre><span class="c">// config/nova-field-map.php</span>
<span class="s">'tiles'</span> =&gt; [
    <span class="s">'providers'</span> =&gt; [<span class="s">'osm'</span>, <span class="s">'company'</span>],

    <span class="s">'custom'</span> =&gt; [
        <span class="s">'company'</span> =&gt; [
            <span class="s">'label'</span>       =&gt; <span class="s">'Company Tiles'</span>,
            <span class="s">'url'</span>         =&gt; <span class="s">'https://tiles.example.com/{z}/{x}/{y}.png'</span>,
            <span class="s">'attribution'</span> =&gt; <span class="s">'&amp;copy; Example Ltd'</span>,
            <span class="s">'max_zoom'</span>    =&gt; <span class="k">18</span>,
            <span class="s">'dark'</span>        =&gt; <span class="k">false</span>,
        ],
    ],
],</pre>
<pre>FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>)-&gt;<span class="f">tiles</span>(<span class="s">'company'</span>, Tile::Satellite)</pre>
<p>Mark <code>'dark' =&gt; true</code> on a dark-styled basemap and it becomes eligible as the
dark-mode layer.</p>
</section>`
},

/* ---------------------------------------------------------- */
troubleshooting: {
  title: 'Troubleshooting',
  nav: 'Troubleshooting',
  sub: 'The failures people actually hit, and what each one really means.',
  prev: 'tiles', next: 'security',
  html: `
<section id="x-grey"><h2>The map is a grey box</h2>
<p>Three usual causes, in order of likelihood.</p>
<h3>The assets are not built</h3>
<p>If you installed from a git clone rather than Packagist, <code>dist/</code> may be missing.</p>
<pre>php artisan nova-field-map:doctor

<span class="c"># if it reports missing files</span>
cd vendor/gabrielesbaiz/nova-field-map &amp;&amp; npm install &amp;&amp; npm run build</pre>
<h3>The tile host is unreachable</h3>
<p>Corporate proxies and firewalls block tile CDNs surprisingly often. <code>doctor</code> makes one
real tile request per configured provider and reports the status.</p>
<h3>The container had no size</h3>
<p>This is handled — a <code>ResizeObserver</code> tells Leaflet when the container changes — but a
container styled with <code>display: none</code> rather than <code>visibility</code>, or with zero
height, can still defeat it. Give the map's panel a real height.</p>
</section>

<section id="x-empty"><h2>The map is empty but the record has coordinates</h2>
<p>The value is not in a shape the resolver chain recognises. Check what the field actually
resolved:</p>
<pre>$field = FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'coordinates'</span>);
$field-&gt;<span class="f">resolve</span>($model);

<span class="f">dump</span>($field-&gt;<span class="f">meta</span>()[<span class="s">'featureCount'</span>], $field-&gt;<span class="f">meta</span>()[<span class="s">'geojson'</span>]);</pre>
<p>A <code>featureCount</code> of <code>0</code> means nothing was recognised. The usual culprits are
a GeoJSON string with the coordinates the wrong way round — GeoJSON is <b>longitude first</b> — or a
coordinate pair whose latitude is out of range, which the resolver deliberately declines rather than
plotting wrongly.</p>
<p>If your column holds something genuinely custom, write a custom resolver — see the
<a href="#/guide">Guide</a>.</p>
</section>

<section id="x-html"><h2>Popup HTML shows as literal text</h2>
<p>That is the default, and it is deliberate: 2.x rendered popup content as raw HTML, which let
anyone who could write that column run JavaScript in an administrator's session.</p>
<pre>-&gt;<span class="f">popup</span>(<span class="s">'description'</span>)-&gt;<span class="f">allowHtmlPopups</span>()</pre>
<p>If the markup is generated by your own code rather than stored, prefer returning a view from
<code>popupUsing()</code> — that is trusted without opening the property up.</p>
</section>

<section id="x-bounds"><h2><code>Bounds are not valid</code> in the console</h2>
<p>This was the 2.x failure for a record whose coordinate column was still null, and it should not be
reachable in 3.x: an empty collection falls back to <code>center()</code> and <code>zoom()</code>
instead of fitting bounds.</p>
<p>If you see it, you are on a 2.x build. Nova caches its script manifest, and a stale one keeps
serving the old bundle:</p>
<pre>php artisan view:clear &amp;&amp; php artisan cache:clear
php artisan nova-field-map:doctor</pre>
</section>

<section id="x-search"><h2>The place search returns nothing</h2>
<pre>php artisan nova-field-map:doctor</pre>
<p>A keyed driver (<code>mapbox</code>, <code>maptiler</code>) with no key silently falls back to
returning no results, rather than erroring on every keystroke. <code>doctor</code> reports that as a
failure.</p>
<p>On Nominatim, the other cause is rate limiting. Its usage policy asks for an identifying
User-Agent and modest traffic — set <code>geocoder.user_agent</code> and leave
<code>geocoder.cache_ttl</code> at its default of a day.</p>
</section>

<section id="x-double"><h2>Two layer switchers, or two maps stacked</h2>
<p>That was a 2.x bug: the same <code>L.control.layers(...).addTo(map)</code> ran twice. It is fixed,
and a test asserts exactly one control renders.</p>
<p>If you still see it, both 2.x and 3.x assets are registered — most often because a fork or a
vendored copy is also calling <code>Nova::script()</code>.</p>
<pre>grep -rn <span class="s">"nova-field-map"</span> app/ config/ bootstrap/</pre>
</section>

<section id="x-slow"><h2>The page gets slower with every navigation</h2>
<p>On 2.x, that is the known leak: the map was never removed, so every Inertia navigation left a live
Leaflet instance and its handlers on detached DOM. 3.0 calls <code>map.remove()</code> and
disconnects both observers on unmount.</p>
<p>On 3.x, take a heap snapshot, navigate away and back, and snapshot again. If detached
<code>HTMLDivElement</code>s accumulate, that is a real bug and there is a test that should have
caught it — please open an issue with the snapshot.</p>
</section>

<section id="x-filter"><h2><code>MapBoundsFilter</code> does not filter</h2>
<p>It constrains two numeric columns, so it needs a column pair. The default arguments are
<code>'latitude'</code> and <code>'longitude'</code>.</p>
<pre><span class="k">new</span> <span class="f">MapBoundsFilter</span>(<span class="s">'lat'</span>, <span class="s">'lng'</span>)</pre>
<p>If your model stores a single GeoJSON column, this filter cannot help — it would need a spatial
index the package cannot assume exists.</p>
</section>`
},

/* ---------------------------------------------------------- */
security: {
  title: 'Security',
  nav: 'Security',
  sub: 'The threat model, what 2.x got wrong, and the mitigations that replaced it.',
  prev: 'troubleshooting', next: 'upgrade',
  html: `
<section id="s-model"><h2>The threat model</h2>
<p>A Nova map renders content from your database into an administrator's authenticated browser
session. Any place that content becomes markup is a place a lower-privileged user who can write that
column can run JavaScript as an administrator.</p>
<p>2.x had exactly that hole. Leaflet's <code>bindPopup()</code> renders a string as HTML, and
feature properties were passed to it untouched:</p>
<pre><span class="c">// 2.x — the value of a DB column, rendered as markup</span>
layer.<span class="f">bindPopup</span>(feature.properties[popup]);</pre>
</section>

<section id="s-mitigations"><h2>The mitigations</h2>
<ul>
<li><b>Popup and tooltip content is escaped in PHP by default.</b> Escaped bodies are handed to
Leaflet as text nodes, so nothing can be re-interpreted as markup on the way in.</li>
<li><b><code>allowHtmlPopups()</code> is explicit, and still sanitised.</b> Opting in routes the
markup through DOMPurify in the browser. Turning off <code>popups.sanitize</code> is the only way to
get unsanitised HTML, and the config file says what that costs.</li>
<li><b>Tooltips have no HTML path at all.</b> There is no use case that justifies the extra
surface.</li>
<li><b>Geocoding is proxied through your application.</b> Provider keys stay server-side; the browser
never talks to the geocoder directly.</li>
<li><b>The lazy asset route serves a fixed whitelist</b>, and the resolved path is checked to be
inside the package's own <code>dist/js</code>, so a crafted filename cannot walk out of it.</li>
<li><b>Tile keys are documented as public.</b> A Maps JavaScript key must reach the browser;
<code>doctor</code> reminds you to restrict it by HTTP referrer.</li>
</ul>
</section>

<section id="s-trusted"><h2>When markup really is trusted</h2>
<p>Where the popup body is generated by your own code rather than stored, return a view. A
<code>View</code> or any <code>Htmlable</code> is treated as trusted markup, because you wrote it —
and the property it reads from stays escaped for every other use.</p>
<pre>-&gt;<span class="f">popupUsing</span>(<span class="k">fn</span> (<span class="k">array</span> $feature) =&gt; <span class="f">view</span>(<span class="s">'nova.branch-popup'</span>, [
    <span class="s">'name'</span> =&gt; $feature[<span class="s">'properties'</span>][<span class="s">'name'</span>],
    <span class="s">'open'</span> =&gt; $feature[<span class="s">'properties'</span>][<span class="s">'is_open'</span>],
]))</pre>
<p>A plain <code>string</code> returned from the same callback is still escaped, so the trusted path
is the one you have to ask for.</p>
</section>

<section id="s-tests"><h2>What the tests assert</h2>
<p>The suite covers the boundary directly, on both sides:</p>
<ul>
<li>A feature whose popup property is <code>&lt;img src=x onerror=alert(1)&gt;</code> serialises
escaped, and renders as text.</li>
<li>The same feature under <code>allowHtmlPopups()</code> reaches the browser as markup and comes out
of DOMPurify without the <code>onerror</code>.</li>
<li>A tooltip carrying markup is escaped even when <code>allowHtmlPopups()</code> is set.</li>
<li>The lazy asset route refuses an unknown filename, a non-JavaScript file, and a traversal
attempt.</li>
</ul>
</section>

<section id="s-report"><h2>Reporting a vulnerability</h2>
<p>Please review the project's
<a href="https://github.com/gabrielesbaiz/nova-field-map/security/policy">security policy</a> rather
than opening a public issue.</p>
</section>`
},

/* ---------------------------------------------------------- */
upgrade: {
  title: 'Upgrading',
  nav: 'Upgrading',
  sub: 'Three breaking changes, everything else shimmed, and the commands to run afterwards.',
  prev: 'security', next: 'changelog',
  html: `
<section id="u-break"><h2>What breaks</h2>
<h3>1 · Popup content is escaped by default</h3>
<p>This is a security fix, and it is the change most likely to alter what you see on screen. A popup
whose content is <code>&lt;b&gt;Head office&lt;/b&gt;</code> now renders that as literal text.</p>
<pre>-&gt;<span class="f">popup</span>(<span class="s">'description'</span>)-&gt;<span class="f">allowHtmlPopups</span>()</pre>
<p>Even then the browser sanitises the markup. See <a href="#/security">Security</a>.</p>

<h3>2 · PHP 8.2 and Nova 5</h3>
<div class="tw"><table>
<thead><tr><th></th><th>2.x</th><th>3.0</th></tr></thead>
<tbody>
<tr><td>PHP</td><td>8.0</td><td>8.2</td></tr>
<tr><td>Laravel</td><td>10, 11, 12</td><td>11, 12, 13</td></tr>
<tr><td>Nova</td><td>4</td><td>5</td></tr>
</tbody></table></div>
<p>There is no Nova 4 build of 3.0. Stay on 2.x until you upgrade Nova.</p>

<h3>3 · Four methods were removed</h3>
<div class="tw"><table>
<thead><tr><th>Removed</th><th>Why</th><th>Instead</th></tr></thead>
<tbody>
<tr><td><code>exportImage()</code></td><td>Rasterising tile layers to PNG is blocked by canvas tainting on most providers</td><td><code>exportData()</code></td></tr>
<tr><td><code>minimap()</code></td><td>Needs another Leaflet plugin for a feature few maps used</td><td>—</td></tr>
<tr><td><code>measure()</code></td><td>Same</td><td><code>route()</code>, <code>scaleControl()</code></td></tr>
<tr><td><code>popupActions()</code></td><td>Needs more of Nova's form runtime than a popup can carry</td><td><code>linkToResource()</code></td></tr>
</tbody></table></div>
<p>Calls to these now raise <code>BadMethodCallException</code> rather than silently doing
nothing — a test asserts each one does.</p>
</section>

<section id="u-shim"><h2>What still works unchanged</h2>
<p>Everything else. These are shimmed and covered by a dedicated test suite:</p>
<pre><span class="c">// The 2.x class and provider names still resolve.</span>
<span class="k">use</span> <span class="s">Gabrielesbaiz\\NovaFieldMap\\NovaFieldMap</span>;

<span class="c">// The 2.x LatLon chain.</span>
NovaFieldMap::<span class="f">make</span>(<span class="s">'Location'</span>)
    -&gt;<span class="f">type</span>(<span class="s">'LatLon'</span>)
    -&gt;<span class="f">point</span>($this-&gt;my_latitude, $this-&gt;my_longitude)
    -&gt;<span class="f">popup</span>(<span class="s">'I am a Popup'</span>)    <span class="c">// literal text, as in 2.x</span>
    -&gt;<span class="f">height</span>(<span class="s">'400px'</span>);

<span class="c">// The 2.x GeoJson chain.</span>
NovaFieldMap::<span class="f">make</span>(<span class="s">'Area'</span>)
    -&gt;<span class="f">type</span>(<span class="s">'GeoJson'</span>)
    -&gt;<span class="f">geoJson</span>($this-&gt;geojson_column)
    -&gt;<span class="f">popup</span>(<span class="s">'popup'</span>);          <span class="c">// a property name, as in 2.x</span></pre>
<div class="note"><b><code>popup()</code> kept both of its 2.x meanings.</b> Under
<code>type('LatLon')</code> the argument is the popup's literal text; under
<code>type('GeoJson')</code> it names a feature property. Without a <code>type()</code> call — that
is, in new code — it always names a property.</div>
<p><code>type()</code> and the class aliases are deprecated and removed in 4.0.</p>
</section>

<section id="u-want"><h2>What you probably want to change anyway</h2>
<p>None of this is required, but 3.0 exists to make it possible.</p>
<pre><span class="c">// 2.x — data pushed in at make() time</span>
NovaFieldMap::<span class="f">make</span>(<span class="s">'Location'</span>)
    -&gt;<span class="f">type</span>(<span class="s">'LatLon'</span>)
    -&gt;<span class="f">point</span>($this-&gt;my_latitude, $this-&gt;my_longitude)

<span class="c">// 3.0 — the field reads the model</span>
FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>)-&gt;<span class="f">coordinates</span>(<span class="s">'my_latitude'</span>, <span class="s">'my_longitude'</span>)

<span class="c">// or, for a single column in any recognised shape</span>
FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'coordinates'</span>)</pre>
<p>This is what makes <code>dependsOn()</code>, <code>resolveUsing()</code>, filling and validation
work on the field at all. And 2.x could not be edited — <code>showOnUpdate</code> was forced to
false:</p>
<pre>FieldMap::<span class="f">make</span>(<span class="s">'Location'</span>, <span class="s">'coordinates'</span>)
    -&gt;<span class="f">editable</span>()
    -&gt;<span class="f">geocoder</span>()</pre>
</section>

<section id="u-after"><h2>After upgrading</h2>
<pre>composer update gabrielesbaiz/nova-field-map
php artisan vendor:publish --tag=nova-field-map-config --force
php artisan view:clear &amp;&amp; php artisan cache:clear
php artisan nova-field-map:doctor</pre>
<div class="note"><b><code>view:clear</code> matters.</b> Nova caches its script manifest, and a
stale one keeps serving the 2.x bundle. If you see <code>Bounds are not valid</code> in the console
after upgrading, that is what happened.</div>
</section>

<section id="u-fixed"><h2>Fixed in 3.0, with nothing to do</h2>
<ul>
<li>Two layer switchers rendered, because the same control was added twice.</li>
<li>Two map fields on one page shared a marker icon, because icon options were written to
<code>L.Icon.Default.prototype</code>.</li>
<li>Maps were never removed on navigation, leaking a Leaflet instance and its handlers on every
Inertia page change.</li>
<li>A record with no geometry threw <code>Bounds are not valid</code> and rendered blank.</li>
<li>A malformed GeoJSON string was passed through to Leaflet and silently produced an empty map.</li>
<li>Selecting the Google layer before its SDK finished loading threw.</li>
</ul>
</section>`
},

/* ---------------------------------------------------------- */
changelog: {
  title: 'Changelog',
  nav: 'Changelog',
  sub: 'The current release. Older entries are in CHANGELOG.md.',
  prev: 'upgrade', next: null,
  html: `
<section id="l-300"><h2>3.0.0</h2>
<p>A rewrite. See <a href="#/upgrade">Upgrading</a> before you take it.</p>

<h3>Security</h3>
<ul>
<li><b>Popup and tooltip content is now escaped by default.</b> 2.x passed feature properties
straight to Leaflet's <code>bindPopup()</code>, which renders a string as raw HTML, so any user who
could write that column could run JavaScript in an authenticated administrator's session. Markup now
requires an explicit <code>allowHtmlPopups()</code>, and is still sanitised in the browser unless
<code>popups.sanitize</code> is disabled.</li>
<li>Geocoding is proxied through the application, so provider keys stay server-side.</li>
<li>The lazy asset route serves a fixed whitelist and verifies the resolved path stays inside the
package's own <code>dist/js</code>.</li>
</ul>

<h3>Fixed</h3>
<ul>
<li>The layer control was added twice, rendering two stacked switchers.</li>
<li>Marker icon options were written to <code>L.Icon.Default.prototype</code>, so two fields on one
page silently shared whichever icon rendered last.</li>
<li>The map was never removed on unmount, leaking a Leaflet instance, its DOM and its handlers on
every Inertia navigation.</li>
<li>A record with no geometry called <code>fitBounds</code> on an empty layer and threw
<code>Bounds are not valid</code>.</li>
<li>A GeoJSON string that failed to parse was passed through to Leaflet anyway, producing a blank map
with no error.</li>
<li>The Google layer was constructed before its SDK finished loading, throwing if a user switched to
it early.</li>
</ul>

<h3>Added</h3>
<ul>
<li>The field resolves its own model attribute, detecting GeoJSON, <code>"lat,lng"</code> strings,
positional and keyed arrays, and spatial value objects. Custom resolvers can be registered.</li>
<li>Editable form field: click-to-place, draggable markers, polygon/line/circle/rectangle drawing,
place search, browser geolocation, manual coordinate inputs, arrow-key nudging, and undo/redo.</li>
<li><code>relation()</code> plots a relation as one marker per related record.</li>
<li><code>fillsAddress()</code> reverse-geocodes a dropped pin into other Nova fields.</li>
<li><code>syncTo()</code> drives two existing number fields, so a resource can adopt the map with no
schema change.</li>
<li><code>linkToResource()</code> navigates to a record's detail page on marker click.</li>
<li><code>WithinGeofence</code> validation rule and <code>MapBoundsFilter</code> index filter.</li>
<li>Dark mode that follows Nova's theme, with a tile-provider registry covering OpenStreetMap, Carto,
Esri, OpenTopoMap, Stadia, Google, Mapbox and MapTiler, plus custom providers from config.</li>
<li>Data visualisation: <code>choropleth()</code>, <code>filterable()</code>, <code>timeline()</code>,
<code>route()</code>, <code>elevationProfile()</code>, <code>legend()</code>, <code>heatmap()</code>,
<code>clusterColorBy()</code>.</li>
<li>Quality of life: copy coordinates, open-in deeplinks, GeoJSON and GPX export, DMS coordinate
formatting, <code>maxBounds()</code>, <code>fullscreen()</code>, <code>locateControl()</code>,
<code>scaleControl()</code>, <code>accessibleTable()</code>, <code>snapshot()</code>,
<code>thumbnail()</code>.</li>
<li><code>php artisan nova-field-map:doctor</code> verifies assets, keys and tile reachability.</li>
<li>Config file and English and Italian translations.</li>
</ul>

<h3>Changed</h3>
<ul>
<li>Requires PHP 8.2, Laravel 11–13 and Nova 5. Nova 4 is no longer supported.</li>
<li>Build moved from laravel-mix to Vite 6, split into an entry bundle and lazily fetched chunks. The
bundle loaded on every Nova page went from 74.3&nbsp;kB gzipped to 11.2&nbsp;kB; Leaflet is fetched
only when a map is about to become visible.</li>
<li><code>FieldMap</code> and <code>FieldMapServiceProvider</code> are the new names.
<code>NovaFieldMap</code> and <code>NovaFieldMapServiceProvider</code> remain as deprecated aliases
until 4.0.</li>
<li>Components rewritten as Vue 3 <code>&lt;script setup&gt;</code> with scoped styles; the global
<code>.leaflet-*</code> overrides are gone.</li>
<li>Map containers carry <code>role="application"</code> and a label, and are keyboard focusable.</li>
<li>Dropped the unused <code>vuex</code>, <code>@inertiajs/inertia</code>, <code>scriptjs</code>,
<code>lodash</code> and <code>form-backend-validation</code> dependencies, and the unused
<code>spatie/laravel-package-tools</code> requirement.</li>
</ul>

<h3>Removed</h3>
<ul>
<li><code>exportImage()</code>, <code>minimap()</code>, <code>measure()</code> and
<code>popupActions()</code>. Each needed either another plugin or an approach that cannot work
reliably.</li>
</ul>
</section>

<section id="l-100"><h2>1.0.0</h2>
<ul><li>Initial release.</li></ul>
</section>

<section id="l-payload"><h2>Bundle sizes, 2.x against 3.0</h2>
<div class="tw"><table>
<thead><tr><th>Chunk</th><th>Gzipped</th><th>Fetched when</th></tr></thead>
<tbody>
<tr><td><code>field.js</code></td><td>11.2 kB</td><td>every Nova page</td></tr>
<tr><td><code>field.css</code></td><td>14.3 kB</td><td>every Nova page</td></tr>
<tr><td><code>lazy-core.js</code></td><td>52.7 kB</td><td>a map scrolls into view</td></tr>
<tr><td><code>lazy-draw.js</code></td><td>74.5 kB</td><td>an editable field with <code>draw()</code></td></tr>
<tr><td><code>lazy-sanitize.js</code></td><td>11.3 kB</td><td>a popup with <code>allowHtmlPopups()</code></td></tr>
<tr><td><code>lazy-google.js</code></td><td>3.3 kB</td><td><code>Tile::Google</code> is offered</td></tr>
<tr><td><code>lazy-heat.js</code></td><td>2.0 kB</td><td><code>heatmap()</code> is set</td></tr>
</tbody></table></div>
<p>2.x shipped a single 74.3&nbsp;kB gzipped bundle on every page whether or not it held a map.</p>
</section>`
},

};

/* ---- the playground page --------------------------------------- */
const PLAY_PAGE = {
  title:'Playground',
  nav:'Playground',
  sub:'Drive every method and watch three things change at once: the chain you would write, the field Nova would draw, and the payload the browser actually receives.',
  prev:'guide', next:'recipes',
  wide:true,
  mount:() => mountPlayground(),
  html:`
<section id="p-build"><h2>Build a field</h2>
<p>Start from a preset or set anything you like. Nothing here is a mock-up of a mock-up: the payload
pane is generated by the same rules as <code>mapMeta()</code> in <code>src/FieldMap.php</code>, so
the derived values — clustering forced off, the canvas threshold, a keyless tile being dropped —
behave here exactly as they do in your app.</p>

<div class="pg-bar">
  <h4>Start from</h4>
  <div class="pg-presets" id="pgPresets">
    ${Object.entries(PRESETS).map(([k, p], i) =>
      `<button data-preset="${k}" class="${i===0?'on':''}" title="${esc(p.d)}">${p.label}</button>`).join('')}
  </div>
  <button id="pgReset" class="pg-reset">Reset</button>
  <p class="pg-preset-note" id="pgPresetNote"></p>
</div>

<div class="pg">
  <div class="pg-left" id="pgControls"></div>

  <div class="pg-stage">
    <div class="pg-card">
      <div class="pg-ch">Preview<div class="sp"><span class="st" id="pgMode">Detail panel</span></div></div>
      <div class="pg-pbody">
        <div id="pgPreview"></div>
        <div class="pg-notes" id="pgNotes"></div>
      </div>
    </div>

    <div class="pg-card">
      <div class="pg-tabs" id="pgTabs" role="tablist">
        <button data-tab="php" role="tab" aria-selected="true">PHP</button>
        <button data-tab="payload" role="tab" aria-selected="false">Payload</button>
        <button id="pgCopy" class="pg-copy">Copy</button>
      </div>

      <div class="pg-pane" data-pane="php">
        <pre class="pg-code" id="pgPhp"></pre>
        <p class="pg-cap">Paste this into your resource’s <code>fields()</code>. Only the calls that
        differ from a default are emitted, which is how the chain stays short.</p>
      </div>

      <div class="pg-pane hidden" data-pane="payload">
        <div class="pg-payload" id="pgPayload"></div>
        <p class="pg-cap">Every key the Vue component receives. Rows marked <em>derived</em> are
        computed in PHP rather than set by you — hover one to see the rule.</p>
      </div>
    </div>
  </div>
</div>

</section>

<section id="p-read"><h2>How to read the payload</h2>
<p>The payload pane is the honest answer to “will this do what I need?”. Three things in it surprise
people, and all three are visible as you change the controls:</p>
<ul>
<li><b><code>cluster</code> ignores you below ten features.</b> Set the feature slider to 5 and turn
clustering on — the payload still says <code>false</code>. Clustering a handful of markers adds a
click between the user and the data.</li>
<li><b><code>useCanvas</code> flips at a thousand.</b> Past that, Leaflet switches renderer and
per-feature popups are dropped for a shared one, because a thousand DOM markers stall the page.</li>
<li><b><code>tiles</code> silently loses keyless providers.</b> Add Google without a key: it does not
appear. The alternative is a switcher entry that produces a grey box when selected.</li>
</ul>
</section>

<section id="p-fit"><h2>Deciding whether it fits</h2>
<p>If you can build the field you want above and the preview shows it, the package covers your case.
If you cannot, these are the usual reasons, and none of them are worked around:</p>
<div class="tw"><table>
<thead><tr><th>You need</th><th>Position</th></tr></thead>
<tbody>
<tr><td>A PNG of the rendered map</td><td>Not shipped. Canvas tainting blocks it on most tile providers. <code>exportData()</code> gives GeoJSON and GPX.</td></tr>
<tr><td>A Nova action inside a popup</td><td>Not shipped. Use <code>linkToResource()</code> and run the action on the detail page.</td></tr>
<tr><td>Bounds filtering on a GeoJSON column</td><td><code>MapBoundsFilter</code> needs a numeric column pair; a GeoJSON column would need a spatial index the package cannot assume.</td></tr>
<tr><td>Routing, turn-by-turn, isochrones</td><td>Out of scope. This is a field, not a routing engine.</td></tr>
<tr><td>Offline or self-hosted tiles</td><td>Supported — add a custom provider in <a href="#/configuration">config</a>.</td></tr>
<tr><td>A column shape not listed in the Guide</td><td>Supported — write a <code>GeometryResolver</code>. Custom resolvers are tried first.</td></tr>
</tbody></table></div>
</section>`
};

/* ---- the reference page, rendered from METHODS ------------------ */
const API_PAGE = {
  title:'API reference',
  nav:'API reference',
  sub:'All 58 public methods. Filter by group or search by name, signature or description.',
  prev:'commands', next:'tiles',
  mount:() => mountApi(),
  html:`
<section id="a-all"><h2>Every method</h2>
<div class="ax-bar">
  <input id="axQ" type="search" placeholder="Search methods…  (try: popup, cluster, escape)" autocomplete="off" spellcheck="false">
  <span class="ax-count" id="axCount"></span>
</div>
<div class="ax-groups" id="axGroups">
  <button data-g="all" class="on">All</button>
  ${GROUPS.map(([g, label]) => `<button data-g="${g}">${label}</button>`).join('')}
</div>
<div class="ax-list" id="axList"></div>
</section>

<section id="a-enums"><h2>Enums</h2>
<div class="tw"><table>
<thead><tr><th>Type</th><th>Cases</th></tr></thead>
<tbody>
<tr><td><code>Shape</code></td><td>${SHAPE_CASES.map(s => `<code>${s.enum}</code>`).join(', ')}</td></tr>
<tr><td><code>CoordinateFormat</code></td><td><code>CoordinateFormat::Decimal</code>, <code>CoordinateFormat::Dms</code></td></tr>
<tr><td><code>GoogleMapType</code></td><td><code>Roadmap</code>, <code>Satellite</code>, <code>Terrain</code>, <code>Hybrid</code></td></tr>
<tr><td><code>Tile</code></td><td>${TILE_CASES.map(t => `<code>${t.enum}</code>`).join(', ')}</td></tr>
<tr><td><code>MapType</code></td><td><code>GeoJson</code>, <code>LatLon</code> — deprecated, 2.x only</td></tr>
</tbody></table></div>
</section>

<section id="a-classes"><h2>Classes worth knowing</h2>
<div class="tw"><table>
<thead><tr><th>Class</th><th>Purpose</th></tr></thead>
<tbody>
<tr><td><code>Rules\\WithinGeofence</code></td><td>Validate that geometry falls inside a polygon or multipolygon, holes included.</td></tr>
<tr><td><code>Filters\\MapBoundsFilter</code></td><td>Filter an index by a drawn bounding box. Needs a numeric column pair.</td></tr>
<tr><td><code>Resolvers\\ResolverRegistry</code></td><td><code>register()</code> a custom <code>GeometryResolver</code>; custom ones are tried first.</td></tr>
<tr><td><code>Support\\GeoJson</code></td><td><code>collect()</code>, <code>point()</code>, <code>bounds()</code>, <code>firstCoordinate()</code>, <code>positions()</code>.</td></tr>
<tr><td><code>Support\\Coordinates</code></td><td><code>format()</code> — decimal or degrees-minutes-seconds.</td></tr>
<tr><td><code>Contracts\\Geocoder</code></td><td><code>search()</code> and <code>reverse()</code>. Swap the driver in config.</td></tr>
</tbody></table></div>
</section>`
};

function mountApi(){
  const list = document.getElementById('axList');
  const q = document.getElementById('axQ');
  const count = document.getElementById('axCount');
  const groups = document.getElementById('axGroups');
  if (!list) return;
  let g = 'all', term = '';

  const draw = () => {
    const t = term.trim().toLowerCase();
    const hits = METHODS.filter(m =>
      (g === 'all' || m.g === g) &&
      (!t || (m.n + ' ' + m.sig + ' ' + m.d + ' ' + m.ex).toLowerCase().includes(t)));

    count.textContent = `${hits.length} of ${METHODS.length}`;
    if (!hits.length) { list.innerHTML = `<p class="ax-none">Nothing matches “${esc(term)}”.</p>`; return; }

    let html = '', lastG = null;
    for (const m of hits) {
      if (m.g !== lastG) {
        const [, label, blurb] = GROUPS.find(x => x[0] === m.g);
        html += `<div class="ax-head"><h3>${label}</h3><span>${blurb}</span></div>`;
        lastG = m.g;
      }
      html += `<details class="ax-item${m.danger?' danger':''}${m.deprecated?' dep':''}" id="m-${m.n}">
        <summary><code>${m.n}</code>
          ${m.deprecated?'<i class="ax-tag dep">deprecated</i>':''}
          ${m.danger?'<i class="ax-tag warn">care</i>':''}
          <em>${esc(m.def)}</em></summary>
        <div class="ax-body">
          <pre class="ax-sig">${esc(m.sig.replace(/\\\\\$/g,'$'))}</pre>
          <p>${esc(m.d)}</p>
          <pre class="ax-ex">${esc(m.ex.replace(/\\\\\$/g,'$'))}</pre>
          ${m.ctl ? `<a class="ax-try" href="#/play">Try it in the playground →</a>` : ''}
        </div></details>`;
    }
    list.innerHTML = html;
  };

  q.addEventListener('input', () => { term = q.value; draw(); });
  groups.addEventListener('click', ev => {
    const b = ev.target.closest('[data-g]');
    if (!b) return;
    g = b.dataset.g;
    [...groups.children].forEach(x => x.classList.toggle('on', x === b));
    draw();
  });
  draw();

  /* #/api?m=popup opens that entry, so a control can link to it. */
  const want = (location.hash.split('?m=')[1] || '').replace(/[^a-zA-Z]/g, '');
  if (want) {
    const el = document.getElementById('m-' + want);
    if (el) { el.open = true; el.scrollIntoView({block:'center'}); el.classList.add('flash'); }
  }
}

/* ---- the config generator -------------------------------------- */
function mountConfig(){
  const host = document.getElementById('cfgControls');
  if (!host) return;
  const V = Object.fromEntries(CONFIG_KEYS.map(c => [c.k, c.val]));

  const row = c => {
    const v = V[c.k];
    let body;
    if (c.type === 'bool')
      body = `<button class="pg-tog${v?' on':''}${c.danger?' danger':''}" data-ck="${c.k}" role="switch" aria-checked="${!!v}"><i></i></button>`;
    else if (c.type === 'select')
      body = `<div class="pg-seg">${c.opts.map(o => `<button data-ck="${c.k}" data-v="${o}" class="${v===o?'on':''}">${o}</button>`).join('')}</div>`;
    else if (c.type === 'tiles')
      body = `<div class="pg-chips">${TILE_CASES.map(t => `<button data-cmulti="${c.k}" data-v="${t.v}" class="${v.includes(t.v)?'on':''}">${t.label}</button>`).join('')}</div>`;
    else if (c.type === 'num')
      body = `<input class="pg-in" type="number" data-ck="${c.k}" value="${v}">`;
    else
      body = `<input class="pg-in" type="text" data-ck="${c.k}" value="${esc(v)}" placeholder="${c.type==='env'?'leave empty to use env()':''}">`;
    return `<div class="pg-ctl${c.danger?' is-danger':''}">
      <label>${c.k} <em class="cfg-def">default ${esc(c.def)}</em></label>${body}
      <span class="pg-hint">${esc(c.d)}</span></div>`;
  };

  const php = () => {
    const g = k => V[k];
    const q = s => `'${s}'`;
    const envOr = c => g(c.k) ? q(g(c.k)) : c.def;
    return `<?php

return [
    'height' => ${q(g('height'))},

    'center' => [
        'latitude'  => ${g('center.latitude')},
        'longitude' => ${g('center.longitude')},
    ],

    'zoom' => ${g('zoom')},

    'tiles' => [
        'providers' => [${g('tiles.providers').map(q).join(', ')}],
        'dark'      => ${q(g('tiles.dark'))},
        'custom'    => [],
    ],

    'cluster' => [
        'enabled'         => ${g('cluster.enabled')},
        'disable_at_zoom' => ${g('cluster.disable_at_zoom')},
        'min_features'    => ${g('cluster.min_features')},
    ],

    'canvas_threshold' => ${g('canvas_threshold')},

    'popups' => [
        'sanitize' => ${g('popups.sanitize')},
    ],

    'google' => [
        'key'      => ${envOr(CONFIG_KEYS.find(c => c.k === 'google.key'))},
        'map_type' => ${q(g('google.map_type'))},
    ],

    'geocoder' => [
        'driver'       => ${q(g('geocoder.driver'))},
        'user_agent'   => ${q(g('geocoder.user_agent'))},
        'mapbox_key'   => ${envOr(CONFIG_KEYS.find(c => c.k === 'geocoder.mapbox_key'))},
        'maptiler_key' => ${envOr(CONFIG_KEYS.find(c => c.k === 'geocoder.maptiler_key'))},
        'cache_ttl'    => ${g('geocoder.cache_ttl')},
    ],

    'snapshot' => [
        'url'    => 'https://staticmap.openstreetmap.de/staticmap.php?center={lat},{lng}&zoom={zoom}&size={width}x{height}&markers={lat},{lng},red-pushpin',
        'width'  => ${g('snapshot.width')},
        'height' => ${g('snapshot.height')},
        'zoom'   => ${g('snapshot.zoom')},
    ],
];`;
  };

  const warn = () => {
    const out = [];
    if (!V['popups.sanitize'])
      out.push(['Sanitising is off', 'Any user who can write a popup column can now run JavaScript in an administrator’s session.', true]);
    if (V['tiles.providers'].includes('google') && !V['google.key'])
      out.push(['Google has no key', 'It will be dropped from every field’s payload.']);
    if (['mapbox','maptiler'].includes(V['geocoder.driver']) && !V[`geocoder.${V['geocoder.driver']}_key`])
      out.push(['The geocoder has no key', 'The search box will return nothing. <code>doctor</code> reports this as a failure.']);
    if (V['geocoder.driver'] === 'nominatim' && V['geocoder.cache_ttl'] === 0)
      out.push(['Caching is off on Nominatim', 'Its usage policy asks for modest traffic; a busy team will be rate-limited.', true]);
    if (V['cluster.min_features'] > 100)
      out.push(['Clustering rarely applies', `Nothing under ${V['cluster.min_features']} features will cluster.`]);
    return out.map(([t, d, w]) => `<div class="pg-note${w?' warn':''}"><b>${t}</b><span>${d}</span></div>`).join('');
  };

  const paintCfg = () => {
    host.innerHTML = CONFIG_KEYS.map(row).join('');
    document.getElementById('cfgOut').innerHTML = highlightPhp(php());
    const envs = CONFIG_KEYS.filter(c => c.type === 'env' && V[c.k]);
    document.getElementById('cfgEnv').textContent = CONFIG_KEYS
      .filter(c => c.type === 'env').map(c => `${c.env}=${V[c.k]}`).join('\n');
    document.getElementById('cfgWarn').innerHTML = warn();
  };

  host.addEventListener('click', ev => {
    const t = ev.target.closest('[data-ck][role="switch"]');
    if (t) { V[t.dataset.ck] = !V[t.dataset.ck]; return paintCfg(); }
    const s = ev.target.closest('.pg-seg [data-ck]');
    if (s) { V[s.dataset.ck] = s.dataset.v; return paintCfg(); }
    const m = ev.target.closest('[data-cmulti]');
    if (m) {
      const k = m.dataset.cmulti, list = [...V[k]], i = list.indexOf(m.dataset.v);
      if (i > -1) { if (list.length > 1) list.splice(i, 1); } else list.push(m.dataset.v);
      V[k] = list; return paintCfg();
    }
  });
  host.addEventListener('input', ev => {
    const el = ev.target.closest('[data-ck]');
    if (!el || el.getAttribute('role') === 'switch') return;
    V[el.dataset.ck] = el.type === 'number' ? Number(el.value) : el.value;
    document.getElementById('cfgOut').innerHTML = highlightPhp(php());
    document.getElementById('cfgEnv').textContent = CONFIG_KEYS
      .filter(c => c.type === 'env').map(c => `${c.env}=${V[c.k]}`).join('\n');
    document.getElementById('cfgWarn').innerHTML = warn();
  });

  document.getElementById('cfgCopy')?.addEventListener('click', async ev => {
    try { await navigator.clipboard.writeText(php()); } catch (e) {}
    ev.currentTarget.textContent = 'Copied';
    setTimeout(() => ev.currentTarget.textContent = 'Copy', 1400);
  });

  paintCfg();
}


/* The generated pages are registered here rather than written
   inline, because their content comes from the data above. */
PAGES.play = PLAY_PAGE;
PAGES.api = API_PAGE;
PAGES.configuration.mount = mountConfig;
PAGES.configuration.wide = true;
PAGES.api.wide = true;
PAGES.guide.next = 'play';
PAGES.recipes.prev = 'play';

/* ============================================================
   ROUTER + CHROME
   ============================================================ */
const root = document.documentElement;
const homePage = document.getElementById('home');
const docsPage = document.getElementById('docs');
const docBody  = document.getElementById('docBody');
const toc      = document.getElementById('toc');
const sideLinks = [...document.querySelectorAll('.sidenav a[href^="#/"]')];
const navLinks  = [...document.querySelectorAll('#nav a[href^="#/"]')];

let tocSpy = null;
let sections = [];

function route(){
  const id = (location.hash.replace('#/', '').split('#')[0]) || 'home';

  if (id === 'home' || !PAGES[id]) {
    homePage.classList.remove('hidden');
    docsPage.classList.add('hidden');
    sideLinks.forEach(a => a.removeAttribute('aria-current'));
    navLinks.forEach(a => a.setAttribute('aria-current', 'false'));
    sections = [];
    if (location.hash && location.hash !== '#/home') location.replace('#/home');
    scrollTo({ top: 0, behavior: 'auto' });
    return;
  }

  const page = PAGES[id];
  homePage.classList.add('hidden');
  docsPage.classList.remove('hidden');
  docsPage.querySelector('.docs').classList.toggle('wide', !!page.wide);

  const pager = [];
  if (page.prev) pager.push(`<a href="#/${page.prev}">Previous<b>${PAGES[page.prev].title}</b></a>`);
  if (page.next) pager.push(`<a class="next" href="#/${page.next}">Next<b>${PAGES[page.next].title}</b></a>`);

  docBody.innerHTML =
    `<h1>${page.title}</h1>` +
    (page.sub ? `<p class="sub">${page.sub}</p>` : '') +
    page.html +
    (pager.length ? `<div class="pager">${pager.join('')}</div>` : '');

  sideLinks.forEach(a => {
    const on = a.getAttribute('href') === '#/' + id;
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  navLinks.forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === '#/' + id)));

  page.mount?.();
  buildToc();
  scrollTo({ top: 0, behavior: 'auto' });
}

/* The right rail and the palette are built from the same array,
   so the three can never drift apart. */
function buildToc(){
  tocSpy?.disconnect(); tocSpy = null;
  toc.innerHTML = '';
  const rail = toc.closest('.onthispage');
  /* A wide page hides the rail through .docs.wide, so the inline style is
     cleared rather than set — otherwise it would override the class. The
     palette still wants the section list, so it is built either way. */
  rail.style.display = '';
  const wide = docsPage.querySelector('.docs').classList.contains('wide');
  if (wide) { sections = [...docBody.querySelectorAll('section[id]')].map(el => ({
      a:{textContent:(el.querySelector('h2')?.textContent || el.id).trim(),
         getAttribute:()=>'#'+el.id, setAttribute(){}}, el })); return; }

  sections = [...docBody.querySelectorAll('section[id]')].map(el => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + el.id;
    a.textContent = (el.querySelector('h2')?.textContent || el.id).trim();
    a.addEventListener('click', ev => {
      ev.preventDefault();
      el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    li.appendChild(a); toc.appendChild(li);
    return { a, el };
  });

  if (sections.length < 3) { rail.style.display = 'none'; return; }

  tocSpy = new IntersectionObserver(es => {
    const vis = es.filter(x => x.isIntersecting)
                  .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (!vis.length) return;
    const hit = sections.find(s => s.el === vis[0].target);
    if (hit) sections.forEach(s => s.a.setAttribute('aria-current', String(s === hit)));
  }, { rootMargin: '-12% 0px -72% 0px' });
  sections.forEach(s => tocSpy.observe(s.el));
}

addEventListener('hashchange', route);

/* ---- theme ------------------------------------------------ */
const mode = document.getElementById('mode');
const prefersDark = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => {
  const explicit = root.dataset.theme;
  return explicit ? explicit === 'dark' : prefersDark.matches;
};
const syncLabel = () => { mode.textContent = isDark() ? 'Light' : 'Dark'; };
mode.addEventListener('click', () => { root.dataset.theme = isDark() ? 'light' : 'dark'; syncLabel(); });
prefersDark.addEventListener('change', syncLabel);
syncLabel();

/* ---- progress --------------------------------------------- */
const bar = document.getElementById('progress');
let ticking = false;
const paintBar = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = (max > 0 ? Math.min(100, Math.max(0, (scrollY / max) * 100)) : 0) + '%';
  ticking = false;
};
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(paintBar); } }, { passive: true });
addEventListener('resize', paintBar, { passive: true });

/* ---- reveal ----------------------------------------------- */
const seen = new WeakSet();
const io = new IntersectionObserver(es => {
  for (const x of es) {
    if (!x.isIntersecting || seen.has(x.target)) continue;
    seen.add(x.target); x.target.classList.add('seen');
  }
}, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---- the hero panel loads its map -------------------------- */
/* Mirrors the real behaviour: the lazy Leaflet chunk is only
   fetched once the container is about to be seen, so the panel
   renders first and the map fills in. */
(() => {
  const skel = document.getElementById('heroSkel');
  const box = document.getElementById('heroMap');
  if (!skel || !box) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { skel.classList.add('gone'); return; }
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    setTimeout(() => skel.classList.add('gone'), 900);
  }, { threshold: .3 }).observe(box);
})();

/* ---- command palette -------------------------------------- */
const pal = document.getElementById('pal');
const input = document.getElementById('palInput');
const list = document.getElementById('palList');
const open = document.getElementById('openPal');
document.getElementById('kbd').textContent =
  /Mac|iPhone|iPad/.test(navigator.platform || '') ? '⌘K' : 'Ctrl K';

let rows = [], cursor = 0;
const items = () => ([
  { label: 'Home', hint: 'Page', href: '#/home' },
  ...Object.entries(PAGES).map(([id, p]) => ({ label: p.title, hint: 'Page', href: '#/' + id })),
  ...sections.map(s => ({ label: s.a.textContent, hint: 'Section', el: s.el })),
]);
const select = () => rows.forEach((r, i) => r.li.setAttribute('aria-selected', String(i === cursor)));
const go = item => {
  pal.hidden = true; open.focus();
  if (item.el) item.el.scrollIntoView({ behavior: 'smooth' });
  else if (item.href) location.hash = item.href;
};
const render = (q = '') => {
  const hits = items().filter(i => i.label.toLowerCase().includes(q.trim().toLowerCase()));
  list.innerHTML = ''; rows = []; cursor = 0;
  if (!hits.length) { list.innerHTML = '<li class="none">Nothing matches.</li>'; return; }
  hits.forEach((item, i) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.innerHTML = '<b></b><em></em>';
    li.querySelector('b').textContent = item.label;
    li.querySelector('em').textContent = item.hint;
    li.addEventListener('click', () => go(item));
    li.addEventListener('mousemove', () => { cursor = i; select(); });
    list.appendChild(li); rows.push({ li, item });
  });
  select();
};
const show = () => { pal.hidden = false; input.value = ''; render(); input.focus(); };
open.addEventListener('click', show);
input.addEventListener('input', () => render(input.value));
pal.addEventListener('click', ev => { if (ev.target === pal) { pal.hidden = true; open.focus(); } });
input.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') { pal.hidden = true; open.focus(); }
  else if (ev.key === 'ArrowDown' && rows.length) { ev.preventDefault(); cursor = (cursor + 1) % rows.length; select(); }
  else if (ev.key === 'ArrowUp' && rows.length) { ev.preventDefault(); cursor = (cursor - 1 + rows.length) % rows.length; select(); }
  else if (ev.key === 'Enter' && rows[cursor]) { ev.preventDefault(); go(rows[cursor].item); }
});
addEventListener('keydown', ev => {
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); pal.hidden ? show() : (pal.hidden = true); }
  else if (ev.key === '/' && pal.hidden && !/input|textarea/i.test(ev.target.tagName)) { ev.preventDefault(); show(); }
});

/* ---- boot ------------------------------------------------- */
route();
paintBar();
})();
