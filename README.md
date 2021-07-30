# api-screenshot

## Usage

Links have the formats:
* `https://screenshot.11ty.dev/1.0/:url/`
* `https://screenshot.11ty.dev/1.0/:url/:size/`
* `https://screenshot.11ty.dev/1.0/:url/:size/:aspectratio/`

Notes:
* `url` must be URI encoded.
* Valid `size` values:
  * `small`: 375×___ (default)
  * `medium`: 650×___
  * `large`: 1024×___ (`aspectratio` of `9:16` is not supported)
  * `opengraph`: 1200×630 (`aspectratio` is ignored)
* Valid `aspectratio` values: `1:1` (default), `9:16`