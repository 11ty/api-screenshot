# api-screenshot

## Usage

Links have the formats:
* `https://screenshot.11ty.dev/1.0/:url/`
* `https://screenshot.11ty.dev/1.0/:url/:size/`
* `https://screenshot.11ty.dev/1.0/:url/:size/:aspectratio/`

Notes:
* `url` must be URI encoded.
* Valid `size` values:
  * `small`: `420×___`
  * `medium`: `600×___`
  * `large`: `1024×___`
  * `opengraph`: `1200×630`, `aspectratio` is ignored.
* Valid `aspectratio` values: `1`, `0.5625`