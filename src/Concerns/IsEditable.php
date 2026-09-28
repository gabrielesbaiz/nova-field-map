<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Concerns;

use Gabrielesbaiz\NovaFieldMap\Enums\Shape;

/**
 * Everything that only applies when the field is editable on a form.
 *
 * 2.x forced showOnUpdate to false and shipped a placeholder text input, so
 * a map could be read but never set.
 */
trait IsEditable
{
    protected bool $editable = false;

    /** @var array<int, Shape> */
    protected array $shapes = [Shape::Point];

    protected bool $geocoderEnabled = false;

    protected bool $geolocationEnabled = true;

    protected bool $manualInputs = true;

    protected float $nudgeStep = 0.0001;

    /** @var array<string, string> */
    protected array $addressTargets = [];

    protected ?string $syncLatitudeField = null;

    protected ?string $syncLongitudeField = null;

    protected string $storeAs = 'geojson';

    /**
     * Show the map on create and update forms.
     */
    public function editable(bool $editable = true): static
    {
        $this->editable = $editable;
        $this->showOnUpdate = $editable;
        $this->showOnCreation = $editable;

        return $this;
    }

    /**
     * Which geometry the user may draw. Implies editable().
     */
    public function draw(Shape ...$shapes): static
    {
        $this->shapes = $shapes === [] ? [Shape::Point] : array_values($shapes);

        return $this->editable();
    }

    /**
     * Add a place search box above the map.
     */
    public function geocoder(bool $enabled = true): static
    {
        $this->geocoderEnabled = $enabled;

        return $this;
    }

    public function geolocation(bool $enabled = true): static
    {
        $this->geolocationEnabled = $enabled;

        return $this;
    }

    /**
     * Show the numeric latitude and longitude inputs beside the map.
     */
    public function manualInputs(bool $enabled = true): static
    {
        $this->manualInputs = $enabled;

        return $this;
    }

    /**
     * How far one arrow-key press moves the marker, in degrees.
     */
    public function nudgeStep(float $degrees): static
    {
        $this->nudgeStep = $degrees;

        return $this;
    }

    /**
     * Reverse-geocode a dropped pin into other fields on the same form.
     *
     * Keys are normalized address components — street, house_number, city,
     * postcode, state, country, country_code — and values are the Nova field
     * attributes to fill.
     *
     * @param  array<string, string>  $targets
     */
    public function fillsAddress(array $targets): static
    {
        $this->addressTargets = $targets;

        return $this->geocoder();
    }

    /**
     * Keep two existing Nova number fields in step with the marker.
     *
     * Lets a resource adopt the map without changing its schema: the map
     * writes nothing itself, the two fields still own the columns.
     */
    public function syncTo(string $latitudeField, string $longitudeField): static
    {
        $this->syncLatitudeField = $latitudeField;
        $this->syncLongitudeField = $longitudeField;
        $this->storeAs = 'none';

        return $this->editable();
    }

    /**
     * Store the submitted geometry as a GeoJSON string.
     */
    public function storeAsGeoJson(): static
    {
        $this->storeAs = 'geojson';

        return $this;
    }

    /**
     * Store the submitted geometry as "lat,lng" in a single column.
     */
    public function storeAsLatLngString(): static
    {
        $this->storeAs = 'latlng';

        return $this;
    }

    /**
     * Store the submitted geometry across the coordinates() column pair.
     */
    public function storeAsColumns(): static
    {
        $this->storeAs = 'columns';

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    protected function editableMeta(): array
    {
        return [
            'editable' => $this->editable,
            'shapes' => array_map(static fn (Shape $shape): string => $shape->value, $this->shapes),
            'geocoder' => $this->geocoderEnabled,
            'geolocation' => $this->geolocationEnabled,
            'manualInputs' => $this->manualInputs,
            'nudgeStep' => $this->nudgeStep,
            'addressTargets' => $this->addressTargets,
            'syncLatitudeField' => $this->syncLatitudeField,
            'syncLongitudeField' => $this->syncLongitudeField,
            'storeAs' => $this->storeAs,
            // Only a single-marker field can be represented by two numbers.
            'singleShape' => $this->shapes === [Shape::Point],
        ];
    }
}
