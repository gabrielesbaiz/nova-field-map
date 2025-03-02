# NovaFieldMap

[![Latest Version on Packagist](https://img.shields.io/packagist/v/gabrielesbaiz/nova-field-map.svg?style=flat-square)](https://packagist.org/packages/gabrielesbaiz/nova-field-map)
[![Total Downloads](https://img.shields.io/packagist/dt/gabrielesbaiz/nova-field-map.svg?style=flat-square)](https://packagist.org/packages/gabrielesbaiz/nova-field-map)

Custom Laravel Nova 4 map detail field.

Original code from [iMuMz/NovaFieldMap](https://github.com/iMuMz/NovaFieldMap)

## Features

- ✅ Support [Leaflet](https://leafletjs.com/)
- ✅ Support Google Maps
- ✅ Marker clustering
- ✅ Map height
- ✅ Latitude and longitude coordinates
- ✅ GeoJSON
- ✅ Marker popup
- ✅ Custom marker icons

## Installation

You can install the package via composer:

```bash
composer require gabrielesbaiz/nova-field-map
```

## Usage

```php
use Gabrielesbaiz\NovaFieldMap;


NovaFieldMap::make()
```

### Available Methods

#### Height
```
NovaFieldMap::make()
->height('400px') // default is 300px
```
#### Google Maps
By default the provider is OpenStreetMaps.<br> 
You must set your Google Maps API key (https://developers.google.com/maps/documentation/javascript/get-api-key).
```
NovaFieldMap::make()
->googleApiKey('')
->googleMapType('roadmap'), // roadmap, satellite or hybrid
```
#### Latitude / Longitude (Point)
```
NovaFieldMap::make('')
->type('LatLon')
->point($this->my_latitude,$this->my_longitude)
```
#### GeoJSON
```
NovaFieldMap::make()
->type('GeoJson')
->geoJson('')
```
#### GeoJson Example 
```
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "popup": "I am a Popup"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          23.8623046875,
          -30.221101852485987
        ]
      }
    }
  ]
}
```

#### Popup
```
NovaFieldMap::make()
->popup('popup')
```
#### Custom Marker Icon
```
NovaFieldMap::make()
->markerIcon('/images/marker-icon.png')
```
You can pass additional parameters to set the icon size and anchor
```
->markerIcon('/images/marker-icon.png',[100,100],[50,50])
```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md) for details.

## Security Vulnerabilities

Please review [our security policy](../../security/policy) on how to report security vulnerabilities.

## Credits

- [Chad Copeland](https://github.com/iMuMz)
- [Gabriele Sbaiz](https://github.com/gabrielesbaiz)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
