# Screenshot API

A runtime service to use live website screenshots on your site.

## Usage

Image URLs have the formats:

```
https://v1.screenshot.11ty.dev/1.0/:url/
https://v1.screenshot.11ty.dev/1.0/:url/:size/
https://v1.screenshot.11ty.dev/1.0/:url/:size/:aspectratio/
https://v1.screenshot.11ty.dev/1.0/:url/:size/:aspectratio/:zoom/
```

* `url` must be URI encoded.
* Valid `size` values:
  * `small`: 375×___ (default)
  * `medium`: 650×___
  * `large`: 1024×___
    * `aspectratio` of `9:16` is not supported (throws an error)
  * `opengraph`: 1200×630
    * `aspectratio` and `zoom` are ignored (no errors thrown)
* Valid `aspectratio` values:
  * `1:1` (default)
  * `9:16`
* Valid `zoom` values:
  * `bigger` (1.4 devicePixelRatio)
  * `smaller` (.71 devicePixelRatio)